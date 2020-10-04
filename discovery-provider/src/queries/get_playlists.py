import logging # pylint: disable=C0302
import sqlalchemy
from sqlalchemy import desc

from flask.globals import request
from src import exceptions
from src.models import Playlist, RepostType, SaveType
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query, \
  populate_playlist_metadata, get_users_ids, get_users_by_id
from src.utils.redis_cache import extract_key, use_redis_cache

logger = logging.getLogger(__name__)

UNPOPULATED_PLAYLIST_CACHE_DURATION_SEC = 10

def make_cache_key(args):
    cache_keys = {
        "user_id": args.get("user_id"),
        "with_users": args.get("with_users")
    }

    if args.get("playlist_id"):
        ids = args.get("playlist_id")
        ids = map(str, ids)
        ids = ",".join(ids)
        cache_keys["playlist_id"] = ids

    key = extract_key(f"unpopulated-playlist:{request.path}", cache_keys.items())
    return key

def get_playlists(args):
    playlists = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        def get_unpopulated_playlists():
            filter_out_private_playlists = True
            playlist_query = (
                session.query(Playlist)
                .filter(Playlist.is_current == True)
            )

            # playlist ids filter if the optional query param is passed in
            if "playlist_id" in args:
                playlist_id_list = args.get("playlist_id")
                try:
                    playlist_query = playlist_query.filter(Playlist.playlist_id.in_(playlist_id_list))
                except ValueError as e:
                    raise exceptions.ArgumentError("Invalid value found in playlist id list", e)

            if "user_id" in args:
                user_id = args.get("user_id")
                # user id filter if the optional query param is passed in
                playlist_query = playlist_query.filter(
                    Playlist.playlist_owner_id == user_id
                )

                # if the current user is the same as the user passed in through the query param then we're trying
                # to get playlists for, check if the users are the same. if they are the same, the current user is
                # trying to request their own playlists, so allow them to see private playlists
                if current_user_id and user_id and (int(current_user_id) == int(user_id)):
                    filter_out_private_playlists = False

            if filter_out_private_playlists:
                playlist_query = playlist_query.filter(
                    Playlist.is_private == False
                )

            # Filter out deletes unless we're fetching explicitly by id
            if "playlist_id" not in args:
                playlist_query = playlist_query.filter(
                    Playlist.is_delete == False
                )

            playlist_query = playlist_query.order_by(desc(Playlist.created_at))
            playlists = paginate_query(playlist_query).all()
            playlists = helpers.query_result_to_list(playlists)

            # retrieve playlist ids list
            playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

            return (playlists, playlist_ids)

        try:
            # Get unpopulated playlists, either via
            # redis cache or via get_unpopulated_playlists
            key = make_cache_key(args)

            (playlists, playlist_ids) = use_redis_cache(
                key,
                UNPOPULATED_PLAYLIST_CACHE_DURATION_SEC,
                get_unpopulated_playlists)

            # bundle peripheral info into playlist results
            playlists = populate_playlist_metadata(
                session,
                playlist_ids,
                playlists,
                [RepostType.playlist, RepostType.album],
                [SaveType.playlist, SaveType.album],
                current_user_id
            )

            if args.get("with_users", False):
                user_id_list = get_users_ids(playlists)
                users = get_users_by_id(session, user_id_list)
                for playlist in playlists:
                    user = users[playlist['playlist_owner_id']]
                    if user:
                        playlist['user'] = user

        except sqlalchemy.orm.exc.NoResultFound:
            pass
    return playlists
