import logging  # pylint: disable=C0302
from datetime import datetime
from typing import Optional, TypedDict, cast

from sqlalchemy import Integer, desc, func
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.sql.type_api import TypeEngine

from src.api.v1.helpers import (
    extend_playlist,
    extend_track,
    format_limit,
    format_offset,
    to_dict,
)
from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.playlists.playlist import Playlist
from src.models.social.repost import RepostType
from src.models.social.save import Save, SaveType
from src.models.users.aggregate_user import AggregateUser
from src.queries import response_name_constants
from src.queries.get_playlist_tracks import get_playlist_tracks
from src.queries.get_unpopulated_playlists import get_unpopulated_playlists
from src.queries.query_helpers import (
    add_users_to_tracks,
    get_karma,
    get_repost_counts,
    get_users_by_id,
    get_users_ids,
    populate_playlist_metadata,
    populate_track_metadata,
)
from src.tasks.generate_trending import time_delta_map
from src.trending_strategies.trending_strategy_factory import DEFAULT_TRENDING_VERSIONS
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import get_trending_cache_key, use_redis_cache


class jsonb_array_length(GenericFunction):  # pylint: disable=too-many-ancestors
    name = "jsonb_array_length"
    type = cast(TypeEngine, Integer)


@compiles(jsonb_array_length, "postgresql")
def compile_jsonb_array_length(element, compiler, **kw):
    return f"{element.name}({compiler.process(element.clauses)})"


logger = logging.getLogger(__name__)

# How many playlists to include
TRENDING_LIMIT = 30

# Cache duration. Faster than trending tracks because
# playlists refresh faster; we can afford to cache this more frequently.
TRENDING_TTL_SEC = 30 * 60

# Max tracks to include in a playlist.
PLAYLIST_TRACKS_LIMIT = 5


def get_scorable_playlist_data(session, time_range, strategy):
    """Gets data about playlists to be scored. Returns:
    Array<{
        "playlist_id": number
        "created_at": string
        "release_date": string
        "owner_id": string
        "windowed_save_count": number
        "save_count": number
        "repost_count: number,
        "windowed_repost_count: number
        "listens": number (always 1)
    }>
    """
    score_params = strategy.get_score_params()
    zq = score_params["zq"]
    xf = score_params["xf"]
    pt = score_params["pt"]
    mt = score_params["mt"]

    delta = time_delta_map.get(time_range) or time_delta_map.get("week")

    # Get all playlists saved within time range (windowed_save_count):
    # Queries by Playlists Joined with Saves,
    # where a given playlist was saved at least once in the past `time_delta`.
    # Limits to `TRENDING_LIMIT` and sorts by saves for later scoring.
    playlists = (
        session.query(
            Save.save_item_id,
            Playlist.created_at,
            Playlist.release_date,
            Playlist.playlist_owner_id,
            func.count(Save.save_item_id),
        )
        .join(Playlist, Playlist.playlist_id == Save.save_item_id)
        .join(AggregateUser, AggregateUser.user_id == Playlist.playlist_owner_id)
        .filter(
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == SaveType.playlist,  # Albums are filtered out
            Save.created_at > datetime.now() - delta,
            Playlist.is_current == True,
            Playlist.is_delete == False,
            Playlist.is_private == False,
            Playlist.is_album == False,
            jsonb_array_length(Playlist.playlist_contents["track_ids"]) >= mt,
            AggregateUser.following_count < zq,
        )
        .group_by(
            Save.save_item_id,
            Playlist.created_at,
            Playlist.release_date,
            Playlist.playlist_owner_id,
        )
        .order_by(desc(func.count(Save.save_item_id)))
        .limit(TRENDING_LIMIT)
    ).all()

    # Build up a map of playlist data
    # playlist_id -> data
    # Some fields initialized at zero
    playlist_map = {
        record[0]: {
            response_name_constants.playlist_id: record[0],
            response_name_constants.created_at: record[1].isoformat(timespec="seconds"),
            "release_date": record[2].isoformat(timespec="seconds"),
            response_name_constants.owner_id: record[3],
            response_name_constants.windowed_save_count: record[4],
            response_name_constants.save_count: 0,
            response_name_constants.repost_count: 0,
            response_name_constants.windowed_repost_count: 0,
            response_name_constants.owner_follower_count: 0,
            "karma": 1,
            "listens": 1,
        }
        for record in playlists
    }

    playlist_ids = [record[0] for record in playlists]
    # map owner_id -> [playlist_id], accounting for multiple playlists with the same ID
    # used in follows
    playlist_owner_id_map = {}
    for playlist_id, _, _, owner_id, _ in playlists:
        if owner_id not in playlist_owner_id_map:
            playlist_owner_id_map[owner_id] = [playlist_id]
        else:
            playlist_owner_id_map[owner_id].append(playlist_id)

    # Add repost counts
    repost_counts = (
        session.query(AggregatePlaylist.playlist_id, AggregatePlaylist.repost_count)
        .filter(AggregatePlaylist.playlist_id.in_(playlist_ids))
        .all()
    )
    for playlist_id, repost_count in repost_counts:
        playlist_map[playlist_id][response_name_constants.repost_count] = repost_count

    # Add windowed repost counts
    repost_counts_for_time = get_repost_counts(
        session, False, False, playlist_ids, [RepostType.playlist], None, time_range
    )
    for playlist_id, repost_count in repost_counts_for_time:
        playlist_map[playlist_id][
            response_name_constants.windowed_repost_count
        ] = repost_count

    # Add save counts
    save_counts = (
        session.query(AggregatePlaylist.playlist_id, AggregatePlaylist.save_count)
        .filter(AggregatePlaylist.playlist_id.in_(playlist_ids))
        .all()
    )
    for playlist_id, save_count in save_counts:
        playlist_map[playlist_id][response_name_constants.save_count] = save_count

    # Add follower counts
    follower_counts = (
        session.query(AggregateUser.user_id, AggregateUser.follower_count)
        .filter(
            AggregateUser.user_id.in_(list(playlist_owner_id_map.keys())),
        )
        .all()
    )

    for followee_user_id, follower_count in follower_counts:
        if follower_count >= pt:
            owned_playlist_ids = playlist_owner_id_map[followee_user_id]
            for playlist_id in owned_playlist_ids:
                playlist_map[playlist_id][
                    response_name_constants.owner_follower_count
                ] = follower_count

    # Add karma
    karma_scores = get_karma(session, tuple(playlist_ids), strategy, None, True, xf)
    for playlist_id, karma in karma_scores:
        playlist_map[playlist_id]["karma"] = karma

    return playlist_map.values()


