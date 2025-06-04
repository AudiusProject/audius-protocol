import logging  # pylint: disable=C0302
from typing import Optional, TypedDict, cast

from sqlalchemy import Integer, desc
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.sql.type_api import TypeEngine

from src.api.v1.helpers import extend_track, format_limit, format_offset
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_trending_score import PlaylistTrendingScore
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.queries.get_playlist_tracks import get_playlist_tracks
from src.queries.get_unpopulated_playlists import get_unpopulated_playlists
from src.queries.query_helpers import (
    add_users_to_tracks,
    get_users_by_id,
    get_users_ids,
    populate_playlist_metadata,
    populate_track_metadata,
)
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id


class jsonb_array_length(GenericFunction):  # pylint: disable=too-many-ancestors
    name = "jsonb_array_length"
    type = cast(TypeEngine, Integer)


@compiles(jsonb_array_length, "postgresql")
def compile_jsonb_array_length(element, compiler, **kw):
    return f"{element.name}({compiler.process(element.clauses)})"


logger = logging.getLogger(__name__)

# How many playlists to include
TRENDING_LIMIT = 30

# Max tracks to include in a playlist.
PLAYLIST_TRACKS_LIMIT = 5


def make_get_unpopulated_playlists(session, time_range, limit, offset, strategy):
    """Gets scorable data, scores and sorts, then returns full unpopulated playlists."""

    trending_scores_query = session.query(
        PlaylistTrendingScore.playlist_id, PlaylistTrendingScore.score
    ).filter(
        PlaylistTrendingScore.type == strategy.trending_type.name,
        PlaylistTrendingScore.version == strategy.version.name,
        PlaylistTrendingScore.time_range == time_range,
    )

    trending_playlist_ids_subquery = trending_scores_query.subquery()

    trending_playlist_ids = (
        session.query(
            trending_playlist_ids_subquery.c.playlist_id,
            trending_playlist_ids_subquery.c.score,
            Playlist.playlist_id,
        )
        .join(
            trending_playlist_ids_subquery,
            Playlist.playlist_id == trending_playlist_ids_subquery.c.playlist_id,
        )
        .filter(
            Playlist.is_current == True,
            Playlist.is_delete == False,
            Playlist.is_private == False,
            Playlist.is_album == False,
        )
        .order_by(
            desc(trending_playlist_ids_subquery.c.score),
            desc(trending_playlist_ids_subquery.c.playlist_id),
        )
        .limit(limit)
        .offset(offset)
        .all()
    )

    playlist_ids = [playlist_id[0] for playlist_id in trending_playlist_ids]
    # Get the unpopulated playlist metadata
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


class GetTrendingPlaylistsArgs(TypedDict, total=False):
    current_user_id: Optional[int]
    with_tracks: Optional[bool]
    time: str
    offset: int
    limit: int


def _get_trending_playlists_with_session(
    session: Session, args: GetTrendingPlaylistsArgs, strategy, use_request_context=True
):
    """Returns Trending Playlists."""
    current_user_id = args.get("current_user_id", None)
    with_tracks = args.get("with_tracks", False)
    time = args.get("time")
    limit, offset = args.get("limit"), args.get("offset")

    # Get unpopulated playlists,
    (playlists, playlist_ids) = make_get_unpopulated_playlists(
        session, time, limit, offset, strategy
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
        # Trim track_ids, which ultimately become playlist_contents
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
        populated_track_map = {
            track["track_id"]: extend_track(track) for track in populated_tracks
        }
        for playlist in playlists_map.values():
            for i in range(len(playlist["tracks"])):
                track_id = playlist["tracks"][i]["track_id"]
                populated = populated_track_map[track_id]
                playlist["tracks"][i] = populated

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
    return sorted_playlists


def get_trending_playlists(args: GetTrendingPlaylistsArgs, strategy):
    """Returns Trending Playlists."""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_trending_playlists_with_session(session, args, strategy)


def get_full_trending_playlists(request, args, strategy):
    offset, limit = format_offset(args), format_limit(args, TRENDING_LIMIT)
    current_user_id, time = args.get("user_id"), args.get("time", "week")
    time = "week" if time not in ["week", "month", "year"] else time

    args = {"time": time, "with_tracks": True, "limit": limit, "offset": offset}
    if current_user_id:
        decoded = decode_string_id(current_user_id)
        args["current_user_id"] = decoded
    playlists = get_trending_playlists(args, strategy)

    return playlists
