import json
import time
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Set, Tuple, cast

from sqlalchemy import and_, func, literal_column, or_
from sqlalchemy.orm.session import Session
from web3.types import TxReceipt

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.exceptions import IndexingValidationError
from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser
from src.models.grants.developer_app import DeveloperApp
from src.models.grants.grant import Grant
from src.models.indexing.revert_block import RevertBlock
from src.models.notifications.notification import NotificationSeen, PlaylistSeen
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.associated_wallet import AssociatedWallet
from src.models.users.user import User
from src.models.users.user_events import UserEvent
from src.queries.confirm_indexing_transaction_error import (
    confirm_indexing_transaction_error,
)
from src.queries.get_skipped_transactions import (
    clear_indexing_error,
    save_and_get_skip_tx_hash,
    set_indexing_error,
)
from src.tasks.entity_manager.entities.dashboard_wallet_user import (
    create_dashboard_wallet_user,
    delete_dashboard_wallet_user,
)
from src.tasks.entity_manager.entities.developer_app import (
    create_developer_app,
    delete_developer_app,
)
from src.tasks.entity_manager.entities.grant import (
    approve_grant,
    create_grant,
    reject_grant,
    revoke_grant,
)
from src.tasks.entity_manager.entities.notification import (
    create_notification,
    view_notification,
    view_playlist,
)
from src.tasks.entity_manager.entities.playlist import (
    create_playlist,
    delete_playlist,
    update_playlist,
)
from src.tasks.entity_manager.entities.social_features import (
    action_to_record_types,
    create_social_action_types,
    create_social_record,
    delete_social_action_types,
    delete_social_record,
)
from src.tasks.entity_manager.entities.track import (
    create_track,
    delete_track,
    update_track,
)
from src.tasks.entity_manager.entities.user import create_user, update_user, verify_user
from src.tasks.entity_manager.entities.user_replica_set import update_user_replica_set
from src.tasks.entity_manager.utils import (
    MANAGE_ENTITY_EVENT_TYPE,
    Action,
    EntitiesToFetchDict,
    EntityType,
    ManageEntityParameters,
    RecordDict,
    expect_cid_metadata_json,
    get_address_from_signature,
    get_record_key,
    parse_metadata,
    reset_entity_manager_event_tx_context,
    save_cid_metadata,
)
from src.utils import helpers
from src.utils.indexing_errors import IndexingError
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)

# Please toggle below variable to true for development
ENABLE_DEVELOPMENT_FEATURES = True

entity_type_table_mapping = {
    "Save": Save.__tablename__,
    "Repost": Repost.__tablename__,
    "Follow": Follow.__tablename__,
    "Subscription": Subscription.__tablename__,
    "Playlist": Playlist.__tablename__,
    "Track": Track.__tablename__,
    "User": User.__tablename__,
    "AssociatedWallet": AssociatedWallet.__tablename__,
    "UserEvent": UserEvent.__tablename__,
    "TrackRoute": TrackRoute.__tablename__,
    "PlaylistRoute": PlaylistRoute.__tablename__,
    "NotificationSeen": NotificationSeen.__tablename__,
    "PlaylistSeen": PlaylistSeen.__tablename__,
    "DashboardWalletUser": DashboardWalletUser.__tablename__,
    "DeveloperApp": DeveloperApp.__tablename__,
    "Grant": Grant.__tablename__,
}


def get_record_columns(record) -> List[str]:
    columns = [str(m.key) for m in record.__table__.columns]
    return columns