def make_get_unpopulated_playlists(session, time_range, strategy):
    """Gets scorable data, scores and sorts, then returns full unpopulated playlists.
    Returns a function, because this is used in a Redis cache hook"""

    def wrapped():
        playlist_scoring_data = get_scorable_playlist_data(
            session, time_range, strategy
        )

        # score the playlists
        scored_playlists = [
            strategy.get_track_score(time_range, playlist)
            for playlist in playlist_scoring_data
        ]
        sorted_playlists = sorted(
            scored_playlists, key=lambda k: k["score"], reverse=True
        )

        # Get the unpopulated playlist metadata
        playlist_ids = [playlist["playlist_id"] for playlist in sorted_playlists]
        playlists = get_unpopulated_playlists(session, playlist_ids)

        playlist_tracks_map = get_playlist_tracks(session, {"playlists": playlists})

        for playlist in playlists:
            playlist["tracks"] = playlist_tracks_map.get(playlist["playlist_id"], [])

        playlists = [p for p in playlists if p["tracks"]]

        results = []
        for playlist in playlists:
            playlist_owner_id = playlist["playlist_owner_id"]
            unique_track_owner_ids = set()
            valid_track_count = 0

            for track in playlist["tracks"]:
                is_delete = track["is_delete"]
                if not is_delete:
                    valid_track_count += 1

                owner_id = track["owner_id"]
                if playlist_owner_id != owner_id:
                    unique_track_owner_ids.add(owner_id)

            if len(unique_track_owner_ids) < 3 or valid_track_count < 3:
                continue

            results.append(playlist)

        return (results, list(map(lambda playlist: playlist["playlist_id"], results)))

    return wrapped


def make_trending_playlists_cache_key(
    time_range, version=DEFAULT_TRENDING_VERSIONS[TrendingType.PLAYLISTS]
):
    version_name = (
        f":{version.name}"
        if version != DEFAULT_TRENDING_VERSIONS[TrendingType.PLAYLISTS]
        else ""
    )
    return f"generated-trending-playlists{version_name}:{time_range}"


class GetTrendingPlaylistsArgs(TypedDict, total=False):
    current_user_id: Optional[int]
    with_tracks: Optional[bool]
    time: str
    offset: int
    limit: int


