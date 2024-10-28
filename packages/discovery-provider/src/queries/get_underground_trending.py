import logging  # pylint: disable=C0302
from datetime import datetime, timedelta
from typing import Any, Optional, TypedDict

from sqlalchemy.orm.session import Session

from src.api.v1.helpers import extend_track, format_limit, format_offset, to_dict
from src.gated_content.constants import (
    SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS,
    SHOULD_TRENDING_EXCLUDE_GATED_TRACKS,
)
from src.models.social.aggregate_plays import AggregatePlay
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.queries.generate_unpopulated_trending_tracks import (
    TRENDING_TRACKS_LIMIT,
    TRENDING_TRACKS_TTL_SEC,
    make_trending_tracks_cache_key,
)
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import (
    get_karma,
    get_repost_counts,
    get_save_counts,
    get_users_by_id,
    get_users_ids,
    populate_track_metadata,
)
from src.trending_strategies.trending_strategy_factory import DEFAULT_TRENDING_VERSIONS
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import (
    get_json_cached_key,
    get_trending_cache_key,
    use_redis_cache,
)
from src.utils.redis_connection import get_redis

redis_conn = get_redis()

logger = logging.getLogger(__name__)

UNDERGROUND_TRENDING_CACHE_KEY = "generated-trending-tracks-underground"
UNDERGROUND_TRENDING_LENGTH = 50


def get_scorable_track_data(session, redis_instance, strategy):
    """
    Returns a map: {
        "track_id": string
        "created_at": string
        "release_date": string
        "owner_id": number
        "windowed_save_count": number
        "save_count": number
        "repost_count": number
        "windowed_repost_count": number
        "owner_follower_count": number
        "karma": number
        "listens": number
        "owner_verified": boolean
        "is_stream_gated": boolean
    }
    """

    score_params = strategy.get_score_params()
    S = score_params["S"]
    r = score_params["r"]
    q = score_params["q"]
    o = score_params["o"]
    xf = score_params["xf"]
    pt = score_params["pt"]
    trending_key = make_trending_tracks_cache_key("week", None, strategy.version)
    track_ids = []
    old_trending = get_json_cached_key(redis_instance, trending_key)
    if old_trending:
        track_ids = old_trending[1]

    base_query = (
        session.query(
            AggregatePlay.play_item_id.label("track_id"),
            User.user_id,
            AggregateUser.follower_count,
            AggregatePlay.count,
            Track.created_at,
            Track.release_date,
            User.is_verified,
            Track.stream_conditions,
        )
        .join(Track, Track.track_id == AggregatePlay.play_item_id)
        .join(User, Track.owner_id == User.user_id)
        .join(AggregateUser, AggregateUser.user_id == Track.owner_id)
        .filter(
            Track.is_current == True,
            Track.is_delete == False,
            Track.is_unlisted == False,
            Track.stem_of == None,
            Track.track_id.notin_(track_ids),
            Track.created_at >= (datetime.now() - timedelta(days=o)),
            AggregateUser.follower_count < S,
            AggregateUser.follower_count >= pt,
            AggregateUser.following_count < r,
            AggregatePlay.count >= q,
        )
    ).all()

    tracks_map = {
        record[0]: {
            "track_id": record[0],
            "created_at": record[4].isoformat(timespec="seconds"),
            "release_date": record[5].isoformat(timespec="seconds"),
            "owner_id": record[1],
            "windowed_save_count": 0,
            "save_count": 0,
            "repost_count": 0,
            "windowed_repost_count": 0,
            "owner_follower_count": record[2],
            "karma": 1,
            "listens": record[3],
            "owner_verified": record[6],
            "is_stream_gated": bool(record[7]),
            "stream_conditions": record[7],
        }
        for record in base_query
    }

    track_ids = [record[0] for record in base_query]

    agg_track_rows = (
        session.query(
            AggregateTrack.track_id,
            AggregateTrack.save_count,
            AggregateTrack.repost_count,
        )
        .filter(AggregateTrack.track_id.in_(track_ids))
        .all()
    )

    # Get all the extra values
    windowed_repost_counts = get_repost_counts(
        session, False, False, track_ids, [RepostType.track], None, "week"
    )

    windowed_save_counts = get_save_counts(
        session, False, False, track_ids, [SaveType.track], None, "week"
    )

    karma_scores = get_karma(session, tuple(track_ids), strategy, None, False, xf)

    # Associate all the extra data
    for track_id, save_count, repost_count in agg_track_rows:
        tracks_map[track_id]["repost_count"] = repost_count
    for track_id, repost_count in windowed_repost_counts:
        tracks_map[track_id]["windowed_repost_count"] = repost_count
    for track_id, save_count, repost_count in agg_track_rows:
        tracks_map[track_id]["save_count"] = save_count
    for track_id, save_count in windowed_save_counts:
        tracks_map[track_id]["windowed_save_count"] = save_count
    for track_id, karma in karma_scores:
        tracks_map[track_id]["karma"] = karma

    return list(tracks_map.values())