def entity_manager_update(
    update_task: DatabaseTask,
    session: Session,
    entity_manager_txs: List[TxReceipt],
    block_number: int,
    block_timestamp: int,
    block_hash: str,
) -> Tuple[int, Dict[str, Set[(int)]]]:
    """
    Process a block of EM transactions.

    1. Fetch relevant entities for all transactions.
    2. Process transactions based on type and action.
    3. Validate transaction.
    4. Create new database record based on a transaction.
    5. Bulk insert new records.
    """

    try:
        update_start_time = time.time()
        challenge_bus: ChallengeEventBus = update_task.challenge_event_bus

        num_total_changes = 0

        changed_entity_ids: Dict[str, Set[(int)]] = defaultdict(set)
        if not entity_manager_txs:
            return num_total_changes, changed_entity_ids

        metric_latency = PrometheusMetric(
            PrometheusMetricNames.ENTITY_MANAGER_UPDATE_DURATION_SECONDS
        )
        metric_num_changed = PrometheusMetric(
            PrometheusMetricNames.ENTITY_MANAGER_UPDATE_CHANGED_LATEST
        )

        # collect events by entity type and action
        entities_to_fetch = collect_entities_to_fetch(update_task, entity_manager_txs)

        # fetch existing tracks and playlists
        existing_records, existing_records_in_json = fetch_existing_entities(
            session, entities_to_fetch
        )
        # copy original record since existing_records will be modified
        original_records = copy_original_records(existing_records)

        new_records: RecordDict = cast(
            RecordDict, defaultdict(lambda: defaultdict(list))
        )

        pending_track_routes: List[TrackRoute] = []
        pending_playlist_routes: List[PlaylistRoute] = []

        # cid -> metadata type
        cid_type: Dict[str, str] = {}
        # cid -> metadata
        cid_metadata: Dict[str, Dict] = {}

        # process in tx order and populate records_to_save
        for tx_receipt in entity_manager_txs:
            txhash = update_task.web3.to_hex(tx_receipt["transactionHash"])
            entity_manager_event_tx = get_entity_manager_events_tx(
                update_task, tx_receipt
            )

            for event in entity_manager_event_tx:
                try:
                    params = ManageEntityParameters(
                        session,
                        update_task.redis,
                        challenge_bus,
                        event,
                        new_records,  # actions below populate these records
                        existing_records,
                        pending_track_routes,
                        pending_playlist_routes,
                        update_task.eth_manager,
                        update_task.web3,
                        block_timestamp,
                        block_number,
                        block_hash,
                        txhash,
                        logger,
                    )

                    # update logger context with this tx event
                    reset_entity_manager_event_tx_context(logger, event["args"])

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
                    elif params.action in create_social_action_types:
                        create_social_record(params)
                    elif params.action in delete_social_action_types:
                        delete_social_record(params)
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.USER
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        create_user(params, cid_type, cid_metadata)
                    elif (
                        params.action == Action.UPDATE
                        and params.entity_type == EntityType.USER
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        update_user(params, cid_type, cid_metadata)
                    elif (
                        params.action == Action.VERIFY
                        and params.entity_type == EntityType.USER
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        verify_user(params)
                    elif (
                        params.action == Action.UPDATE
                        and params.entity_type == EntityType.USER_REPLICA_SET
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        update_user_replica_set(params)
                    elif (
                        params.action == Action.VIEW
                        and params.entity_type == EntityType.NOTIFICATION
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        view_notification(params)
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.NOTIFICATION
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        create_notification(params)
                    elif (
                        params.action == Action.VIEW_PLAYLIST
                        and params.entity_type == EntityType.NOTIFICATION
                        and ENABLE_DEVELOPMENT_FEATURES
                    ):
                        view_playlist(params)
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.DEVELOPER_APP
                    ):
                        create_developer_app(params)
                    elif (
                        params.action == Action.DELETE
                        and params.entity_type == EntityType.DEVELOPER_APP
                    ):
                        delete_developer_app(params)
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.GRANT
                    ):
                        create_grant(params)
                    elif (
                        params.action == Action.DELETE
                        and params.entity_type == EntityType.GRANT
                    ):
                        revoke_grant(params)
                    elif (
                        params.action == Action.APPROVE
                        and params.entity_type == EntityType.GRANT
                    ):
                        approve_grant(params)
                    elif (
                        params.action == Action.REJECT
                        and params.entity_type == EntityType.GRANT
                    ):
                        reject_grant(params)
                    elif (
                        params.action == Action.CREATE
                        and params.entity_type == EntityType.DASHBOARD_WALLET_USER
                    ):
                        create_dashboard_wallet_user(params)
                    elif (
                        params.action == Action.DELETE
                        and params.entity_type == EntityType.DASHBOARD_WALLET_USER
                    ):
                        delete_dashboard_wallet_user(params)

                    logger.info("process transaction")  # log event context
                except IndexingValidationError as e:
                    # swallow exception to keep indexing
                    logger.error(f"failed to process transaction error {e}")
                except Exception as e:
                    indexing_error = IndexingError(
                        "tx-failure",
                        block_number,
                        block_hash,
                        txhash,
                        str(e),
                    )
                    create_and_raise_indexing_error(
                        indexing_error, update_task.redis, session
                    )
                    logger.error(f"skipping transaction hash {indexing_error}")

        # compile records_to_save
        save_new_records(
            block_timestamp,
            block_number,
            new_records,
            original_records,
            existing_records_in_json,
            session,
        )

        num_total_changes += len(new_records)
        # update metrics
        metric_latency.save_time(
            {"scope": "entity_manager_update"},
            start_time=update_start_time,
        )
        metric_num_changed.save(
            len(new_records["Playlist"]), {"entity_type": EntityType.PLAYLIST.value}
        )
        metric_num_changed.save(
            len(new_records["Track"]), {"entity_type": EntityType.TRACK.value}
        )

        logger.info(
            f"entity_manager.py | Completed with {num_total_changes} total changes"
        )

        # bulk save to metadata to cid_data
        if cid_metadata:
            save_cid_metadata_time = time.time()
            save_cid_metadata(session, cid_metadata, cid_type)
            metric_latency.save_time(
                {"scope": "save_cid_metadata"},
                start_time=save_cid_metadata_time,
            )
            logger.debug(
                f"entity_manager.py | save_cid_metadata in {time.time() - save_cid_metadata_time}s"
            )
    except Exception as e:
        logger.error(f"entity_manager.py | Exception occurred {e}", exc_info=True)
        raise e
    return num_total_changes, changed_entity_ids


def save_new_records(
    block_timestamp: int,
    block_number: int,
    new_records: RecordDict,
    original_records: dict,
    existing_records_in_json: dict[str, dict],
    session: Session,
):
    prev_records: Dict[str, List] = defaultdict(list)
    records_to_update = []
    for record_type, record_dict in new_records.items():
        # This is actually a dict, but python has a hard time inferring.
        casted_record_dict = cast(dict, record_dict)
        for entity_id, records in casted_record_dict.items():
            if not records:
                continue
            record_to_delete = None
            records_to_add = []
            # invalidate old records
            if (
                record_type in original_records
                and entity_id in original_records[record_type]
                and (
                    "is_current"
                    not in get_record_columns(original_records[record_type][entity_id])
                    or original_records[record_type][entity_id].is_current
                )
            ):
                if record_type == "PlaylistRoute" or record_type == "TrackRoute":
                    # these are an exception since we want to keep is_current false to preserve old slugs
                    original_records[record_type][entity_id].is_current = False
                else:
                    record_to_delete = original_records[record_type][entity_id]
                # add the json record for revert blocks
                prev_records[entity_type_table_mapping[record_type]].append(
                    existing_records_in_json[record_type][entity_id]
                )
            # invalidate all new records except the last
            for record in records:
                if "is_current" in get_record_columns(record):
                    record.is_current = False

                if "updated_at" in get_record_columns(record):
                    record.updated_at = datetime.utcfromtimestamp(block_timestamp)
            if "is_current" in get_record_columns(records[-1]):
                records[-1].is_current = True
            if record_type == "PlaylistRoute" or record_type == "TrackRoute":
                records_to_add.extend(records)
            else:
                records_to_add.append(records[-1])
            records_to_update.append((record_to_delete, records_to_add))
    if prev_records:
        revert_block = RevertBlock(blocknumber=block_number, prev_records=prev_records)
        session.add(revert_block)
        session.flush()
    for record_to_delete, records_to_add in records_to_update:
        if record_to_delete:
            session.delete(record_to_delete)
        session.flush()
        session.add_all(records_to_add)


def copy_original_records(existing_records):
    original_records = {}
    for entity_type in existing_records:
        original_records[entity_type] = {}
        for entity_id, entity in existing_records[entity_type].items():
            original_records[entity_type][entity_id] = entity
    return original_records


entity_types_to_fetch = set([EntityType.USER, EntityType.TRACK, EntityType.PLAYLIST])


def collect_entities_to_fetch(update_task, entity_manager_txs):
    entities_to_fetch: Dict[EntityType, Set] = defaultdict(set)

    for tx_receipt in entity_manager_txs:
        entity_manager_event_tx = get_entity_manager_events_tx(update_task, tx_receipt)
        for event in entity_manager_event_tx:
            entity_id = helpers.get_tx_arg(event, "_entityId")
            entity_type = helpers.get_tx_arg(event, "_entityType")
            action = helpers.get_tx_arg(event, "_action")
            user_id = helpers.get_tx_arg(event, "_userId")
            metadata = helpers.get_tx_arg(event, "_metadata")
            signer = helpers.get_tx_arg(event, "_signer")

            if entity_type in entity_types_to_fetch:
                entities_to_fetch[entity_type].add(entity_id)
            if entity_type == EntityType.USER:
                entities_to_fetch[EntityType.USER_EVENT].add(user_id)
                entities_to_fetch[EntityType.ASSOCIATED_WALLET].add(user_id)
            if entity_type == EntityType.TRACK:
                entities_to_fetch[EntityType.TRACK_ROUTE].add(entity_id)
            if entity_type == EntityType.PLAYLIST:
                entities_to_fetch[EntityType.PLAYLIST_ROUTE].add(entity_id)
            if (
                entity_type == EntityType.NOTIFICATION
                and action == Action.VIEW_PLAYLIST
            ):
                entities_to_fetch[EntityType.PLAYLIST_SEEN].add((user_id, entity_id))
                entities_to_fetch[EntityType.PLAYLIST].add(entity_id)
            if user_id:
                entities_to_fetch[EntityType.USER].add(user_id)
            if signer:
                entities_to_fetch[EntityType.GRANT].add((signer.lower(), user_id))
                entities_to_fetch[EntityType.DEVELOPER_APP].add(signer.lower())
                entities_to_fetch[EntityType.USER_WALLET].add(signer.lower())
            if entity_type == EntityType.DEVELOPER_APP:
                try:
                    json_metadata = json.loads(metadata)
                except Exception as e:
                    logger.error(
                        f"tasks | entity_manager.py | Exception deserializing {action} {entity_type} event metadata: {e}"
                    )
                    # skip invalid metadata
                    continue

                raw_address = json_metadata.get("address", None)
                if raw_address:
                    entities_to_fetch[EntityType.DEVELOPER_APP].add(raw_address.lower())
                else:
                    try:
                        entities_to_fetch[EntityType.DEVELOPER_APP].add(
                            get_address_from_signature(
                                json_metadata.get("app_signature", {})
                            )
                        )
                    except:
                        logger.error(
                            "tasks | entity_manager.py | Missing address or valid app signature in metadata required for add developer app tx"
                        )
            if entity_type == EntityType.GRANT:
                try:
                    json_metadata = json.loads(metadata)
                except Exception as e:
                    logger.error(
                        f"tasks | entity_manager.py | Exception deserializing {action} {entity_type} event metadata: {e}"
                    )
                    # skip invalid metadata
                    continue

                raw_grantee_address = json_metadata.get("grantee_address", None)
                if raw_grantee_address:
                    entities_to_fetch[EntityType.GRANT].add(
                        (raw_grantee_address.lower(), user_id)
                    )
                    entities_to_fetch[EntityType.DEVELOPER_APP].add(
                        raw_grantee_address.lower()
                    )
                    entities_to_fetch[EntityType.USER_WALLET].add(
                        raw_grantee_address.lower()
                    )
                raw_grantor_user_id = json_metadata.get("grantor_user_id", None)
                if raw_grantor_user_id and signer:
                    entities_to_fetch[EntityType.GRANT].add(
                        (signer.lower(), raw_grantor_user_id)
                    )  # TODO - Look for grant from user's wallet to grantor user id instead, since signer might not be the user

            if entity_type == EntityType.DASHBOARD_WALLET_USER:
                try:
                    json_metadata = json.loads(metadata)
                except Exception as e:
                    logger.error(
                        f"tasks | entity_manager.py | Exception deserializing {action} {entity_type} event metadata: {e}"
                    )
                    # skip invalid metadata
                    continue

                raw_wallet = json_metadata.get("wallet", None)
                if raw_wallet:
                    entities_to_fetch[EntityType.DASHBOARD_WALLET_USER].add(
                        raw_wallet.lower()
                    )
                else:
                    logger.error(
                        "tasks | entity_manager.py | Missing wallet in metadata required for create dashboard wallet user tx"
                    )

            # Query social operations as needed
            if action in action_to_record_types.keys():
                record_types = action_to_record_types[action]
                for record_type in record_types:
                    entity_key = get_record_key(user_id, entity_type, entity_id)
                    entities_to_fetch[record_type].add(entity_key)

            if expect_cid_metadata_json(metadata, action, entity_type):
                try:
                    json_metadata, _ = parse_metadata(metadata, action, entity_type)
                except Exception:
                    # skip invalid metadata
                    continue

                # Add playlist track ids in entities to fetch
                # to prevent playlists from including gated tracks
                tracks = json_metadata.get("playlist_contents", {}).get("track_ids", [])
                for track in tracks:
                    entities_to_fetch[EntityType.TRACK].add(track["track"])

                if entity_type == EntityType.TRACK:
                    user_id = json_metadata.get("ai_attribution_user_id")
                    if user_id:
                        entities_to_fetch[EntityType.USER].add(user_id)

    return entities_to_fetch


def fetch_existing_entities(session: Session, entities_to_fetch: EntitiesToFetchDict):
    existing_entities: Dict[EntityType, Dict] = defaultdict(dict)
    existing_entities_in_json: Dict[EntityType, Dict] = defaultdict(dict)

    # PLAYLISTS
    if entities_to_fetch["Playlist"]:
        playlists: List[Tuple[Playlist, dict]] = (
            session.query(
                Playlist, literal_column(f"row_to_json({Playlist.__tablename__})")
            )
            .filter(
                Playlist.playlist_id.in_(entities_to_fetch["Playlist"]),
                Playlist.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.PLAYLIST] = {
            playlist.playlist_id: playlist for playlist, _ in playlists
        }
        existing_entities_in_json[EntityType.PLAYLIST] = {
            playlist_json["playlist_id"]: playlist_json
            for _, playlist_json in playlists
        }

    # TRACKS
    if entities_to_fetch["Track"]:
        tracks: List[Tuple[Track, dict]] = (
            session.query(Track, literal_column(f"row_to_json({Track.__tablename__})"))
            .filter(
                Track.track_id.in_(entities_to_fetch["Track"]),
                Track.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.TRACK] = {
            track.track_id: track for track, _ in tracks
        }
        existing_entities_in_json[EntityType.TRACK] = {
            track_json["track_id"]: track_json for _, track_json in tracks
        }

    if entities_to_fetch["TrackRoute"]:
        track_routes: List[Tuple[TrackRoute, dict]] = (
            session.query(
                TrackRoute, literal_column(f"row_to_json({TrackRoute.__tablename__})")
            )
            .filter(
                TrackRoute.track_id.in_(entities_to_fetch["TrackRoute"]),
                TrackRoute.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.TRACK_ROUTE] = {
            track_route.track_id: track_route for track_route, _ in track_routes
        }
        existing_entities_in_json[EntityType.TRACK_ROUTE] = {
            track_route_json["track_id"]: track_route_json
            for _, track_route_json in track_routes
        }

    if entities_to_fetch["PlaylistRoute"]:
        playlist_routes: List[Tuple[PlaylistRoute, dict]] = (
            session.query(
                PlaylistRoute,
                literal_column(f"row_to_json({PlaylistRoute.__tablename__})"),
            )
            .filter(
                PlaylistRoute.playlist_id.in_(entities_to_fetch["PlaylistRoute"]),
                PlaylistRoute.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.PLAYLIST_ROUTE] = {
            playlist_route.playlist_id: playlist_route
            for playlist_route, _ in playlist_routes
        }
        existing_entities_in_json[EntityType.PLAYLIST_ROUTE] = {
            playlist_route_json["playlist_id"]: playlist_route_json
            for _, playlist_route_json in playlist_routes
        }

    # USERS
    if entities_to_fetch["User"]:
        users: List[Tuple[User, dict]] = (
            session.query(User, literal_column(f"row_to_json({User.__tablename__})"))
            .filter(
                User.user_id.in_(entities_to_fetch["User"]),
                User.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.USER] = {user.user_id: user for user, _ in users}
        existing_entities_in_json[EntityType.USER] = {
            user_json["user_id"]: user_json for _, user_json in users
        }

    if entities_to_fetch["UserEvent"]:
        user_events: List[Tuple[UserEvent, dict]] = (
            session.query(
                UserEvent, literal_column(f"row_to_json({UserEvent.__tablename__})")
            )
            .filter(
                UserEvent.user_id.in_(entities_to_fetch["UserEvent"]),
                UserEvent.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.USER_EVENT] = {
            user_event.user_id: user_event for user_event, _ in user_events
        }
        existing_entities_in_json[EntityType.USER_EVENT] = {
            user_event_json["user_id"]: user_event_json
            for _, user_event_json in user_events
        }

    if entities_to_fetch["AssociatedWallet"]:
        associated_wallets: List[Tuple[AssociatedWallet, dict]] = (
            session.query(
                AssociatedWallet,
                literal_column(f"row_to_json({AssociatedWallet.__tablename__})"),
            )
            .filter(
                AssociatedWallet.user_id.in_(entities_to_fetch["AssociatedWallet"]),
                AssociatedWallet.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.ASSOCIATED_WALLET] = {
            wallet.wallet: wallet for wallet, _ in associated_wallets
        }
        existing_entities_in_json[EntityType.ASSOCIATED_WALLET] = {
            (wallet_json["wallet"]): wallet_json
            for _, wallet_json in associated_wallets
        }

    # FOLLOWS
    if entities_to_fetch["Follow"]:
        follow_ops_to_fetch: Set[Tuple] = entities_to_fetch["Follow"]
        and_queries = []
        for follow_to_fetch in follow_ops_to_fetch:
            follower = follow_to_fetch[0]
            # follows does not need entity type in follow_to_fetch[1]
            followee = follow_to_fetch[2]
            and_queries.append(
                and_(
                    Follow.followee_user_id == followee,
                    Follow.follower_user_id == follower,
                    Follow.is_current == True,
                )
            )
        follows: List[Tuple[Follow, dict]] = (
            session.query(
                Follow, literal_column(f"row_to_json({Follow.__tablename__})")
            )
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.FOLLOW] = {
            get_record_key(
                follow.follower_user_id, EntityType.USER, follow.followee_user_id
            ): follow
            for follow, _ in follows
        }
        existing_entities_in_json[EntityType.FOLLOW] = {
            get_record_key(
                follow_json["follower_user_id"],
                EntityType.USER,
                follow_json["followee_user_id"],
            ): follow_json
            for _, follow_json in follows
        }

    # SAVES
    if entities_to_fetch["Save"]:
        saves_to_fetch: Set[Tuple] = entities_to_fetch["Save"]
        and_queries = []
        for save_to_fetch in saves_to_fetch:
            user_id = save_to_fetch[0]
            entity_type = save_to_fetch[1]
            entity_id = save_to_fetch[2]
            and_queries.append(
                and_(
                    Save.user_id == user_id,
                    Save.save_type == entity_type.lower(),
                    Save.save_item_id == entity_id,
                    Save.is_current == True,
                )
            )
        saves: List[Tuple[Save, dict]] = (
            session.query(Save, literal_column(f"row_to_json({Save.__tablename__})"))
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.SAVE] = {
            get_record_key(save.user_id, save.save_type, save.save_item_id): save
            for save, _ in saves
        }
        existing_entities_in_json[EntityType.SAVE] = {
            get_record_key(
                save_json["user_id"], save_json["save_type"], save_json["save_item_id"]
            ): save_json
            for _, save_json in saves
        }

    # REPOSTS
    if entities_to_fetch["Repost"]:
        reposts_to_fetch: Set[Tuple] = entities_to_fetch["Repost"]
        and_queries = []
        for repost_to_fetch in reposts_to_fetch:
            user_id = repost_to_fetch[0]
            entity_type = repost_to_fetch[1]
            entity_id = repost_to_fetch[2]
            and_queries.append(
                and_(
                    Repost.user_id == user_id,
                    Repost.repost_type == entity_type.lower(),
                    Repost.repost_item_id == entity_id,
                    Repost.is_current == True,
                )
            )
        reposts: List[Tuple[Repost, dict]] = (
            session.query(
                Repost, literal_column(f"row_to_json({Repost.__tablename__})")
            )
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.REPOST] = {
            get_record_key(
                repost.user_id, repost.repost_type, repost.repost_item_id
            ): repost
            for repost, _ in reposts
        }
        existing_entities_in_json[EntityType.REPOST] = {
            get_record_key(
                respost_json["user_id"],
                respost_json["repost_type"],
                respost_json["repost_item_id"],
            ): respost_json
            for _, respost_json in reposts
        }

    # SUBSCRIPTIONS
    if entities_to_fetch["Subscription"]:
        subscriptions_to_fetch: Set[Tuple] = entities_to_fetch["Subscription"]
        and_queries = []
        for subscription_to_fetch in subscriptions_to_fetch:
            user_id = subscription_to_fetch[0]
            # subscriptions does not need entity type in subscription_to_fetch[1]
            entity_id = subscription_to_fetch[2]
            and_queries.append(
                and_(
                    Subscription.subscriber_id == user_id,
                    Subscription.user_id == entity_id,
                    Subscription.is_current == True,
                )
            )
        subscriptions: List[Tuple[Subscription, dict]] = (
            session.query(
                Subscription,
                literal_column(f"row_to_json({Subscription.__tablename__})"),
            )
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.SUBSCRIPTION] = {
            get_record_key(
                subscription.subscriber_id, EntityType.USER, subscription.user_id
            ): subscription
            for subscription, _ in subscriptions
        }
        existing_entities_in_json[EntityType.SUBSCRIPTION] = {
            get_record_key(
                sub_json["subscriber_id"], EntityType.USER, sub_json["user_id"]
            ): sub_json
            for _, sub_json in subscriptions
        }

    # PLAYLIST SEEN
    if entities_to_fetch["PlaylistSeen"]:
        playlist_seen_to_fetch: Set[Tuple] = entities_to_fetch["PlaylistSeen"]
        and_queries = []
        for playlist_seen in playlist_seen_to_fetch:
            user_id = playlist_seen[0]
            playlist_id = playlist_seen[1]
            and_queries.append(
                and_(
                    PlaylistSeen.user_id == user_id,
                    PlaylistSeen.playlist_id == playlist_id,
                    PlaylistSeen.is_current == True,
                )
            )

        playlist_seens: List[Tuple[PlaylistSeen, dict]] = (
            session.query(
                PlaylistSeen,
                literal_column(f"row_to_json({PlaylistSeen.__tablename__})"),
            )
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.PLAYLIST_SEEN] = {
            (playlist_seen.user_id, playlist_seen.playlist_id): playlist_seen
            for playlist_seen, _ in playlist_seens
        }
        existing_entities_in_json[EntityType.PLAYLIST_SEEN] = {
            (seen_json["user_id"], seen_json["playlist_id"]): seen_json
            for _, seen_json in playlist_seens
        }

    # GRANTS
    if entities_to_fetch["Grant"]:
        grants_to_fetch: Set[Tuple] = entities_to_fetch["Grant"]
        and_queries = []
        for grant_key in grants_to_fetch:
            grantee_address = grant_key[0]
            grantor_user_id = grant_key[1]
            and_queries.append(
                and_(
                    Grant.user_id == grantor_user_id,
                    func.lower(Grant.grantee_address) == grantee_address,
                    Grant.is_current == True,
                )
            )

        grants: List[Tuple[Grant, dict]] = (
            session.query(Grant, literal_column(f"row_to_json({Grant.__tablename__})"))
            .filter(or_(*and_queries))
            .all()
        )
        existing_entities[EntityType.GRANT] = {
            (grant.grantee_address.lower(), grant.user_id): grant for grant, _ in grants
        }
        existing_entities_in_json[EntityType.GRANT] = {
            (grant_json["grantee_address"].lower(), grant_json["user_id"]): grant_json
            for _, grant_json in grants
        }
        for grant, _ in grants:
            entities_to_fetch["DeveloperApp"].add(grant.grantee_address.lower())
    # USERS BY WALLET
    if entities_to_fetch["UserWallet"]:
        users_by_wallet: List[User] = (
            session.query(User)
            .filter(
                func.lower(User.wallet).in_(entities_to_fetch["UserWallet"]),
                User.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.USER_WALLET] = {
            (cast(str, user.wallet)).lower(): user for user in users_by_wallet
        }
    # APP DEVELOPER APPS
    if entities_to_fetch["DeveloperApp"]:
        developer_apps: List[Tuple[DeveloperApp, dict]] = (
            session.query(
                DeveloperApp,
                literal_column(f"row_to_json({DeveloperApp.__tablename__})"),
            )
            .filter(
                func.lower(DeveloperApp.address).in_(entities_to_fetch["DeveloperApp"]),
                DeveloperApp.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.DEVELOPER_APP] = {
            developer_app.address.lower(): developer_app
            for developer_app, _ in developer_apps
        }
        existing_entities_in_json[EntityType.DEVELOPER_APP] = {
            app_json["address"].lower(): app_json for _, app_json in developer_apps
        }

    # DASHBOARD WALLETS
    if entities_to_fetch["DashboardWalletUser"]:
        dashboard_wallets: List[Tuple[DashboardWalletUser, dict]] = (
            session.query(
                DashboardWalletUser,
                literal_column(f"row_to_json({DashboardWalletUser.__tablename__})"),
            )
            .filter(
                func.lower(DashboardWalletUser.wallet).in_(
                    entities_to_fetch["DashboardWalletUser"]
                )
            )
            .all()
        )
        existing_entities[EntityType.DASHBOARD_WALLET_USER] = {
            dashboard_wallet.wallet.lower(): dashboard_wallet
            for dashboard_wallet, _ in dashboard_wallets
        }
        existing_entities_in_json[EntityType.DASHBOARD_WALLET_USER] = {
            dashboard_wallet_json["wallet"].lower(): dashboard_wallet_json
            for _, dashboard_wallet_json in dashboard_wallets
        }

    return existing_entities, existing_entities_in_json


def get_entity_manager_events_tx(update_task, tx_receipt: TxReceipt):
    return getattr(
        update_task.entity_manager_contract.events, MANAGE_ENTITY_EVENT_TYPE
    )().process_receipt(tx_receipt)


def create_and_raise_indexing_error(err, redis, session):
    logger.error(
        f"Error in the indexing task at"
        f" block={err.blocknumber} and hash={err.txhash}"
    )
    # set indexing error
    set_indexing_error(redis, err.blocknumber, err.blockhash, err.txhash, err.message)

    # seek consensus
    has_consensus = confirm_indexing_transaction_error(
        redis, err.blocknumber, err.blockhash, err.txhash, err.message
    )
    if not has_consensus:
        # escalate error and halt indexing until there's consensus
        error_message = "Indexing halted due to lack of consensus"
        raise Exception(error_message) from err

    # try to insert into skip tx table
    skip_tx_hash = save_and_get_skip_tx_hash(session, redis)

    if not skip_tx_hash:
        error_message = "Reached max transaction skips"
        raise Exception(error_message) from err

    clear_indexing_error(redis)
