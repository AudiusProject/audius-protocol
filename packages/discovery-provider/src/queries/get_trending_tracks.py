from typing import Optional, TypedDict

from sqlalchemy.orm.session import Session

from src.gated_content.constants import SHOULD_TRENDING_EXCLUDE_GATED_TRACKS
from src.queries.generate_unpopulated_trending_tracks import (
    TRENDING_TRACKS_LIMIT,
    make_generate_unpopulated_trending,
    make_trending_tracks_cache_key,
)
from src.queries.query_helpers import add_users_to_tracks, populate_track_metadata
from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import use_redis_cache


class GetTrendingTracksArgs(TypedDict, total=False):
    current_user_id: Optional[int]
    genre: Optional[str]
    time: str
    exclude_gated: bool
    limit: int
    offset: int


def get_trending_tracks(args: GetTrendingTracksArgs, strategy: BaseTrendingStrategy):
    """Gets trending by getting the currently cached tracks and then populating them."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_trending_tracks_with_session(session, args, strategy)


def _get_trending_tracks_with_session(
    session: Session, args: GetTrendingTracksArgs, strategy: BaseTrendingStrategy
):
    current_user_id, genre, time, exclude_gated, limit, offset = (
        args.get("current_user_id"),
        args.get("genre"),
        args.get("time", "week"),
        args.get("exclude_gated", SHOULD_TRENDING_EXCLUDE_GATED_TRACKS),
        args.get("limit", TRENDING_TRACKS_LIMIT),
        args.get("offset", 0),
    )
    time_range = "week" if time not in ["week", "month", "year", "allTime"] else time
    key = make_trending_tracks_cache_key(time_range, genre, strategy.version)

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
            exclude_gated=exclude_gated,
        ),
    )
    tracks = tracks[offset : limit + offset]
    track_ids = track_ids[offset : limit + offset]
    # populate track metadata
    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
    tracks_map = {track["track_id"]: track for track in tracks}

    # Re-sort the populated tracks b/c it loses sort order in sql query
    sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

    add_users_to_tracks(session, tracks, current_user_id)
    return sorted_tracks
