from sqlalchemy import desc

from src.models import TrackTrendingScore, AggregateIntervalPlay
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.db_session import get_db_read_replica
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import (
    populate_track_metadata,
    get_users_ids,
    get_users_by_id,
)
from src.tasks.generate_trending import generate_trending
from src.utils.redis_cache import use_redis_cache
from src.trending_strategies.trending_strategy_factory import DEFAULT_TRENDING_VERSIONS

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
    session, genre, time_range, strategy, limit=TRENDING_LIMIT
):
    trending_tracks = generate_trending(session, time_range, genre, limit, 0, strategy)

    track_scores = [
        strategy.get_track_score(time_range, track)
        for track in trending_tracks["listen_counts"]
    ]
    # Re apply the limit just in case we did decide to include more tracks in the scoring than the limit
    sorted_track_scores = sorted(track_scores, key=lambda k: k["score"], reverse=True)[
        :limit
    ]
    track_ids = [track["track_id"] for track in sorted_track_scores]

    tracks = get_unpopulated_tracks(session, track_ids)
    return (tracks, track_ids)


def generate_unpopulated_trending_from_mat_views(
    session, genre, time_range, strategy, limit=TRENDING_LIMIT
):
    top_listen_tracks_subquery = session.query(AggregateIntervalPlay.track_id)
    if genre:
        top_listen_tracks_subquery = top_listen_tracks_subquery.filter(
            AggregateIntervalPlay.genre == genre
        )
    if time_range == "week":
        top_listen_tracks_subquery = top_listen_tracks_subquery.order_by(
            desc(AggregateIntervalPlay.week_listen_counts)
        )
    elif time_range == "month":
        top_listen_tracks_subquery = top_listen_tracks_subquery.order_by(
            desc(AggregateIntervalPlay.month_listen_counts)
        )
    elif time_range == "year":
        top_listen_tracks_subquery = top_listen_tracks_subquery.order_by(
            desc(AggregateIntervalPlay.year_listen_counts)
        )

    score_params = strategy.get_score_params()
    nm = score_params["nm"]

    top_listen_tracks_subquery = top_listen_tracks_subquery.limit(limit * nm)

    trending_track_ids_query = session.query(
        TrackTrendingScore.track_id, TrackTrendingScore.score
    ).filter(
        TrackTrendingScore.type == strategy.trending_type.name,
        TrackTrendingScore.version == strategy.version.name,
        TrackTrendingScore.time_range == time_range,
        TrackTrendingScore.track_id.in_(top_listen_tracks_subquery),
    )

    trending_track_ids = (
        trending_track_ids_query.order_by(desc(TrackTrendingScore.score))
        .limit(limit)
        .all()
    )
    track_ids = [track_id[0] for track_id in trending_track_ids]
    tracks = get_unpopulated_tracks(session, track_ids)
    return (tracks, track_ids)


def make_generate_unpopulated_trending(session, genre, time_range, strategy):
    """Wraps a call to `generate_unpopulated_trending` for use in `use_redis_cache`, which
    expects to be passed a function with no arguments."""

    def wrapped():
        return generate_unpopulated_trending(session, genre, time_range, strategy)

    return wrapped


def get_trending_tracks(args, strategy):
    """Gets trending by getting the currently cached tracks and then populating them."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        current_user_id, genre, time = (
            args.get("current_user_id"),
            args.get("genre"),
            args.get("time", "week"),
        )
        time_range = "week" if time not in ["week", "month", "year"] else time
        key = make_trending_cache_key(time_range, genre, strategy.version)

        # Will try to hit cached trending from task, falling back
        # to generating it here if necessary and storing it with no TTL
        (tracks, track_ids) = use_redis_cache(
            key,
            None,
            make_generate_unpopulated_trending(session, genre, time_range, strategy),
        )

        # populate track metadata
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        tracks_map = {track["track_id"]: track for track in tracks}

        # Re-sort the populated tracks b/c it loses sort order in sql query
        sorted_tracks = [tracks_map[track_id] for track_id in track_ids]

        if args.get("with_users", False):
            user_id_list = get_users_ids(sorted_tracks)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for track in sorted_tracks:
                user = users[track["owner_id"]]
                if user:
                    track["user"] = user
        return sorted_tracks
