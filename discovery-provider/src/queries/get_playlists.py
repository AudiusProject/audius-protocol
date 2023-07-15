import logging
from typing import List, TypedDict  # pylint: disable=C0302

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm.exc import NoResultFound
from src import exceptions
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.models.users.user import User
from src.queries.query_helpers import (
    get_users_by_id,
    get_users_ids,
    paginate_query,
    populate_playlist_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

UNPOPULATED_PLAYLIST_CACHE_DURATION_SEC = 10


class RouteArgs(TypedDict):
    handle: str
    slug: str


class GetPlaylistsArgs(TypedDict):
    current_user_id: int
    playlist_ids: List[int]
    user_id: int
    with_users: bool
    routes: List[RouteArgs]


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

    playlist_query = playlist_query.order_by(desc(Playlist.created_at))
    playlists = paginate_query(playlist_query).all()
    playlists = helpers.query_result_to_list(playlists)

    # if we passed in a current_user_id and no direct route was passed in,
    # filter out all private playlists where the owner_id doesn't match the current_user_id
    if "playlist_ids" not in args and not routes:
        if current_user_id:
            playlists = list(
                filter(
                    lambda playlist: (not playlist["is_private"])
                    or playlist["playlist_owner_id"] == current_user_id,
                    playlists,
                )
            )

    # retrieve playlist ids list
    playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

    return (playlists, playlist_ids)


def get_playlists(args: GetPlaylistsArgs):
    playlists = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        try:
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
                user_id_list = get_users_ids(playlists)
                users = get_users_by_id(session, user_id_list, current_user_id)
                for playlist in playlists:
                    user = users[playlist["playlist_owner_id"]]
                    if user:
                        playlist["user"] = user

        except NoResultFound:
            pass
    return playlists
