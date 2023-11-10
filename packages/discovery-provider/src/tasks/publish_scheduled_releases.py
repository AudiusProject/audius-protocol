from datetime import datetime, timedelta
from datetime import datetime

from src.models.tracks.track import Track

from src.tasks.celery_app import celery
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.web3_provider import get_eth_web3

logger = StructuredLogger(__name__)
web3 = get_eth_web3()
publish_scheduled_releases_cursor_key = "publish_scheduled_releases_cursor"
batch_size = 1000


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
def _publish_scheduled_releases(session, redis):
    latest_block = web3.eth.get_block("latest")
    current_timestamp = latest_block.timestamp + 86400
    # Get the value from Redis and decode it to a string
    redis_value = redis.get(publish_scheduled_releases_cursor_key).decode()
    logger.info(f"asdf redis_value {redis_value}")
    # Convert the string to a float, then to an integer
    previous_cursor = datetime.fromtimestamp(int(float(redis_value)))
    if not previous_cursor:
        previous_cursor = datetime.min

    candidate_tracks = (
        session.query(Track)
        .filter(
            Track.is_unlisted,
            Track.release_date.isnot(None),  # Filter for non-null release_date
            Track.created_at >= previous_cursor,
        )
        .order_by(Track.created_at.asc())
        .limit(batch_size)
        .all()
    )
    # convert release date to utc
    published_releases = []
    for candidate_track in candidate_tracks:
        logger.info(f"asdf candidate_track.release_date {candidate_track.release_date}")
        try:
            unix_time = convert_timestamp(candidate_track.release_date)
            release_date_day = datetime.fromtimestamp(unix_time).date()
        except Exception:
            continue
        candidate_created_at_day = candidate_track.created_at.date()
        logger.info(f"asdf candidate_created_at_day {candidate_created_at_day}")
        if (
            current_timestamp >= unix_time
            and release_date_day > candidate_created_at_day
        ):
            candidate_track.is_unlisted = False
            published_releases.append(candidate_track)
            logger.info(f"asdf candidate_track {candidate_track}")

    if candidate_tracks:
        logger.info(f"asdf candidate_tracks[-1] {candidate_tracks[-1]}")
        redis.set(
            publish_scheduled_releases_cursor_key, candidate_tracks[-1].created_at.timestamp()
        )
    return


# ####### CELERY TASKS ####### #
@celery.task(name="publish_scheduled_releases", bind=True)
def publish_scheduled_releases(self):
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
        if have_lock:
            with db.scoped_session() as session:
                _publish_scheduled_releases(session, redis)

        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
        raise e
    finally:
        if have_lock:
            update_lock.release()
