from src import exceptions
from src.models import Playlist, Save, SaveType, Track
from src.models.models import RepostType
from src.queries.query_helpers import (
    add_users_to_tracks,
    get_users_by_id,
    get_users_ids,
    paginate_query,
    populate_playlist_metadata,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def populate_save_items(session, saves, save_items, save_type, current_user_id):
    if save_type == "tracks":
        save_items = populate_track_metadata(
            session,
            [track["track_id"] for track in save_items],
            save_items,
            current_user_id,
        )
        add_users_to_tracks(session, save_items, current_user_id)
        save_item_map = {save_item["track_id"]: save_item for save_item in save_items}
    else:
        save_items = populate_playlist_metadata(
            session,
            [playlist["playlist_id"] for playlist in save_items],
            save_items,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id,
        )
        user_id_list = get_users_ids(save_items)
        users = get_users_by_id(session, user_id_list, current_user_id)
        for playlist in save_items:
            user = users[playlist["playlist_owner_id"]]
            if user:
                playlist["user"] = user
        save_item_map = {
            save_item["playlist_id"]: save_item for save_item in save_items
        }

    return [
        {**result, "save_item": save_item_map[result["save_item_id"]]}
        for result in saves
    ]


def get_saves(save_type, user_id, current_user_id=None, include_save_items=False):
    save_query_type = None
    if save_type == "albums":
        save_query_type = SaveType.album
    elif save_type == "playlists":
        save_query_type = SaveType.playlist
    elif save_type == "tracks":
        save_query_type = SaveType.track
    else:
        raise exceptions.ArgumentError("Invalid save type provided")

    save_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = session.query(Save).filter(
            Save.user_id == user_id,
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == save_query_type,
        )
        if save_type == "albums":
            if include_save_items:
                query = query.add_entity(Playlist)
            query = query.join(
                Playlist, Playlist.playlist_id == Save.save_item_id
            ).filter(
                Playlist.is_current == True,
                Playlist.is_album == True,
            )
        elif save_type == "playlists":
            if include_save_items:
                query = query.add_entity(Playlist)
            query = query.join(
                Playlist, Playlist.playlist_id == Save.save_item_id
            ).filter(
                Playlist.is_current == True,
                Playlist.is_album == False,
            )
        elif save_type == "tracks":
            if include_save_items:
                query = query.add_entity(Track)
            query = query.join(Track, Track.track_id == Save.save_item_id).filter(
                Track.is_current == True
            )

        query_results = paginate_query(query).all()

        # Populate the metadata for any save items
        if include_save_items:
            saves = helpers.query_result_to_list(
                [result[0] for result in query_results]
            )
            save_items = helpers.query_result_to_list(
                [result[1] for result in query_results]
            )
            save_results = populate_save_items(
                session, saves, save_items, save_type, current_user_id
            )
        else:
            save_results = helpers.query_result_to_list(query_results)

    return save_results
