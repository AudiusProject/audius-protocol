import logging
from datetime import datetime
from typing import Dict

from src.app import get_contract_addresses
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.models import Playlist, Save, SaveType
from src.queries.skipped_transactions import add_node_level_skipped_transaction
from src.utils import helpers
from src.utils.indexing_errors import EntityMissingRequiredFieldError, IndexingError
from src.utils.model_nullable_validator import all_required_fields_present

logger = logging.getLogger(__name__)


def user_library_state_update(
    self,
    update_task: DatabaseTask,
    session,
    user_library_factory_txs,
    block_number,
    block_timestamp,
    block_hash,
):
    """Return int representing number of User Library model state changes found in transaction."""

    blockhash = update_task.web3.toHex(block_hash)
    num_total_changes = 0
    skipped_tx_count = 0
    if not user_library_factory_txs:
        return num_total_changes

    challenge_bus = update_task.challenge_event_bus
    block_datetime = datetime.utcfromtimestamp(block_timestamp)

    track_save_state_changes: Dict[int, Dict[int, Save]] = {}
    playlist_save_state_changes: Dict[int, Dict[int, Save]] = {}

    for tx_receipt in user_library_factory_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        try:
            add_track_save(
                self,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                track_save_state_changes,
            )

            add_playlist_save(
                self,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                playlist_save_state_changes,
            )

            delete_track_save(
                self,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                track_save_state_changes,
            )

            delete_playlist_save(
                self,
                update_task,
                session,
                tx_receipt,
                block_number,
                block_datetime,
                playlist_save_state_changes,
            )
        except EntityMissingRequiredFieldError as e:
            logger.warning(f"Skipping tx {txhash} with error {e}")
            skipped_tx_count += 1
            add_node_level_skipped_transaction(session, block_number, blockhash, txhash)
            pass
        except Exception as e:
            logger.info("Error in user library transaction")
            raise IndexingError(
                "user_library", block_number, blockhash, txhash, str(e)
            ) from e

    for user_id, track_ids in track_save_state_changes.items():
        for track_id in track_ids:
            invalidate_old_save(session, user_id, track_id, SaveType.track)
            save = track_ids[track_id]
            session.add(save)
            dispatch_favorite(challenge_bus, save, block_number)
        num_total_changes += len(track_ids)

    for user_id, playlist_ids in playlist_save_state_changes.items():
        for playlist_id in playlist_ids:
            invalidate_old_save(
                session,
                user_id,
                playlist_id,
                playlist_ids[playlist_id].save_type,
            )
            session.add(playlist_ids[playlist_id])
        num_total_changes += len(playlist_ids)

    return num_total_changes


# ####### HELPERS ####### #
def get_user_library_factory_tx(update_task, event_type, tx_receipt):
    user_library_abi = update_task.abi_values["UserLibraryFactory"]["abi"]
    user_library_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()["user_library_factory"], abi=user_library_abi
    )
    return getattr(user_library_contract.events, event_type)().processReceipt(
        tx_receipt
    )


def dispatch_favorite(bus: ChallengeEventBus, save, block_number):
    bus.dispatch(ChallengeEvent.favorite, block_number, save.user_id)


def invalidate_old_save(session, user_id, playlist_id, save_type):
    num_invalidated_save_entries = (
        session.query(Save)
        .filter(
            Save.user_id == user_id,
            Save.save_item_id == playlist_id,
            Save.save_type == save_type,
            Save.is_current == True,
        )
        .update({"is_current": False})
    )
    return num_invalidated_save_entries


