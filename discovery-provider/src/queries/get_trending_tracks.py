from operator import ge
from typing import Optional, TypedDict

from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from src.models.tracks.track_trending_score import TrackTrendingScore
from src.premium_content.constants import SHOULD_TRENDING_FILTER_OUT_PREMIUM_TRACKS
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import add_users_to_tracks, populate_track_metadata
from src.tasks.generate_trending import generate_trending
from src.trending_strategies.base_trending_strategy import BaseTrendingStrategy
from src.trending_strategies.trending_strategy_factory import DEFAULT_TRENDING_VERSIONS
from src.trending_strategies.trending_type_and_version import (
    TrendingType,
    TrendingVersion,
)
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import use_redis_cache

TRENDING_LIMIT = 100
TRENDING_TTL_SEC = 30 * 60


def make_trending_cache_key(
    time_range, genre, version=DEFAULT_TRENDING_VERSIONS[TrendingType.TRACKS]
):
    """Makes a cache key resembling `generated-trending:week:electronic`"""
    version_name = (
        f":{version.name}"
        if version != DEFAULT_TRENDING_VERSIONS[TrendingType.TRACKS]
        else ""
    )
    return f"generated-trending{version_name}:{time_range}:{(genre.lower() if genre else '')}"


def generate_unpopulated_trending(
    session,
    genre,
    time_range,
    strategy,
    filter_premium=SHOULD_TRENDING_FILTER_OUT_PREMIUM_TRACKS,
    limit=TRENDING_LIMIT,
):
    trending_tracks = generate_trending(session, time_range, genre, limit, 0, strategy)

    track_scores = [
        strategy.get_track_score(time_range, track)
        for track in trending_tracks["listen_counts"]
    ]
    sorted_track_scores = sorted(
        track_scores, key=lambda k: (k["score"], k["track_id"]), reverse=True
    )

    # Re apply the limit just in case we did decide to include more tracks in the scoring than the limit
    # Only limit the number of sorted tracks here if we are not later
    # filtering out the premium tracks. Otherwise, the number of
    # tracks we return later may be smaller than the limit.
    # If we don't limit it here, we limit it later after getting the
    # unpopulated tracks.
    should_apply_limit_early = not filter_premium
    if should_apply_limit_early:
        sorted_track_scores = sorted_track_scores[:limit]

    # Get unpopulated metadata
    track_ids = [track["track_id"] for track in sorted_track_scores]
    tracks = get_unpopulated_tracks(session, track_ids)

    # Make sure to apply the limit if not previously applied
    # because of the filtering out of premium tracks
    if not should_apply_limit_early:
        tracks = tracks[:limit]

    return (tracks, track_ids)


def generate_unpopulated_trending_from_mat_views(
    session,
    genre,
    time_range,
    strategy,
    filter_premium=SHOULD_TRENDING_FILTER_OUT_PREMIUM_TRACKS,
    limit=TRENDING_LIMIT,
):

    # use all time instead of year for version EJ57D
    if strategy.version == TrendingVersion.EJ57D and time_range == "year":
        time_range = "allTime"
    elif strategy.version != TrendingVersion.EJ57D and time_range == "allTime":
        time_range = "year"

    trending_track_ids_query = session.query(
        TrackTrendingScore.track_id, TrackTrendingScore.score
    ).filter(
        TrackTrendingScore.type == strategy.trending_type.name,
        TrackTrendingScore.version == strategy.version.name,
        TrackTrendingScore.time_range == time_range,
    )

    if genre:
        trending_track_ids_query = trending_track_ids_query.filter(
            TrackTrendingScore.genre == genre
        )

    # Only limit the number of sorted tracks here if we are not later
    # filtering out the premium tracks. Otherwise, the number of
    # tracks we return later may be smaller than the limit.
    # If we don't limit it here, we limit it later after getting the
    # unpopulated tracks.
    should_apply_limit_early = not filter_premium
    if should_apply_limit_early:
        trending_track_ids = (
            trending_track_ids_query.order_by(
                desc(TrackTrendingScore.score), desc(TrackTrendingScore.track_id)
            )
            .limit(limit)
            .all()
        )
    else:
        trending_track_ids = trending_track_ids_query.order_by(
            desc(TrackTrendingScore.score), desc(TrackTrendingScore.track_id)
        ).all()

    # Get unpopulated metadata
    track_ids = [track_id[0] for track_id in trending_track_ids]
    tracks = get_unpopulated_tracks(session, track_ids)

    # Make sure to apply the limit if not previously applied
    # because of the filtering out of premium tracks
    if not should_apply_limit_early:
        tracks = tracks[:limit]

    return (tracks, track_ids)


def make_generate_unpopulated_trending(
    session: Session,
    genre: Optional[str],
    time_range: str,
    strategy: str,
    filter_premium: bool,
):
    """Wraps a call to `generate_unpopulated_trending` for use in `use_redis_cache`, which
    expects to be passed a function with no arguments."""

    def wrapped():
        if strategy.use_mat_view:
            return generate_unpopulated_trending_from_mat_views(
                session=session,
                genre=genre,
                time_range=time_range,
                strategy=strategy,
                filter_premium=filter_premium,
            )
        return generate_unpopulated_trending(
            session=session,
            genre=genre,
            time_range=time_range,
            strategy=strategy,
            filter_premium=filter_premium,
        )

    return wrapped


class GetTrendingTracksArgs(TypedDict, total=False):
    current_user_id: Optional[int]
    genre: Optional[str]
    time: str
    filter_premium: bool


def get_trending_tracks(args: GetTrendingTracksArgs, strategy: BaseTrendingStrategy):
    """Gets trending by getting the currently cached tracks and then populating them."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_trending_tracks_with_session(session, args, strategy)


def _get_trending_tracks_with_session(
    session: Session, args: GetTrendingTracksArgs, strategy: BaseTrendingStrategy
):
    current_user_id, genre, time, filter_premium = (
        args.get("current_user_id"),
        args.get("genre"),
        args.get("time", "week"),
        args.get("filter_premium", SHOULD_TRENDING_FILTER_OUT_PREMIUM_TRACKS),
    )
    time_range = "week" if time not in ["week", "month", "year", "allTime"] else time
    key = make_trending_cache_key(time_range, genre, strategy.version)

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
            filter_premium=filter_premium,
        ),
    )

    # populate track metadata
    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
    tracks_map = {track["track_id"]: track for track in tracks}

    # Re-sort the populated tracks b/c it loses sort order in sql query
    sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

    add_users_to_tracks(session, tracks, current_user_id)
    return sorted_tracks
