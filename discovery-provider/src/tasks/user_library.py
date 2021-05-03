import logging
from datetime import datetime
from src.app import contract_addresses
from src.models import Playlist, SaveType, Save

logger = logging.getLogger(__name__)

def user_library_state_update(
        self, update_task, session, user_library_factory_txs, block_number, block_timestamp
):
    """Return int representing number of User Library model state changes found in transaction."""

    num_total_changes = 0
    if not user_library_factory_txs:
        return num_total_changes

    user_library_abi = update_task.abi_values["UserLibraryFactory"]["abi"]
    user_library_contract = update_task.web3.eth.contract(
        address=contract_addresses["user_library_factory"], abi=user_library_abi
    )
    block_datetime = datetime.utcfromtimestamp(block_timestamp)

    track_save_state_changes = {}
    playlist_save_state_changes = {}

    for tx_receipt in user_library_factory_txs:
        add_track_save(
            self,
            user_library_contract,
            update_task,
            session,
            tx_receipt,
            block_number,
            block_datetime,
            track_save_state_changes,
        )

        add_playlist_save(
            self,
            user_library_contract,
            update_task,
            session,
            tx_receipt,
            block_number,
            block_datetime,
            playlist_save_state_changes,
        )

        delete_track_save(
            self,
            user_library_contract,
            update_task,
            session,
            tx_receipt,
            block_number,
            block_datetime,
            track_save_state_changes,
        )

        delete_playlist_save(
            self,
            user_library_contract,
            update_task,
            session,
            tx_receipt,
            block_number,
            block_datetime,
            playlist_save_state_changes,
        )

    for user_id in track_save_state_changes:
        for track_id in track_save_state_changes[user_id]:
            invalidate_old_save(session, user_id, track_id, SaveType.track)
            session.add(track_save_state_changes[user_id][track_id])
        num_total_changes += len(track_save_state_changes[user_id])

    for user_id in playlist_save_state_changes:
        for playlist_id in playlist_save_state_changes[user_id]:
            invalidate_old_save(
                session,
                user_id,
                playlist_id,
                playlist_save_state_changes[user_id][playlist_id].save_type)
            session.add(playlist_save_state_changes[user_id][playlist_id])
        num_total_changes += len(playlist_save_state_changes[user_id])

    return num_total_changes


def invalidate_old_save(session, user_id, playlist_id, save_type):
    num_invalidated_save_entries = (
        session.query(Save)
        .filter(
            Save.user_id == user_id,
            Save.save_item_id == playlist_id,
            Save.save_type == save_type,
            Save.is_current == True,
        )
        .update({"is_current":False})
    )
    return num_invalidated_save_entries


def add_track_save(
        self,
        user_library_contract,
        update_task,
        session,
        tx_receipt,
        block_number,
        block_datetime,
        track_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_add_track_events = user_library_contract.events.TrackSaveAdded().processReceipt(
        tx_receipt
    )

    for event in new_add_track_events:
        event_args = event["args"]
        save_user_id = event_args._userId
        save_track_id = event_args._trackId

        if (save_user_id in track_state_changes) and (save_track_id in track_state_changes[save_user_id]):
            track_state_changes[save_user_id][save_track_id].is_delete = False
        else:
            save = Save(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=save_user_id,
                save_item_id=save_track_id,
                save_type=SaveType.track,
                created_at=block_datetime,
                is_current=True,
                is_delete=False,
            )
            if save_user_id in track_state_changes:
                track_state_changes[save_user_id][save_track_id] = save
            else:
                track_state_changes[save_user_id] = {save_track_id: save}


def add_playlist_save(
        self,
        user_library_contract,
        update_task,
        session,
        tx_receipt,
        block_number,
        block_datetime,
        playlist_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_add_playlist_events = user_library_contract.events.PlaylistSaveAdded().processReceipt(
        tx_receipt
    )

    for event in new_add_playlist_events:
        event_args = event["args"]
        save_user_id = event_args._userId
        save_playlist_id = event_args._playlistId
        save_type = SaveType.playlist

        playlist_entry = session.query(Playlist).filter(
            Playlist.is_current == True,
            Playlist.playlist_id == save_playlist_id).all()

        if playlist_entry:
            if playlist_entry[0].is_album:
                save_type = SaveType.album

        if (save_user_id in playlist_state_changes) and (save_playlist_id in playlist_state_changes[save_user_id]):
            playlist_state_changes[save_user_id][save_playlist_id].is_delete = False
        else:
            save = Save(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=save_user_id,
                save_item_id=save_playlist_id,
                save_type=save_type,
                created_at=block_datetime,
                is_current=True,
                is_delete=False,
            )
            if save_user_id in playlist_state_changes:
                playlist_state_changes[save_user_id][save_playlist_id] = save
            else:
                playlist_state_changes[save_user_id] = {save_playlist_id: save}


def delete_track_save(
        self,
        user_library_contract,
        update_task,
        session,
        tx_receipt,
        block_number,
        block_datetime,
        track_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_delete_track_events = user_library_contract.events.TrackSaveDeleted().processReceipt(
        tx_receipt
    )
    for event in new_delete_track_events:
        event_args = event["args"]
        save_user_id = event_args._userId
        save_track_id = event_args._trackId

        if (save_user_id in track_state_changes) and (save_track_id in track_state_changes[save_user_id]):
            track_state_changes[save_user_id][save_track_id].is_delete = True
        else:
            save = Save(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=save_user_id,
                save_item_id=save_track_id,
                save_type=SaveType.track,
                created_at=block_datetime,
                is_current=True,
                is_delete=True,
            )
            if save_user_id in track_state_changes:
                track_state_changes[save_user_id][save_track_id] = save
            else:
                track_state_changes[save_user_id] = {save_track_id: save}


def delete_playlist_save(
        self,
        user_library_contract,
        update_task,
        session,
        tx_receipt,
        block_number,
        block_datetime,
        playlist_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_add_playlist_events = user_library_contract.events.PlaylistSaveDeleted().processReceipt(
        tx_receipt
    )

    for event in new_add_playlist_events:
        event_args = event["args"]
        save_user_id = event_args._userId
        save_playlist_id = event_args._playlistId
        save_type = SaveType.playlist

        playlist_entry = session.query(Playlist).filter(
            Playlist.is_current == True,
            Playlist.playlist_id == save_playlist_id).all()

        if playlist_entry:
            if playlist_entry[0].is_album:
                save_type = SaveType.album

        if (save_user_id in playlist_state_changes) and (save_playlist_id in playlist_state_changes[save_user_id]):
            playlist_state_changes[save_user_id][save_playlist_id].is_delete = True
        else:
            save = Save(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=save_user_id,
                save_item_id=save_playlist_id,
                save_type=save_type,
                created_at=block_datetime,
                is_current=True,
                is_delete=True,
            )
            if save_user_id in playlist_state_changes:
                playlist_state_changes[save_user_id][save_playlist_id] = save
            else:
                playlist_state_changes[save_user_id] = {save_playlist_id: save}
