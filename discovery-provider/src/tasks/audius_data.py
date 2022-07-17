import logging
from collections import defaultdict
from datetime import datetime
from email.policy import default
from enum import Enum
from typing import Any, Dict, List, Set, Tuple
from xml.dom.minidom import Entity

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
    try:
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

        entities_to_fetch = defaultdict(set)

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
                for event in audius_data_event_tx:
                    logger.info(f"asdf event {event}")
                    entity_id = helpers.get_tx_arg(event, "_entityId")
                    entity_type = helpers.get_tx_arg(event, "_entityType")
                    entities_to_fetch[entity_type].add(entity_id)

        # fetch existing entities
        existing_playlists: Dict[
            int, Playlist
        ] = {}  # entity type -> entity id -> entity
        existing_playlists = (
            session.query(Playlist)
            .filter(
                Playlist.playlist_id.in_(entities_to_fetch[entity_type]),
                Playlist.is_current == True,
            )
            .all()
        )
        for existing_playlist in existing_playlists:
            existing_playlists[entity_type][
                existing_playlist.playlist_id
            ] = existing_playlist

        logger.info(f"asdf entity_ownership {existing_playlists}")
        playlist_to_save: Dict[int, List[Playlist]] = defaultdict(list)
        # process in tx order and submit in batch
        for tx_receipt in audius_data_txs:
            logger.info(f"asdf processing {tx_receipt}")
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            for event_type in audius_data_event_types_arr:
                audius_data_event_tx = get_audius_data_events_tx(
                    update_task, event_type, tx_receipt
                )

                # TODO: Batch reject operations for mismatched signer/userId
                for event in audius_data_event_tx:

                    user_id = helpers.get_tx_arg(event, "_userId")
                    entity_id = helpers.get_tx_arg(event, "_entityId")
                    entity_type = helpers.get_tx_arg(event, "_entityType")
                    action = helpers.get_tx_arg(event, "_action")
                    metadata_cid = helpers.get_tx_arg(event, "_metadata")
                    signer = helpers.get_tx_arg(event, "_signer")

                    if action == Action.CREATE and entity_type == EntityType.PLAYLIST:
                        metadata = ipfs_metadata[metadata_cid]
                        logger.info(f"asdf validating {event}")

                        # validate
                        if entity_id in existing_playlists:
                            # skip if playlist already exists
                            # would also need to check playlist to be added...
                            logger.info("asdf skipping create since playlist exists")

                            continue
                        logger.info(f"asdf creating playlist from {event}")

                        track_ids = metadata.get("playlist_contents", [])
                        playlist_contents = []
                        for track_id in track_ids:
                            playlist_contents.append(
                                {"track": track_id, "time": block_integer_time}
                            )
                        create_playlist_record = Playlist(
                            playlist_id=entity_id,
                            playlist_owner_id=user_id,
                            is_album=metadata.get("is_album", False),
                            description=metadata["description"],
                            playlist_image_multihash=metadata[
                                "playlist_image_sizes_multihash"
                            ],
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
                            is_current=False,
                            is_delete=False,
                        )
                        logger.info(
                            f"asdf create_playlist_record {create_playlist_record}"
                        )

                        playlist_to_save[entity_id].append(create_playlist_record)
                        # expunge if existing
                        # process

        # process in tx order and submit in batch
        # flip is_current to true for the last tx in each entity
        records_to_save = []
        logger.info(f"asdf playlist_to_save {playlist_to_save}")

        for entity_id, playlist_records in playlist_to_save.items():
            playlist_records[-1].is_current = True
            records_to_save.extend(playlist_records)

            # expunge and invalidate existing record
        logger.info(f"asdf records_to_save {records_to_save}")

        session.bulk_save_objects(records_to_save)
    except Exception as e:
        logger.info(f"asdf error {e}")
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
