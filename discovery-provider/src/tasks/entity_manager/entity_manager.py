import logging
from collections import defaultdict
from typing import Any, Dict, List, Set, Tuple

from sqlalchemy.orm.session import Session
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.tasks.entity_manager.playlist import (
    create_playlist,
    delete_playlist,
    update_playlist,
)
from src.tasks.entity_manager.track import create_track, delete_track, update_track
from src.tasks.entity_manager.utils import (
    MANAGE_ENTITY_EVENT_TYPE,
    Action,
    EntityType,
    ExistingRecordDict,
    ManageEntityParameters,
    RecordDict,
)
from src.utils import helpers

logger = logging.getLogger(__name__)

# Please toggle below variable to true for development
ENABLE_DEVELOPMENT_FEATURES = True


def entity_manager_update(
    _,  # main indexing task
    update_task: DatabaseTask,
    session: Session,
    entity_manager_txs: List[Any],
    block_number: int,
    block_timestamp,
    block_hash: str,
    ipfs_metadata: Dict,
) -> Tuple[int, Dict[str, Set[(int)]]]:
    try:
        challenge_bus: ChallengeEventBus = update_task.challenge_event_bus

        num_total_changes = 0
        event_blockhash = update_task.web3.toHex(block_hash)

        changed_entity_ids: Dict[str, Set[(int)]] = defaultdict(set)

        if not entity_manager_txs:
            return num_total_changes, changed_entity_ids

        # collect events by entity type and action
        entities_to_fetch = collect_entities_to_fetch(update_task, entity_manager_txs)

        # fetch existing playlists
        existing_records: ExistingRecordDict = fetch_existing_entities(
            session, entities_to_fetch
        )

        new_records: RecordDict = {
            "playlists": defaultdict(list),
            "tracks": defaultdict(list),
        }

        pending_track_routes: List[TrackRoute] = []

        # process in tx order and populate playlists_to_save
        for tx_receipt in entity_manager_txs:
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            entity_manager_event_tx = get_entity_manager_events_tx(
                update_task, tx_receipt
            )
            for event in entity_manager_event_tx:
                try:
                    params = ManageEntityParameters(
                        session,
                        challenge_bus,
                        event,
                        new_records,  # actions below populate these records
                        existing_records,
                        pending_track_routes,
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
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.TRACK
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        create_track(params)
                    elif (
                        params.action == Action.UPDATE
                        and params.entity_type == EntityType.TRACK
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        update_track(params)

                    elif (
                        params.action == Action.DELETE
                        and params.entity_type == EntityType.TRACK
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        delete_track(params)
                    elif (
                        params.action == Action.FOLLOW
                        and params.entity_type == EntityType.USER
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        logger.info("Follow created")
                    elif (
                        params.action == Action.UNFOLLOW
                        and params.entity_type == EntityType.USER
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        logger.info("Unfollow created")
                except Exception as e:
                    # swallow exception to keep indexing
                    logger.info(
                        f"entity_manager.py | failed to process tx error {e} | with params {params}"
                    )
        # compile records_to_save
        records_to_save = []
        for playlist_records in new_records["playlists"].values():
            # flip is_current to true for the last tx in each playlist
            playlist_records[-1].is_current = True
            records_to_save.extend(playlist_records)

        for track_records in new_records["tracks"].values():
            # flip is_current to true for the last tx in each playlist
            track_records[-1].is_current = True
            records_to_save.extend(track_records)

        # insert/update all tracks, playlist records in this block
        session.bulk_save_objects(records_to_save)
        num_total_changes += len(records_to_save)

    except Exception as e:
        logger.error(f"entity_manager.py | Exception occurred {e}", exc_info=True)
        raise e
    return num_total_changes, changed_entity_ids


def collect_entities_to_fetch(
    update_task,
    entity_manager_txs,
):
    entities_to_fetch: Dict[EntityType, Set] = defaultdict(set)

    for tx_receipt in entity_manager_txs:
        entity_manager_event_tx = get_entity_manager_events_tx(update_task, tx_receipt)
        for event in entity_manager_event_tx:
            entity_id = helpers.get_tx_arg(event, "_entityId")
            entity_type = helpers.get_tx_arg(event, "_entityType")
            user_id = helpers.get_tx_arg(event, "_userId")
            action = helpers.get_tx_arg(event, "_action")
            entities_to_fetch[entity_type].add(entity_id)
            entities_to_fetch[EntityType.USER].add(user_id)

            # Query follow operations as needed
            if entity_type == EntityType.USER and (
                action == Action.FOLLOW or action == Action.UNFOLLOW
            ):
                entities_to_fetch[EntityType.FOLLOW].add((user_id, entity_id))

    return entities_to_fetch


def fetch_existing_entities(
    session: Session, entities_to_fetch: Dict[EntityType, Set[int]]
):
    existing_entities: ExistingRecordDict = {}
    playlists: List[Playlist] = (
        session.query(Playlist)
        .filter(
            Playlist.playlist_id.in_(entities_to_fetch[EntityType.PLAYLIST]),
            Playlist.is_current == True,
        )
        .all()
    )
    existing_entities["playlists"] = {
        playlist.playlist_id: playlist for playlist in playlists
    }

    tracks: List[Track] = (
        session.query(Track)
        .filter(
            Track.track_id.in_(entities_to_fetch[EntityType.TRACK]),
            Track.is_current == True,
        )
        .all()
    )
    existing_entities["tracks"] = {track.track_id: track for track in tracks}

    users: List[User] = (
        session.query(User)
        .filter(
            User.user_id.in_(entities_to_fetch[EntityType.USER]),
            User.is_current == True,
        )
        .all()
    )
    existing_entities["users"] = {user.user_id: user for user in users}

    return existing_entities


def get_entity_manager_events_tx(update_task, tx_receipt):
    return getattr(
        update_task.entity_manager_contract.events, MANAGE_ENTITY_EVENT_TYPE
    )().processReceipt(tx_receipt)
