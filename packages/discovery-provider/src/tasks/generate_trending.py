import logging  # pylint: disable=C0302
from datetime import datetime, timedelta
from urllib.parse import unquote

from sqlalchemy import desc, func

from src.models.social.aggregate_plays import AggregatePlay
from src.models.social.play import Play
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.queries import response_name_constants
from src.queries.query_helpers import (
    get_genre_list,
    get_karma,
    get_repost_counts,
    get_save_counts,
)

logger = logging.getLogger(__name__)

trending_cache_hits_key = "trending_cache_hits"
trending_cache_miss_key = "trending_cache_miss"
trending_cache_total_key = "trending_cache_total"


time_delta_map = {
    "year": timedelta(weeks=52),
    "month": timedelta(days=30),
    "week": timedelta(weeks=1),
    "day": timedelta(days=1),
}


# Returns listens counts for tracks, subject to time and
# genre restrictions.
# Returns [{ track_id: number, listens: number }]
def get_listen_counts(session, time, genre, limit, offset, net_multiplier=1):
    # Adds a created_at filter
    # on the base query, if applicable.
    #
    # If no `time` param, that means
    # no filter so we return base_query
    # to get all time plays.
    def with_time_filter(base_query, time):
        delta = None
        if not time:
            return base_query
        delta = time_delta_map.get(time)
        if not delta:
            logger.warning(f"Invalid time passed to get_listen_counts: {time}")
            return base_query
        return base_query.filter(Play.created_at > datetime.now() - delta)

    # Adds a genre filter
    # on the base query, if applicable.
    def with_genre_filter(base_query, genre):
        if not genre:
            return base_query

        # Parse encoded characters, such as Hip-Hop%252FRap -> Hip-Hop/Rap
        genre = unquote(genre)

        # Use a list of genres rather than a single genre
        # string to account for umbrella genres
        # like 'Electronic
        genre_list = get_genre_list(genre)
        return base_query.filter(Track.genre.in_(genre_list))

    # Construct base query
    if time:
        # If we want to query plays by time, use the plays table directly
        base_query = session.query(
            Play.play_item_id, func.count(Play.id).label("count"), Track.created_at
        ).join(Track, Track.track_id == Play.play_item_id)
    else:
        # Otherwise, it's safe to just query over the aggregate plays table (all time)
        base_query = session.query(
            AggregatePlay.play_item_id.label("id"),
            AggregatePlay.count.label("count"),
            Track.created_at,
        ).join(Track, Track.track_id == AggregatePlay.play_item_id)

    base_query = base_query.filter(
        Track.is_current == True,
        Track.is_delete == False,
        Track.is_unlisted == False,
        Track.stem_of == None,
    )

    if time:
        base_query = base_query.group_by(Play.play_item_id, Track.created_at)

    # Add filters to query
    base_query = with_time_filter(base_query, time)
    base_query = with_genre_filter(base_query, genre)

    # Add limit + offset + sort
    base_query = (
        base_query.order_by(desc("count")).limit(limit * net_multiplier).offset(offset)
    )

    listens = base_query.all()

    # Format the results
    listens = [
        {"track_id": listen[0], "listens": listen[1], "created_at": listen[2]}
        for listen in listens
    ]
    return listens