def _get_trending_playlists_with_session(
    session: Session, args: GetTrendingPlaylistsArgs, strategy, use_request_context=True
):
    """Returns Trending Playlists. Checks Redis cache for unpopulated playlists."""
    current_user_id = args.get("current_user_id", None)
    with_tracks = args.get("with_tracks", False)
    time = args.get("time")
    limit, offset = args.get("limit"), args.get("offset")
    key = make_trending_playlists_cache_key(time, strategy.version)

    # Get unpopulated playlists,
    # cached if it exists.
    (playlists, playlist_ids) = use_redis_cache(
        key, None, make_get_unpopulated_playlists(session, time, strategy)
    )

    # Apply limit + offset early to reduce the amount of
    # population work we have to do
    if limit is not None and offset is not None:
        playlists = playlists[offset : limit + offset]
        playlist_ids = playlist_ids[offset : limit + offset]

    # Populate playlist metadata
    playlists = populate_playlist_metadata(
        session,
        playlist_ids,
        playlists,
        [RepostType.playlist, RepostType.album],
        [SaveType.playlist, SaveType.album],
        current_user_id,
    )

    for playlist in playlists:
        playlist["track_count"] = len(playlist["tracks"])
        playlist["tracks"] = playlist["tracks"][:PLAYLIST_TRACKS_LIMIT]
        # Trim track_ids, which ultimately become added_timestamps
        # and need to match the tracks.
        trimmed_track_ids = {track["track_id"] for track in playlist["tracks"]}
        playlist_track_ids = playlist["playlist_contents"]["track_ids"]
        playlist_track_ids = list(
            filter(
                lambda track_id: track_id["track"]
                in trimmed_track_ids,  # pylint: disable=W0640
                playlist_track_ids,
            )
        )
        playlist["playlist_contents"]["track_ids"] = playlist_track_ids

    playlists_map = {playlist["playlist_id"]: playlist for playlist in playlists}

    if with_tracks:
        # populate track metadata
        tracks = []
        for playlist in playlists:
            playlist_tracks = playlist["tracks"]
            tracks.extend(playlist_tracks)
        track_ids = [track["track_id"] for track in tracks]
        populated_tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id
        )

        # Add users if necessary
        add_users_to_tracks(session, populated_tracks, current_user_id)

        # Re-associate tracks with playlists
        # track_id -> populated_track
        populated_track_map = {track["track_id"]: track for track in populated_tracks}
        for playlist in playlists_map.values():
            for i in range(len(playlist["tracks"])):
                track_id = playlist["tracks"][i]["track_id"]
                populated = populated_track_map[track_id]
                playlist["tracks"][i] = populated
            playlist["tracks"] = [
                extend_track(track, current_user_id=current_user_id)
                for track in playlist["tracks"]
            ]

    # re-sort playlists to original order, because populate_playlist_metadata
    # unsorts.
    sorted_playlists = [playlists_map[playlist_id] for playlist_id in playlist_ids]

    # Add users to playlists
    user_id_list = get_users_ids(sorted_playlists)
    users = get_users_by_id(session, user_id_list, current_user_id, use_request_context)
    for playlist in sorted_playlists:
        user = users[playlist["playlist_owner_id"]]
        if user:
            playlist["user"] = user

    # Extend the playlists
    playlists = list(map(extend_playlist, playlists))
    return sorted_playlists


def get_trending_playlists(args: GetTrendingPlaylistsArgs, strategy):
    """Returns Trending Playlists. Checks Redis cache for unpopulated playlists."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_trending_playlists_with_session(session, args, strategy)


def get_full_trending_playlists(request, args, strategy):
    offset, limit = format_offset(args), format_limit(args, TRENDING_LIMIT)
    current_user_id, time = args.get("user_id"), args.get("time", "week")
    time = "week" if time not in ["week", "month", "year"] else time

    # If we have a user_id, we call into `get_trending_playlist`
    # which fetches the cached unpopulated tracks and then
    # populates metadata. Otherwise, just
    # retrieve the last cached value.
    #
    # If current_user_id,
    # apply limit + offset inside the cached calculation.
    # Otherwise, apply it here.
    if current_user_id:
        args = {"time": time, "with_tracks": True, "limit": limit, "offset": offset}
        decoded = decode_string_id(current_user_id)
        args["current_user_id"] = decoded
        playlists = get_trending_playlists(args, strategy)
    else:
        args = {
            "time": time,
            "with_tracks": True,
        }
        key = get_trending_cache_key(to_dict(request.args), request.path)
        playlists = use_redis_cache(
            key, TRENDING_TTL_SEC, lambda: get_trending_playlists(args, strategy)
        )
        playlists = playlists[offset : limit + offset]

    return playlists
