from sqlalchemy import func, DateTime
import logging
from datetime import datetime, timedelta

from src.models.tracks.track import Track

from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.web3_provider import get_eth_web3

logger = StructuredLogger(__name__)
web3 = get_eth_web3()

update_aggregate_playlist_query = """
with playlist_saves as (
    select
        save_item_id,
        count(*) as save_count
    from
        saves s
    where
        s.is_current is true
        and s.is_delete is false
        and (s.save_type = 'playlist' or s.save_type = 'album')
    group by
        save_item_id
),
playlist_reposts as (
    select
        repost_item_id,
        count(*) as repost_count
    from
        reposts r
    where
        r.is_current is true
        and r.is_delete is false
        and (r.repost_type = 'playlist' or r.repost_type = 'album')
    group by
        repost_item_id
),
new_aggregate_playlist as (
    select
        ap.playlist_id,
        coalesce(ps.save_count, 0) as save_count,
        coalesce(pr.repost_count, 0) as repost_count
    from
        aggregate_playlist ap
        left join playlist_saves ps on ap.playlist_id = ps.save_item_id
        left join playlist_reposts pr on ap.playlist_id = pr.repost_item_id
)
update
    aggregate_playlist ap
set
    save_count = nap.save_count,
    repost_count = nap.repost_count
from new_aggregate_playlist nap
where
    ap.playlist_id = nap.playlist_id
    and (ap.save_count != nap.save_count or ap.repost_count != nap.repost_count)
returning ap.playlist_id;
"""

update_aggregate_track_query = """
with track_saves as (
  select
    save_item_id,
    count(*) as save_count
  from
    saves s
  where
    s.is_current is true
    and s.is_delete is false
    and s.save_type = 'track'
  group by
    save_item_id
),
track_reposts as (
  select
    repost_item_id,
    count(*) as repost_count
  from
    reposts r
  where
    r.is_current is true
    and r.is_delete is false
    and r.repost_type = 'track'
  group by
    repost_item_id
),
new_aggregate_track as (
  select
    ap.track_id,
    coalesce(ps.save_count, 0) as save_count,
    coalesce(pr.repost_count, 0) as repost_count
  from
    aggregate_track ap
    left join track_saves ps on ap.track_id = ps.save_item_id
    left join track_reposts pr on ap.track_id = pr.repost_item_id
)
update
  aggregate_track at
set
  save_count = nat.save_count,
  repost_count = nat.repost_count
from
  new_aggregate_track nat
where
  at.track_id = nat.track_id
  and (
    at.save_count != nat.save_count
    or at.repost_count != nat.repost_count
  )
returning at.track_id;
"""

