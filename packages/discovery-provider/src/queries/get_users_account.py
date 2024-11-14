from typing import TypedDict

from sqlalchemy import and_, asc, desc, or_

from src import exceptions
from src.models.playlists.playlist import Playlist
from src.models.social.save import Save, SaveType
from src.models.users.user import User
from src.queries.get_managed_users import is_active_manager
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class GetAccountArgs(TypedDict):
    wallet: str
    authed_user_id: int


class GetAccountResponse(TypedDict):
    user: dict
    playlists: list[dict]


def _get_user_from_wallet(session, wallet: str):
    # Create initial query
    base_query = session.query(User)
    # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
    base_query = base_query.filter(User.is_current == True, User.wallet != None)

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

    return helpers.model_to_dictionary(user)


def _get_account_playlists(session, user_id: int):
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

    playlist_owner_ids = list({playlist["playlist_owner_id"] for playlist in playlists})

    # Get Users for the Playlist/Albums
    users = get_unpopulated_users(session, playlist_owner_ids)

    user_map = {}

    stripped_playlists = []
    # Map the users to the playlists/albums
    for playlist_owner in users:
        user_map[playlist_owner["user_id"]] = playlist_owner
    for playlist in playlists:
        playlist_owner = user_map[playlist["playlist_owner_id"]]
        stripped_playlist = {
            "id": playlist["playlist_id"],
            "name": playlist["playlist_name"],
            "is_album": playlist["is_album"],
            "permalink": playlist["permalink"],
            "user": {
                "id": playlist_owner["user_id"],
                "handle": playlist_owner["handle"],
            },
        }
        if playlist_owner["is_deactivated"]:
            stripped_playlist["user"]["is_deactivated"] = True
        stripped_playlists.append(stripped_playlist)
    return stripped_playlists


def get_account(args: GetAccountArgs) -> GetAccountResponse | None:
    wallet = args.get("wallet")
    authed_user_id = args.get("authed_user_id")
    if not wallet:
        raise exceptions.ArgumentError("Missing wallet param")
    if not authed_user_id:
        raise exceptions.ArgumentError("Missing authed_user_id param")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        user = _get_user_from_wallet(session, args["wallet"])
        if not user:
            return None

        user_id = user["user_id"]

        if user_id != authed_user_id and not is_active_manager(user_id, authed_user_id):
            raise exceptions.PermissionError(
                "You do not have permission to view this account"
            )

        # bundle peripheral info into user results
        users = populate_user_metadata(session, [user_id], [user], user_id, True)
        user = users[0]
    playlists = _get_account_playlists(session, user_id)
    return {"user": user, "playlists": playlists}


# DEPRECATED: Legacy query used by v0 endpoint
def get_users_account(args):
    if "wallet" not in args:
        raise exceptions.ArgumentError("Missing wallet param")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        user = _get_user_from_wallet(session, args["wallet"])
        if not user:
            return None

        user_id = user["user_id"]

        # bundle peripheral info into user results
        users = populate_user_metadata(session, [user_id], [user], user_id, True)
        user = users[0]

        user["playlists"] = _get_account_playlists(session, user_id)

    return user
