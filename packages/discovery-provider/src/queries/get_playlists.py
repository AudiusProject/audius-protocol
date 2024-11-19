import logging
from typing import List, Literal, Optional, TypedDict  # pylint: disable=C0302

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm.exc import NoResultFound

from src import exceptions
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.models.users.user import User
from src.queries.query_helpers import (
    add_query_pagination,
    get_pagination_vars,
    get_users_ids,
    populate_playlist_metadata,
    populate_user_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

UNPOPULATED_PLAYLIST_CACHE_DURATION_SEC = 10


class RouteArgs(TypedDict):
    handle: str
    slug: str


class GetPlaylistsArgs(TypedDict, total=False):
    current_user_id: int
    playlist_ids: List[int]
    user_id: int
    with_users: bool
    routes: List[RouteArgs]
    kind: Optional[Literal["Playlist", "Album"]]
    limit: int
    offset: int


def _get_unpopulated_playlists(session, args):
    playlist_query = session.query(Playlist).filter(Playlist.is_current == True)
    routes = args.get("routes", None)

    current_user_id = args.get("current_user_id")

    if routes:
        # Convert the handles to user_ids
        handles = [route["handle"].lower() for route in routes]
        user_id_tuples = (
            session.query(User.user_id, User.handle_lc)
            .filter(User.handle_lc.in_(handles), User.is_current == True)
            .all()
        )
        user_id_map = {handle: user_id for (user_id, handle) in user_id_tuples}
        formatted_routes = []
        for route in routes:
            formatted_routes.append(
                {
                    "slug": route["slug"],
                    "owner_id": user_id_map.get(route["handle"].lower(), None),
                }
            )

        playlist_query = playlist_query.join(
            PlaylistRoute, PlaylistRoute.playlist_id == Playlist.playlist_id
        )
        filter_cond = []
        for route in formatted_routes:
            filter_cond.append(
                and_(
                    PlaylistRoute.slug == route["slug"],
                    PlaylistRoute.owner_id == route["owner_id"],
                )
            )
        playlist_query = playlist_query.filter(or_(*filter_cond))

    # playlist ids filter if the optional query param is passed in
    if "playlist_ids" in args:
        playlist_id_list = args.get("playlist_ids")
        try:
            playlist_query = playlist_query.filter(
                Playlist.playlist_id.in_(playlist_id_list)
            )
        except ValueError as e:
            raise exceptions.ArgumentError("Invalid value found in playlist id list", e)

    if "user_id" in args:
        user_id = args.get("user_id")
        # user id filter if the optional query param is passed in
        playlist_query = playlist_query.filter(Playlist.playlist_owner_id == user_id)

    # Filter out deletes unless we're fetching explicitly by id or route
    if "playlist_ids" not in args and not routes:
        playlist_query = playlist_query.filter(Playlist.is_delete == False)
        if current_user_id:
            playlist_query = playlist_query.filter(
                or_(
                    Playlist.playlist_owner_id == current_user_id,
                    and_(
                        Playlist.playlist_owner_id != current_user_id,
                        Playlist.is_private == False,
                    ),
                )
            )
        else:
            playlist_query = playlist_query.filter(Playlist.is_private == False)

    if "kind" in args:
        if args.get("kind") == "Playlist":
            playlist_query = playlist_query.filter(Playlist.is_album == False)
        if args.get("kind") == "Album":
            playlist_query = playlist_query.filter(Playlist.is_album == True)

    playlist_query = playlist_query.order_by(desc(Playlist.created_at))
    playlists = add_query_pagination(playlist_query, args["limit"], args["offset"])
    playlists = helpers.query_result_to_list(playlists)

    # retrieve playlist ids list
    playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

    return (playlists, playlist_ids)


def add_users_to_playlists(playlists, session, current_user_id):
    """Add users to playlists, by populating the users that are attached to `playlists`"""
    user_id_list = get_users_ids(playlists)
    # Pull the users off the playlist model
    users = list(map(lambda playlist: playlist.get("user")[0], playlists))
    # Populate metadata
    users = populate_user_metadata(session, user_id_list, users, current_user_id)

    # Reattach
    users_map = {user["user_id"]: user for user in users}
    for playlist in playlists:
        user = users_map[playlist["playlist_owner_id"]]
        if user:
            playlist["user"] = user
    return playlists


def get_playlists(args: GetPlaylistsArgs):
    playlists = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        try:
            (limit, offset) = get_pagination_vars()
            args["limit"] = limit if "limit" not in args else args["limit"]
            args["offset"] = offset if "offset" not in args else args["offset"]

            (playlists, playlist_ids) = _get_unpopulated_playlists(
                session=session, args=args
            )
            # bundle peripheral info into playlist results
            playlists = populate_playlist_metadata(
                session,
                playlist_ids,
                playlists,
                [RepostType.playlist, RepostType.album],
                [SaveType.playlist, SaveType.album],
                current_user_id,
            )

            if args.get("with_users", False):
                playlists = add_users_to_playlists(playlists, session, current_user_id)

        except NoResultFound:
            pass
    return playlists
