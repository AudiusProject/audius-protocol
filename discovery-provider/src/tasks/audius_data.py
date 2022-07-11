import logging
from datetime import datetime
from typing import Any, Dict, Set, Tuple

from sqlalchemy.orm.session import Session, make_transient
from src.database_task import DatabaseTask
from src.models.playlists.playlist import Playlist
from src.tasks.playlists import invalidate_old_playlist
from src.utils import helpers
from src.utils.user_event_constants import audius_data_event_types_arr

logger = logging.getLogger(__name__)


def audius_data_state_update(
    self,
    update_task: DatabaseTask,
    session: Session,
    audius_data_txs,
    block_number,
    block_timestamp,
    block_hash,
    ipfs_metadata,  # prefix unused args with underscore to prevent pylint
    _blacklisted_cids,
) -> Tuple[int, Dict[str, Set[(int)]]]:
    num_total_changes = 0

    changed_entity_ids: Dict[str, Set[(int)]] = {}

    if not audius_data_txs:
        return num_total_changes, changed_entity_ids

    playlist_events_lookup: Dict[int, Dict[str, Any]] = {}
    # This stores the playlist_ids created or updated in the set of transactions
    playlist_ids: Set[int] = set()

    for tx_receipt in audius_data_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in audius_data_event_types_arr:
            audius_data_event_tx = get_audius_data_events_tx(
                update_task, event_type, tx_receipt
            )

            processed_entries = 0
            # TODO: Batch reject operations for mismatched signer/userId
            for entry in audius_data_event_tx:
                user_id = helpers.get_tx_arg(entry, "_userId")
                entity_id = helpers.get_tx_arg(entry, "_entityId")
                entity_type = helpers.get_tx_arg(entry, "_entityType")
                action = helpers.get_tx_arg(entry, "_action")
                metadata_cid = helpers.get_tx_arg(entry, "_metadata")
                signer = helpers.get_tx_arg(entry, "_signer")
                metadata = (
                    ipfs_metadata[metadata_cid]
                    if metadata_cid in ipfs_metadata
                    else None
                )
                logger.info(
                    f"index.py | AudiusData state update: {user_id}, entity_id={entity_id}, entity_type={entity_type}, action={action}, metadata_cid={metadata_cid}, metadata={metadata} signer={signer}"
                )

                # Handle playlist creation
                if entity_type == "Playlist":
                    playlist_id = entity_id
                    # look up or populate existing record
                    if playlist_id in playlist_events_lookup:
                        existing_playlist_record = playlist_events_lookup[playlist_id][
                            "playlist"
                        ]
                    else:
                        existing_playlist_record = lookup_playlist_data_record(
                            update_task,
                            session,
                            playlist_id,
                            block_number,
                            block_hash,
                            txhash,
                        )

                    if action == "Create" or action == "Update":
                        playlist_record = parse_playlist_create_data_event(
                            update_task,
                            entry,
                            user_id,
                            existing_playlist_record,
                            metadata,
                            block_timestamp,
                            session,
                        )

                    elif action == "Delete":
                        existing_playlist_record.is_delete = True
                        playlist_record = existing_playlist_record

                    if playlist_record is not None:
                        if playlist_id not in playlist_events_lookup:
                            playlist_events_lookup[playlist_id] = {
                                "playlist": playlist_record,
                                "events": [],
                            }
                        else:
                            playlist_events_lookup[playlist_id][
                                "playlist"
                            ] = playlist_record
                        playlist_events_lookup[playlist_id]["events"].append(event_type)
                    playlist_ids.add(playlist_id)
                processed_entries += 1

            num_total_changes += processed_entries

    # Update changed entity dictionary
    changed_entity_ids["playlist"] = playlist_ids

    for playlist_id, value_obj in playlist_events_lookup.items():
        logger.info(f"index.py | playlists.py | Adding {value_obj['playlist']})")
        if value_obj["events"]:
            invalidate_old_playlist(session, playlist_id)
            session.add(value_obj["playlist"])

    return num_total_changes, changed_entity_ids


def get_audius_data_events_tx(update_task, event_type, tx_receipt):
    return getattr(
        update_task.audius_data_contract.events, event_type
    )().processReceipt(tx_receipt)


def lookup_playlist_data_record(
    update_task, session, playlist_id, block_number, block_hash, txhash
):
    event_blockhash = update_task.web3.toHex(block_hash)
    # Check if playlist record is in the DB
    playlist_exists = (
        session.query(Playlist).filter_by(playlist_id=playlist_id).count() > 0
    )

    playlist_record = None
    if playlist_exists:
        playlist_record = (
            session.query(Playlist)
            .filter(Playlist.playlist_id == playlist_id, Playlist.is_current == True)
            .first()
        )

        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(playlist_record)
        make_transient(playlist_record)
    else:
        playlist_record = Playlist(
            playlist_id=playlist_id, is_current=True, is_delete=False
        )

    # update these fields regardless of type
    playlist_record.blocknumber = block_number
    playlist_record.blockhash = event_blockhash
    playlist_record.txhash = txhash

    return playlist_record


# Create playlist specific
def parse_playlist_create_data_event(
    update_task,
    entry,
    playlist_owner_id,
    playlist_record,
    playlist_metadata,
    block_timestamp,
    session,
):
    block_datetime = datetime.utcfromtimestamp(block_timestamp)
    block_integer_time = int(block_timestamp)
    playlist_record.playlist_owner_id = playlist_owner_id
    playlist_record.is_album = (
        playlist_metadata["is_album"] if "is_album" in playlist_metadata else False
    )
    playlist_record.description = playlist_metadata["description"]
    playlist_record.playlist_image_multihash = playlist_metadata[
        "playlist_image_sizes_multihash"
    ]
    playlist_record.playlist_image_sizes_multihash = playlist_metadata[
        "playlist_image_sizes_multihash"
    ]
    playlist_record.playlist_name = playlist_metadata["playlist_name"]
    playlist_record.is_private = (
        playlist_metadata["is_private"] if "is_private" in playlist_metadata else False
    )
    playlist_content_array = []
    track_ids = playlist_metadata["playlist_contents"]
    if track_ids:
        for track_id in track_ids:
            playlist_content_array.append(
                {"track": track_id, "time": block_integer_time}
            )
    playlist_record.playlist_contents = {"track_ids": playlist_content_array}
    playlist_record.created_at = block_datetime
    playlist_record.updated_at = block_datetime

    logger.info(f"index.py | AudiusData | Created playlist record {playlist_record}")
    # TODO: All required fields validation
    return playlist_record