update_aggregate_user_query = """
with user_repost as (
  select
    user_id,
    count(*) as repost_count
  from
    reposts r
  where
    r.is_current IS TRUE
    AND r.is_delete IS FALSE
  group by
    user_id
),
user_save as (
  select
    user_id,
    count(*) as track_save_count
  from
    saves s
  where
    s.is_current IS TRUE
    AND s.is_delete IS FALSE
    AND s.save_type = 'track'
  group by
    user_id
),
user_following as (
  select
    follower_user_id as user_id,
    count(*) as following_count
  from
    follows
  where
    is_current = true
    and is_delete = false
  group by
    follower_user_id
),
user_follower as (
  select
    followee_user_id as user_id,
    count(*) as follower_count
  from
    follows
  where
    is_current = true
    and is_delete = false
  group by
    followee_user_id
),
user_album as (
  select
    playlist_owner_id as user_id,
    count(*) as album_count
  from
    playlists p
  where
    p.is_album IS TRUE
    AND p.is_current IS TRUE
    AND p.is_delete IS FALSE
    AND p.is_private IS FALSE
  group by
    playlist_owner_id
),
user_playlist as (
  select
    playlist_owner_id as user_id,
    count(*) as playlist_count
  from
    playlists p
  where
    p.is_album IS false
    AND p.is_current IS TRUE
    AND p.is_delete IS FALSE
    AND p.is_private IS FALSE
  group by
    playlist_owner_id
),
user_track as (
  select
    owner_id as user_id,
    count(*) as track_count
  from
    tracks t
  where
    t.is_current is true
    and t.is_delete is false
    and t.is_unlisted is false
    and t.is_available is true
    and t.stem_of is null
  group by
    owner_id
),
new_aggregate_user as (
  select
    ap.user_id,
    coalesce(ut.track_count, 0) as track_count,
    coalesce(up.playlist_count, 0) as playlist_count,
    coalesce(ua.album_count, 0) as album_count,
    coalesce(ufollower.follower_count, 0) as follower_count,
    coalesce(ufollowing.following_count, 0) as following_count,
    coalesce(ur.repost_count, 0) as repost_count,
    coalesce(us.track_save_count, 0) as track_save_count
  from
    aggregate_user ap
    left join user_track ut on ap.user_id = ut.user_id
    left join user_playlist up on ap.user_id = up.user_id
    left join user_album ua on ap.user_id = ua.user_id
    left join user_follower ufollower on ap.user_id = ufollower.user_id
    left join user_following ufollowing on ap.user_id = ufollowing.user_id
    left join user_save us on ap.user_id = us.user_id
    left join user_repost ur on ap.user_id = ur.user_id
)
update
  aggregate_user au
set
  track_count = nau.track_count,
  playlist_count = nau.playlist_count,
  album_count = nau.album_count,
  follower_count = nau.follower_count,
  following_count = nau.following_count,
  repost_count = nau.repost_count,
  track_save_count = nau.track_save_count
from
  new_aggregate_user nau
where
  au.user_id = nau.user_id
  and (
    au.track_count != nau.track_count
    or au.playlist_count != nau.playlist_count
    or au.album_count != nau.album_count
    or au.follower_count != nau.follower_count
    or au.following_count != nau.following_count
    or au.repost_count != nau.repost_count
    or au.track_save_count != nau.track_save_count
  )
returning au.user_id;
"""


def convert_timestamp(release_date_str):
    parts = release_date_str.split(" ")
    time_zone_offset = parts[-1]  # Should be "GMT-0700" in your example

    # Create a datetime object without the time zone offset
    date_str_no_offset = " ".join(parts[:-1])
    date_time = datetime.strptime(date_str_no_offset, "%a %b %d %Y %H:%M:%S")

    # Extract the offset values (hours and minutes)
    hours_offset = int(time_zone_offset[4:6])
    minutes_offset = int(time_zone_offset[6:])

    # Calculate the time zone offset as a timedelta
    offset = timedelta(hours=hours_offset, minutes=minutes_offset)

    # Adjust the datetime using the offset
    adjusted_datetime = date_time - offset

    # Convert the adjusted datetime to an epoch timestamp
    epoch_timestamp = int(adjusted_datetime.timestamp())
    return epoch_timestamp


@log_duration(logger)
def _publish_scheduled_releases(session):
    latest_block = web3.eth.get_block("latest")
    current_timestamp = latest_block.timestamp + 1698426565

    candidate_tracks = (
        session.query(Track)
        .filter(
            Track.is_unlisted,
            Track.release_date.isnot(None),  # Filter for non-null release_date
        )
        .order_by(Track.created_at.asc())
        .all()
    )
    # convert release date to utc
    for candidate_track in candidate_tracks:
        unix_time = convert_timestamp(candidate_track.release_date)
        release_date_day = datetime.fromtimestamp(unix_time).date()
        candidate_created_at_day = candidate_track.created_at.date()

        if (
            current_timestamp >= unix_time
            and release_date_day > candidate_created_at_day
        ):
            candidate_track.is_unlisted = False
    # compare w created_at

    return


# ####### CELERY TASKS ####### #
@celery.task(name="publish_scheduled_releases", bind=True)
def publish_scheduled_releases(self):
    logger.info(f"asdf hi")
    redis = publish_scheduled_releases.redis
    db = publish_scheduled_releases.db

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(
        "publish_scheduled_releases_lock", blocking_timeout=25, timeout=600
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        logger.info(f"asdf have_lock {have_lock}")
        if have_lock:
            with db.scoped_session() as session:
                _publish_scheduled_releases(session)

        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
        raise e
    finally:
        if have_lock:
            update_lock.release()
