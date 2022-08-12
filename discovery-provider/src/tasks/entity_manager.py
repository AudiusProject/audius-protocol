import logging
from collections import defaultdict
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Set, Tuple

from sqlalchemy.orm.session import Session
from src.database_task import DatabaseTask
from src.models.playlists.playlist import Playlist
from src.models.users.user import User
from src.utils import helpers
from web3.datastructures import AttributeDict

logger = logging.getLogger(__name__)

PLAYLIST_ID_OFFSET = 400000


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


MANAGE_ENTITY_EVENT_TYPE = "ManageEntity"


def entity_manager_update(
    _,
    update_task: DatabaseTask,
    session: Session,
    entity_manager_txs,
    block_number,
    block_timestamp,
    block_hash,
    ipfs_metadata,
) -> Tuple[int, Dict[str, Set[(int)]]]:
    try:
        num_total_changes = 0
        event_blockhash = update_task.web3.toHex(block_hash)

        changed_entity_ids: Dict[str, Set[(int)]] = defaultdict(set)

        if not entity_manager_txs:
            return num_total_changes, changed_entity_ids

        entities_to_fetch: Dict[EntityType, Set[int]] = defaultdict(set)
        users_to_fetch: Set[int] = set()

        # collect events by entity type and action
        entities_to_fetch = collect_entities_to_fetch(
            update_task, entity_manager_txs, users_to_fetch
        )

        # fetch existing playlists
        existing_playlist_id_to_playlist: Dict[int, Playlist] = fetch_existing_entities(
            session, entities_to_fetch
        )

        # fetch users
        existing_user_id_to_user: Dict[int, User] = fetch_users(session, users_to_fetch)

        new_playlist_records: Dict[int, List[Playlist]] = defaultdict(list)
        # process in tx order and populate playlists_to_save
        for tx_receipt in entity_manager_txs:
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            entity_manager_event_tx = get_entity_manager_events_tx(
                update_task, tx_receipt
            )
            for event in entity_manager_event_tx:
                params = ManagePlaylistParameters(
                    event,
                    new_playlist_records,  # actions below populate these records
                    existing_playlist_id_to_playlist,
                    existing_user_id_to_user,
                    ipfs_metadata,
                    block_timestamp,
                    block_number,
                    event_blockhash,
                    txhash,
                )
                if (
                    params.action == Action.CREATE
                    and params.entity_type == EntityType.PLAYLIST
                ):
                    create_playlist(params)
                elif (
                    params.action == Action.UPDATE
                    and params.entity_type == EntityType.PLAYLIST
                ):
                    update_playlist(params)

                elif (
                    params.action == Action.DELETE
                    and params.entity_type == EntityType.PLAYLIST
                ):
                    delete_playlist(params)

        # compile records_to_save
        new_records = []
        for playlist_records in new_playlist_records.values():
            # flip is_current to true for the last tx in each playlist
            playlist_records[-1].is_current = True
            new_records.extend(playlist_records)

        # insert/update all playlist records in this block
        session.bulk_save_objects(new_records)
        num_total_changes += len(new_records)

    except Exception as e:
        logger.error(f"Exception occurred {e}", exc_info=True)
        raise e
    return num_total_changes, changed_entity_ids


class ManagePlaylistParameters:
    def __init__(
        self,
        event: AttributeDict,
        playlists_to_save: Dict[int, List[Playlist]],
        existing_playlist_id_to_playlist: Dict[int, Playlist],
        existing_user_id_to_user: Dict[int, User],
        ipfs_metadata: Dict[str, Dict[str, Any]],
        block_timestamp: int,
        block_number: int,
        event_blockhash: str,
        txhash: str,
    ):
        self.user_id = helpers.get_tx_arg(event, "_userId")
        self.entity_id = helpers.get_tx_arg(event, "_entityId")
        self.entity_type = helpers.get_tx_arg(event, "_entityType")
        self.action = helpers.get_tx_arg(event, "_action")
        self.metadata_cid = helpers.get_tx_arg(event, "_metadata")
        self.signer = helpers.get_tx_arg(event, "_signer")
        self.block_datetime = datetime.utcfromtimestamp(block_timestamp)
        self.block_integer_time = int(block_timestamp)

        self.event = event
        self.ipfs_metadata = ipfs_metadata
        self.existing_playlist_id_to_playlist = existing_playlist_id_to_playlist
        self.block_number = block_number
        self.event_blockhash = event_blockhash
        self.txhash = txhash
        self.existing_user_id_to_user = existing_user_id_to_user
        self.playlists_to_save = playlists_to_save


