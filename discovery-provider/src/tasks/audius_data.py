import logging
from collections import defaultdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Set, Tuple

from sqlalchemy.orm.session import Session, make_transient
from src.database_task import DatabaseTask
from src.models.playlists.playlist import Playlist
from src.tasks.playlists import invalidate_old_playlist
from src.utils import helpers
from src.utils.user_event_constants import audius_data_event_types_arr

logger = logging.getLogger(__name__)


class Action(str, Enum):
    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"

    def __str__(self) -> str:
        return str.__str__(self)


class EntityType(str, Enum):
    PLAYLIST = "Playlist"

    def __str__(self) -> str:
        return str.__str__(self)


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
    event_blockhash = update_task.web3.toHex(block_hash)
    block_datetime = datetime.utcfromtimestamp(block_timestamp)
    block_integer_time = int(block_timestamp)

    changed_entity_ids: Dict[str, Set[(int)]] = defaultdict(set)

    if not audius_data_txs:
        return num_total_changes, changed_entity_ids

    playlist_events_lookup: Dict[int, Dict[str, Any]] = {}
    # This stores the playlist_ids created or updated in the set of transactions
    playlist_ids: Set[int] = set()

    entity_type_action_to_events = defaultdict(list)
    # collect events by entity type and action
    for tx_receipt in audius_data_txs:
        logger.info(f"asdf AudiusData.py | Processing {tx_receipt}")
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in audius_data_event_types_arr:
            logger.info(f"asdf event_type {event_type}")

            audius_data_event_tx = get_audius_data_events_tx(
                update_task, event_type, tx_receipt
            )
            # TODO: Batch reject operations for mismatched signer/userId
            for entry in audius_data_event_tx:
                logger.info(f"asdf entry {entry}")
                event_args = {
                    "user_id": helpers.get_tx_arg(entry, "_userId"),
                    "signer": helpers.get_tx_arg(entry, "_signer"),
                    "entity_type": helpers.get_tx_arg(entry, "_entityType"),
                    "entity_id": helpers.get_tx_arg(entry, "_entityId"),
                    "metadata": helpers.get_tx_arg(entry, "_metadata"),
                    "action": helpers.get_tx_arg(entry, "_action"),
                }
                entity_type_action_to_events[
                    (event_args["action"], event_args["entity_type"])
                ].append(event_args)
    logger.info(f"asdf entity_type_action_to_events {entity_type_action_to_events}")

    # validate events
    for entity_type_action, events in entity_type_action_to_events.items():
        action, entity_type = entity_type_action
        logger.info(f"asdf validate entity_type {entity_type} {type(entity_type)}")
        logger.info(f"asdf validate action {action} {type(action)}")
        logger.info(
            f"asdf validate Action.CREATE {Action.CREATE} {action == Action.CREATE} {type(Action.CREATE)}"
        )
        logger.info(
            f"asdf validate EntityType.PLAYLIST {EntityType.PLAYLIST} {entity_type == EntityType.PLAYLIST} {type(EntityType.PLAYLIST)}"
        )

        if action == Action.CREATE and entity_type == EntityType.PLAYLIST:
            # Create Playlist - ensure playlists don't already exists
            events_playlist_ids = [event["entity_id"] for event in events]

            existing_playlist_ids = set(
                (
                    session.query(Playlist.playlist_id)
                    .filter(Playlist.playlist_id.in_(events_playlist_ids))
                    .all()
                )
            )
            logger.info(f"asdf validate existing_playlist_ids {existing_playlist_ids}")

            valid_events = []
            for event in events:
                if event["entity_id"] not in existing_playlist_ids:
                    valid_events.append(event)

            entity_type_action_to_events[entity_type_action] = valid_events
            logger.info(f"asdf validate valid_events {valid_events}")

    # process events
    logger.info(
        f"asdf process entity_type_action_to_events {entity_type_action_to_events}"
    )

    for entity_type_action, events in entity_type_action_to_events.items():
        action, entity_type = entity_type_action
        logger.info(f"asdf process entity_type {entity_type}")
        logger.info(f"asdf process action {action}")

        if action == Action.CREATE and entity_type == EntityType.PLAYLIST:
            create_playlist_records: List[Playlist] = []
            metadata = ipfs_metadata[event["metadata"]]

            for event in events:
                logger.info(f"asdf process event {event}")
                logger.info(f"asdf process metadata {metadata}")

                track_ids = metadata.get("playlist_contents", [])
                playlist_contents = []
                for track_id in track_ids:
                    playlist_contents.append(
                        {"track": track_id, "time": block_integer_time}
                    )
                create_playlist_record = Playlist(
                    playlist_id=event["entity_id"],
                    playlist_owner_id=event["user_id"],
                    is_album=metadata.get("is_album", False),
                    description=metadata["description"],
                    playlist_image_multihash=metadata["playlist_image_sizes_multihash"],
                    playlist_image_sizes_multihash=metadata[
                        "playlist_image_sizes_multihash"
                    ],
                    playlist_name=metadata["playlist_name"],
                    is_private=metadata.get("is_private", False),
                    playlist_contents={"track_ids": playlist_contents},
                    created_at=block_datetime,
                    updated_at=block_datetime,
                    blocknumber=block_number,
                    blockhash=event_blockhash,
                    txhash=txhash,
                    is_current=True,
                    is_delete=False,
                )
                create_playlist_records.append(create_playlist_record)
            logger.info(
                f"asdf process create_playlist_records {create_playlist_records}"
            )
            session.bulk_save_objects(create_playlist_records)
            num_total_changes += len(create_playlist_records)
            changed_entity_ids["playlist"].update(
                [
                    create_playlist_record.playlist_id
                    for create_playlist_record in create_playlist_records
                ]
            )
    logger.info(f"asdf num_total_changes {num_total_changes}")
    logger.info(f"asdf changed_entity_ids {changed_entity_ids}")

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