def generate_trending(session, time, genre, limit, offset, strategy):
    score_params = strategy.get_score_params()
    xf = score_params["xf"]
    pt = score_params["pt"]
    nm = score_params["nm"] if "nm" in score_params else 1

    # Get listen counts
    listen_counts = get_listen_counts(session, time, genre, limit, offset, nm)

    track_ids = [track[response_name_constants.track_id] for track in listen_counts]

    # Generate track id -> created_at date
    track_created_at_dict = {
        record["track_id"]: record["created_at"] for record in listen_counts
    }

    agg_track_rows = (
        session.query(
            AggregateTrack.track_id,
            AggregateTrack.save_count,
            AggregateTrack.repost_count,
        )
        .filter(AggregateTrack.track_id.in_(track_ids))
        .all()
    )

    # Generate track_id --> repost_count mapping
    track_repost_counts = {r["track_id"]: r["repost_count"] for r in agg_track_rows}

    # Query repost count with respect to rolling time frame in URL (e.g. /trending/week -> window = rolling week)
    track_repost_counts_for_time = get_repost_counts(
        session, False, True, track_ids, None, None, time
    )

    # Generate track_id --> windowed_repost_count mapping
    track_repost_counts_for_time = {
        repost_item_id: repost_count
        for (repost_item_id, repost_count, repost_type) in track_repost_counts_for_time
        if repost_type == RepostType.track
    }

    # Query follower info for each track owner
    # Query each track owner
    track_owners_query = (
        session.query(Track.track_id, Track.owner_id).filter(
            Track.is_current == True,
            Track.is_unlisted == False,
            Track.stem_of == None,
            Track.track_id.in_(track_ids),
        )
    ).all()

    # Generate track_id <-> owner_id mapping
    track_owner_dict = dict(track_owners_query)
    # Generate list of owner ids
    track_owner_list = [owner_id for (track_id, owner_id) in track_owners_query]

    follower_counts = (
        session.query(AggregateUser.user_id, AggregateUser.follower_count)
        .filter(AggregateUser.user_id.in_(track_owner_list))
        .all()
    )
    follower_count_dict = {
        user_id: follower_count
        for (user_id, follower_count) in follower_counts
        if follower_count > pt
    }

    # Query save counts

    # Generate track_id --> save_count mapping
    track_save_counts = {r["track_id"]: r["save_count"] for r in agg_track_rows}

    # Query save counts with respect to rolling time frame in URL (e.g. /trending/week -> window = rolling week)
    save_counts_for_time = get_save_counts(
        session, False, True, track_ids, None, None, time
    )
    # Generate track_id --> windowed_save_count mapping
    track_save_counts_for_time = {
        save_item_id: save_count
        for (save_item_id, save_count, save_type) in save_counts_for_time
        if save_type == SaveType.track
    }

    karma_query = get_karma(
        session, tuple(track_ids), strategy, None, False, xf, strategy
    )
    karma_counts_for_id = dict(karma_query)

    trending_tracks = []
    for track_entry in listen_counts:
        track_id = track_entry[response_name_constants.track_id]

        # Populate repost counts
        track_entry[response_name_constants.repost_count] = track_repost_counts.get(
            track_id, 0
        )

        # Populate repost counts with respect to time
        track_entry[response_name_constants.windowed_repost_count] = (
            track_repost_counts_for_time.get(track_id, 0)
        )

        # Populate save counts
        track_entry[response_name_constants.save_count] = track_save_counts.get(
            track_id, 0
        )

        # Populate save counts with respect to time
        track_entry[response_name_constants.windowed_save_count] = (
            track_save_counts_for_time.get(track_id, 0)
        )

        # Populate owner follower count
        owner_id = track_owner_dict[track_id]
        owner_follow_count = follower_count_dict.get(owner_id, 0)
        track_entry[response_name_constants.track_owner_id] = owner_id
        track_entry[response_name_constants.owner_follower_count] = owner_follow_count

        # Populate created at timestamps
        if track_id in track_created_at_dict:
            # datetime needs to be in isoformat for json.dumps() in `update_trending_cache()` to
            # properly process the dp response and add to redis cache
            # timespec = specifies additional components of the time to include
            track_entry[response_name_constants.created_at] = track_created_at_dict[
                track_id
            ].isoformat(timespec="seconds")
        else:
            track_entry[response_name_constants.created_at] = None

        track_entry["karma"] = karma_counts_for_id.get(track_id, 0)

        trending_tracks.append(track_entry)

    final_resp = {}
    final_resp["listen_counts"] = trending_tracks
    return final_resp