def is_valid_playlist_tx(params: ManagePlaylistParameters):
    if params.user_id not in params.existing_user_id_to_user:
        # user does not exist
        return False

    wallet = params.existing_user_id_to_user[params.user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        # user does not match signer
        return False

    if params.entity_type != EntityType.PLAYLIST:
        return False

    if params.action == Action.CREATE:
        if params.entity_id in params.existing_playlist_id_to_playlist:
            # playlist already exists
            return False
        if params.entity_id < PLAYLIST_ID_OFFSET:
            return False
    else:
        # update / delete specific validations
        if params.entity_id not in params.existing_playlist_id_to_playlist:
            # playlist does not exist
            return False
        existing_playlist: Playlist = params.existing_playlist_id_to_playlist[
            params.entity_id
        ]
        if existing_playlist.playlist_owner_id != params.user_id:
            # existing playlist does not match user
            return False

    return True


def create_playlist(params: ManagePlaylistParameters):
    if not is_valid_playlist_tx(params):
        return

    metadata = params.ipfs_metadata[params.metadata_cid]
    tracks = metadata["playlist_contents"].get("track_ids", [])
    tracks_with_index_time = []
    for track in tracks:
        tracks_with_index_time.append(
            {
                "track": track["track"],
                "metadata_time": track["time"],
                "time": params.block_integer_time,
            }
        )
    create_playlist_record = Playlist(
        playlist_id=params.entity_id,
        metadata_multihash=params.metadata_cid,
        playlist_owner_id=params.user_id,
        is_album=metadata.get("is_album", False),
        description=metadata["description"],
        playlist_image_multihash=metadata["playlist_image_sizes_multihash"],
        playlist_image_sizes_multihash=metadata["playlist_image_sizes_multihash"],
        playlist_name=metadata["playlist_name"],
        is_private=metadata.get("is_private", False),
        playlist_contents={"track_ids": tracks_with_index_time},
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        blocknumber=params.block_number,
        blockhash=params.event_blockhash,
        txhash=params.txhash,
        is_current=False,
        is_delete=False,
    )

    params.playlists_to_save[params.entity_id].append(create_playlist_record)
    params.existing_playlist_id_to_playlist[params.entity_id] = create_playlist_record


def update_playlist(params: ManagePlaylistParameters):
    if not is_valid_playlist_tx(params):
        return
    # TODO ignore updates on deleted playlists?

    metadata = params.ipfs_metadata[params.metadata_cid]
    existing_playlist = params.existing_playlist_id_to_playlist[params.entity_id]
    existing_playlist.is_current = False  # invalidate
    if (
        params.entity_id in params.playlists_to_save
    ):  # override with last updated playlist is in this block
        existing_playlist = params.playlists_to_save[params.entity_id][-1]

    updated_playlist = copy_record(
        existing_playlist, params.block_number, params.event_blockhash, params.txhash
    )
    process_playlist_data_event(
        updated_playlist,
        metadata,
        params.block_integer_time,
        params.block_datetime,
        params.metadata_cid,
    )
    params.playlists_to_save[params.entity_id].append(updated_playlist)
    params.existing_playlist_id_to_playlist[params.entity_id] = updated_playlist


def delete_playlist(params: ManagePlaylistParameters):
    if not is_valid_playlist_tx(params):
        return

    existing_playlist = params.existing_playlist_id_to_playlist[params.entity_id]
    existing_playlist.is_current = False  # invalidate old playlist
    if params.entity_id in params.playlists_to_save:
        # override with last updated playlist is in this block
        existing_playlist = params.playlists_to_save[params.entity_id][-1]

    deleted_playlist = copy_record(
        existing_playlist, params.block_number, params.event_blockhash, params.txhash
    )
    deleted_playlist.is_delete = True

    params.playlists_to_save[params.entity_id].append(deleted_playlist)


def collect_entities_to_fetch(
    update_task,
    entity_manager_txs,
    users_to_fetch: Set[int],
):
    entities_to_fetch: Dict[EntityType, Set[int]] = defaultdict(set)
    for tx_receipt in entity_manager_txs:
        entity_manager_event_tx = get_entity_manager_events_tx(update_task, tx_receipt)
        for event in entity_manager_event_tx:
            entity_id = helpers.get_tx_arg(event, "_entityId")
            entity_type = helpers.get_tx_arg(event, "_entityType")
            user_id = helpers.get_tx_arg(event, "_userId")

            entities_to_fetch[entity_type].add(entity_id)
            users_to_fetch.add(user_id)
    return entities_to_fetch


def fetch_existing_entities(
    session: Session, entities_to_fetch: Dict[EntityType, Set[int]]
):
    existing_playlist_id_to_playlist: Dict[int, Playlist] = {}
    existing_playlists_query = (
        session.query(Playlist)
        .filter(
            Playlist.playlist_id.in_(entities_to_fetch[EntityType.PLAYLIST]),
            Playlist.is_current == True,
        )
        .all()
    )
    for existing_playlist in existing_playlists_query:
        existing_playlist_id_to_playlist[
            existing_playlist.playlist_id
        ] = existing_playlist
    return existing_playlist_id_to_playlist


def fetch_users(session: Session, users_to_fetch: Set[int]):
    existing_user_id_to_user: Dict[int, User] = {}
    existing_users_query = (
        session.query(User)
        .filter(
            User.user_id.in_(users_to_fetch),
            User.is_current == True,
        )
        .all()
    )
    for user in existing_users_query:
        existing_user_id_to_user[user.user_id] = user
    return existing_user_id_to_user


def copy_record(old_playlist: Playlist, block_number, event_blockhash, txhash):
    new_playlist = Playlist(
        playlist_id=old_playlist.playlist_id,
        playlist_owner_id=old_playlist.playlist_owner_id,
        is_album=old_playlist.is_album,
        description=old_playlist.description,
        playlist_image_multihash=old_playlist.playlist_image_multihash,
        playlist_image_sizes_multihash=old_playlist.playlist_image_sizes_multihash,
        playlist_name=old_playlist.playlist_name,
        is_private=old_playlist.is_private,
        playlist_contents=old_playlist.playlist_contents,
        created_at=old_playlist.created_at,
        updated_at=old_playlist.updated_at,
        blocknumber=block_number,
        blockhash=event_blockhash,
        txhash=txhash,
        is_current=False,
        is_delete=old_playlist.is_delete,
        metadata_multihash=old_playlist.metadata_multihash,
    )
    return new_playlist


def get_entity_manager_events_tx(update_task, tx_receipt):
    return getattr(
        update_task.entity_manager_contract.events, MANAGE_ENTITY_EVENT_TYPE
    )().processReceipt(tx_receipt)


def process_playlist_contents(
    playlist_record: Playlist, playlist_metadata, block_integer_time
):
    if playlist_record.metadata_multihash:
        # playlist already has metadata
        metadata_index_time_dict: Dict[int, Dict[int, int]] = defaultdict(dict)
        for track in playlist_record.playlist_contents["track_ids"]:
            track_id = track["track"]
            metadata_time = track["metadata_time"]
            metadata_index_time_dict[track_id][metadata_time] = track["time"]

        updated_tracks = []
        for track in playlist_metadata["playlist_contents"]["track_ids"]:
            track_id = track["track"]
            metadata_time = track["time"]
            index_time = block_integer_time  # default to current block for new tracks

            if (
                track_id in metadata_index_time_dict
                and metadata_time in metadata_index_time_dict[track_id]
            ):
                # track exists in prev record (reorder / delete)
                index_time = metadata_index_time_dict[track_id][metadata_time]

            updated_tracks.append(
                {
                    "track": track_id,
                    "time": index_time,
                    "metadata_time": metadata_time,
                }
            )
    else:
        # upgrade legacy playlist to include metadata
        # assume metadata and indexing timestamp is the same
        track_id_index_times: Set = set()
        for track in playlist_record.playlist_contents["track_ids"]:
            track_id = track["track"]
            index_time = track["time"]
            track_id_index_times.add((track_id, index_time))

        updated_tracks = []
        for track in playlist_metadata["playlist_contents"]["track_ids"]:
            track_id = track["track"]
            metadata_time = track["time"]

            # use track["time"] if present in previous record else this is a new track
            index_time = (
                track["time"]
                if (track_id, metadata_time) in track_id_index_times
                else block_integer_time
            )
            updated_tracks.append(
                {
                    "track": track_id,
                    "time": index_time,
                    "metadata_time": metadata_time,
                }
            )

    return {"track_ids": updated_tracks}


def process_playlist_data_event(
    playlist_record: Playlist,
    playlist_metadata,
    block_integer_time,
    block_datetime,
    metadata_cid,
):
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
    playlist_record.playlist_contents = process_playlist_contents(
        playlist_record, playlist_metadata, block_integer_time
    )
    playlist_record.updated_at = block_datetime
    playlist_record.metadata_multihash = metadata_cid

    logger.info(
        f"index.py | AudiusData | Updated playlist record {playlist_record}"
    )