def make_underground_trending_cache_key(
    version=DEFAULT_TRENDING_VERSIONS[TrendingType.UNDERGROUND_TRACKS],
):
    version_name = (
        f":{version.name}"
        if version != DEFAULT_TRENDING_VERSIONS[TrendingType.UNDERGROUND_TRACKS]
        else ""
    )
    return f"{UNDERGROUND_TRENDING_CACHE_KEY}{version_name}"


def make_get_unpopulated_tracks(session, redis_instance, strategy):
    def wrapped():
        # Score and sort
        track_scoring_data = get_scorable_track_data(session, redis_instance, strategy)

        # If SHOULD_TRENDING_EXCLUDE_GATED_TRACKS is true, then filter out track ids
        # belonging to gated tracks before applying the limit.
        if SHOULD_TRENDING_EXCLUDE_GATED_TRACKS:
            track_scoring_data = list(
                filter(lambda item: not item["is_stream_gated"], track_scoring_data)
            )
        # If SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS is true, then filter out track ids
        # belonging to collectible gated tracks before applying the limit.
        elif SHOULD_TRENDING_EXCLUDE_COLLECTIBLE_GATED_TRACKS:
            track_scoring_data = list(
                filter(
                    lambda item: (item["stream_conditions"] is None)
                    or ("nft_collection" not in item["stream_conditions"]),
                    track_scoring_data,
                )
            )

        scored_tracks = [
            strategy.get_track_score("week", track) for track in track_scoring_data
        ]
        sorted_tracks = sorted(scored_tracks, key=lambda k: k["score"], reverse=True)
        sorted_tracks = sorted_tracks[:UNDERGROUND_TRENDING_LENGTH]

        # Get unpopulated metadata
        track_ids = [track["track_id"] for track in sorted_tracks]
        tracks = get_unpopulated_tracks(
            session,
            track_ids,
            exclude_gated=SHOULD_TRENDING_EXCLUDE_GATED_TRACKS,
        )

        return (tracks, track_ids)

    return wrapped


class GetUndergroundTrendingTrackArgs(TypedDict, total=False):
    current_user_id: Optional[Any]
    offset: int
    limit: int


def _get_underground_trending_with_session(
    session: Session,
    args: GetUndergroundTrendingTrackArgs,
    strategy,
    use_request_context=True,
):
    current_user_id = args.get("current_user_id", None)
    limit, offset = args.get("limit"), args.get("offset")
    key = make_underground_trending_cache_key(strategy.version)

    (tracks, track_ids) = use_redis_cache(
        key, None, make_get_unpopulated_tracks(session, redis_conn, strategy)
    )

    # Apply limit + offset early to reduce the amount of
    # population work we have to do
    if limit is not None and offset is not None:
        track_ids = track_ids[offset : limit + offset]

    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    tracks_map = {track["track_id"]: track for track in tracks}

    # Re-sort the populated tracks b/c it loses sort order in sql query
    sorted_tracks = [tracks_map[track_id] for track_id in track_ids]
    user_id_list = get_users_ids(sorted_tracks)
    users = get_users_by_id(session, user_id_list, current_user_id, use_request_context)
    for track in sorted_tracks:
        user = users[track["owner_id"]]
        if user:
            track["user"] = user
    sorted_tracks = list(map(lambda track: extend_track(track, session), sorted_tracks))
    return sorted_tracks


def _get_underground_trending(args: GetUndergroundTrendingTrackArgs, strategy):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_underground_trending_with_session(session, args, strategy)


def get_underground_trending(request, args, strategy):
    offset, limit = format_offset(args), format_limit(args, TRENDING_TRACKS_LIMIT)
    current_user_id = args.get("user_id")
    args = {"limit": limit, "offset": offset}

    # If user ID, let _get_underground_trending
    # handle caching + limit + offset
    if current_user_id:
        decoded = decode_string_id(current_user_id)
        args["current_user_id"] = decoded
        trending = _get_underground_trending(args, strategy)
    else:
        # If no user ID, fetch all cached tracks
        # and perform pagination here, passing
        # no args so we get the full list of tracks.
        key = get_trending_cache_key(to_dict(request.args), request.path)
        trending = use_redis_cache(
            key,
            TRENDING_TRACKS_TTL_SEC,
            lambda: _get_underground_trending({}, strategy),
        )
        trending = trending[offset : limit + offset]
    return trending
