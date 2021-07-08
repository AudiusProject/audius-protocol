from sqlalchemy import asc, desc, or_, and_

from src import exceptions
from src.models import User, Playlist, Save, SaveType
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_user_metadata
from src.queries.get_unpopulated_users import get_unpopulated_users


def get_users_account(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(User)
        # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
        base_query = base_query.filter(
            User.is_current == True, User.wallet != None, User.handle != None
        )

        if "wallet" not in args:
            raise exceptions.ArgumentError("Missing wallet param")

        wallet = args.get("wallet")
        wallet = wallet.lower()
        if len(wallet) == 42:
            base_query = base_query.filter_by(wallet=wallet)
            base_query = base_query.order_by(asc(User.created_at))
        else:
            raise exceptions.ArgumentError("Invalid wallet length")

        # If user cannot be found, exit early and return empty response
        user = base_query.first()
        if not user:
            return None

        user = helpers.model_to_dictionary(user)
        user_id = user["user_id"]

        # bundle peripheral info into user results
        users = populate_user_metadata(session, [user_id], [user], user_id, True)
        user = users[0]

        # Get saved playlists / albums ids
        saved_query = session.query(Save.save_item_id).filter(
            Save.user_id == user_id,
            Save.is_current == True,
            Save.is_delete == False,
            or_(Save.save_type == SaveType.playlist, Save.save_type == SaveType.album),
        )

        saved_query_results = saved_query.all()
        save_collection_ids = [item[0] for item in saved_query_results]

        # Get Playlist/Albums saved or owned by the user
        playlist_query = (
            session.query(Playlist)
            .filter(
                or_(
                    and_(
                        Playlist.is_current == True,
                        Playlist.is_delete == False,
                        Playlist.playlist_owner_id == user_id,
                    ),
                    and_(
                        Playlist.is_current == True,
                        Playlist.is_delete == False,
                        Playlist.playlist_id.in_(save_collection_ids),
                    ),
                )
            )
            .order_by(desc(Playlist.created_at))
        )
        playlists = playlist_query.all()
        playlists = helpers.query_result_to_list(playlists)

        playlist_owner_ids = list(
            set([playlist["playlist_owner_id"] for playlist in playlists])
        )

        # Get Users for the Playlist/Albums
        users = get_unpopulated_users(session, playlist_owner_ids)

        user_map = {}

        stripped_playlists = []
        # Map the users to the playlists/albums
        for playlist_owner in users:
            user_map[playlist_owner["user_id"]] = playlist_owner
        for playlist in playlists:
            playlist_owner = user_map[playlist["playlist_owner_id"]]
            stripped_playlists.append(
                {
                    "id": playlist["playlist_id"],
                    "name": playlist["playlist_name"],
                    "is_album": playlist["is_album"],
                    "user": {
                        "id": playlist_owner["user_id"],
                        "handle": playlist_owner["handle"],
                    },
                }
            )
        user["playlists"] = stripped_playlists

    return user
