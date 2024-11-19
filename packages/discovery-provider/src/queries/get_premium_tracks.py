import logging  # pylint: disable=C0302

from src.api.v1.helpers import extend_track, format_limit, format_offset
from src.queries.generate_unpopulated_trending_tracks import (
    make_generate_unpopulated_trending,
    make_trending_tracks_cache_key,
)
from src.queries.query_helpers import add_users_to_tracks, populate_track_metadata
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import use_redis_cache

logger = logging.getLogger(__name__)

DEFAULT_PREMIUM_TRACKS_LIMIT = 100


def get_usdc_purchase_tracks(args, strategy):
    """Gets USDC purchase tracks from trending by getting the currently cached tracks and then populating them."""

    # Decode user_id if necessary
    current_user_id = args.get("user_id")
    current_user_id = decode_string_id(current_user_id) if current_user_id else None
    limit = format_limit(args, DEFAULT_PREMIUM_TRACKS_LIMIT)
    offset = format_offset(args)
    time = args.get("time", "week")
    time_range = "week" if time not in ["week", "month", "year", "allTime"] else time
    genre = args.get("genre", None)

    db = get_db_read_replica()
    with db.scoped_session() as session:
        key = make_trending_tracks_cache_key(time_range, genre, strategy.version)
        key += ":usdc_purchase_only"

        # Will try to hit cached trending from task, falling back
        # to generating it here if necessary and storing it with no TTL
        (tracks, track_ids) = use_redis_cache(
            key,
            None,
            make_generate_unpopulated_trending(
                session=session,
                genre=genre,
                time_range=time_range,
                strategy=strategy,
                exclude_gated=False,
                usdc_purchase_only=True,
            ),
        )

        # apply limit and offset
        tracks = tracks[offset : limit + offset]
        track_ids = track_ids[offset : limit + offset]

        # populate track metadata
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        tracks_map = {track["track_id"]: track for track in tracks}

        # Re-sort the populated tracks b/c it loses sort order in sql query
        sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

        add_users_to_tracks(session, tracks, current_user_id)

        return list(map(extend_track, sorted_tracks))