def add_track_save(
    self,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    track_state_changes: Dict[int, Dict[int, Save]],
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_add_track_events = get_user_library_factory_tx(
        update_task, "TrackSaveAdded", tx_receipt
    )
    for event in new_add_track_events:
        save_user_id = helpers.get_tx_arg(event, "_userId")
        save_track_id = helpers.get_tx_arg(event, "_trackId")

        if (save_user_id in track_state_changes) and (
            save_track_id in track_state_changes[save_user_id]
        ):
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
            if not all_required_fields_present(Save, save):
                raise EntityMissingRequiredFieldError(
                    "user_library",
                    save,
                    f"Error parsing save {save} with entity missing required field(s)",
                )
            if save_user_id in track_state_changes:
                track_state_changes[save_user_id][save_track_id] = save
            else:
                track_state_changes[save_user_id] = {save_track_id: save}


def add_playlist_save(
    self,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    playlist_state_changes,
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_add_playlist_events = get_user_library_factory_tx(
        update_task, "PlaylistSaveAdded", tx_receipt
    )

    for event in new_add_playlist_events:
        save_user_id = helpers.get_tx_arg(event, "_userId")
        save_playlist_id = helpers.get_tx_arg(event, "_playlistId")
        save_type = SaveType.playlist

        playlist_entry = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == save_playlist_id
            )
            .all()
        )

        if playlist_entry:
            if playlist_entry[0].is_album:
                save_type = SaveType.album

        if (save_user_id in playlist_state_changes) and (
            save_playlist_id in playlist_state_changes[save_user_id]
        ):
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
            if not all_required_fields_present(Save, save):
                raise EntityMissingRequiredFieldError(
                    "user_library",
                    save,
                    f"Error parsing save {save} with entity missing required field(s)",
                )
            if save_user_id in playlist_state_changes:
                playlist_state_changes[save_user_id][save_playlist_id] = save
            else:
                playlist_state_changes[save_user_id] = {save_playlist_id: save}


def delete_track_save(
    self,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    track_state_changes: Dict[int, Dict[int, Save]],
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_delete_track_events = get_user_library_factory_tx(
        update_task, "TrackSaveDeleted", tx_receipt
    )
    for event in new_delete_track_events:
        save_user_id = helpers.get_tx_arg(event, "_userId")
        save_track_id = helpers.get_tx_arg(event, "_trackId")

        if (save_user_id in track_state_changes) and (
            save_track_id in track_state_changes[save_user_id]
        ):
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
            if not all_required_fields_present(Save, save):
                raise EntityMissingRequiredFieldError(
                    "user_library",
                    save,
                    f"Error parsing save {save} with entity missing required field(s)",
                )
            if save_user_id in track_state_changes:
                track_state_changes[save_user_id][save_track_id] = save
            else:
                track_state_changes[save_user_id] = {save_track_id: save}


def delete_playlist_save(
    self,
    update_task,
    session,
    tx_receipt,
    block_number,
    block_datetime,
    playlist_state_changes: Dict[int, Dict[int, Save]],
):
    txhash = update_task.web3.toHex(tx_receipt.transactionHash)
    new_delete_playlist_events = get_user_library_factory_tx(
        update_task, "PlaylistSaveDeleted", tx_receipt
    )

    for event in new_delete_playlist_events:
        save_user_id = helpers.get_tx_arg(event, "_userId")
        deleted_playlist_id = helpers.get_tx_arg(event, "_playlistId")
        save_type = SaveType.playlist

        playlist_entry = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True, Playlist.playlist_id == deleted_playlist_id
            )
            .all()
        )

        if playlist_entry:
            if playlist_entry[0].is_album:
                save_type = SaveType.album

        if (save_user_id in playlist_state_changes) and (
            deleted_playlist_id in playlist_state_changes[save_user_id]
        ):
            playlist_state_changes[save_user_id][deleted_playlist_id].is_delete = True
        else:
            save = Save(
                blockhash=update_task.web3.toHex(event.blockHash),
                blocknumber=block_number,
                txhash=txhash,
                user_id=save_user_id,
                save_item_id=deleted_playlist_id,
                save_type=save_type,
                created_at=block_datetime,
                is_current=True,
                is_delete=True,
            )
            if not all_required_fields_present(Save, save):
                raise EntityMissingRequiredFieldError(
                    "save",
                    save,
                    f"Error parsing save {save} with entity missing required field(s)",
                )
            if save_user_id in playlist_state_changes:
                playlist_state_changes[save_user_id][deleted_playlist_id] = save
            else:
                playlist_state_changes[save_user_id] = {deleted_playlist_id: save}
