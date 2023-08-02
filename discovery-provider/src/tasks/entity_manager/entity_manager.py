import json
import time
from collections import defaultdict
from typing import Any, Dict, List, Set, Tuple
from src.models.indexing.revert_block import RevertBlock
from sqlalchemy import text
from sqlalchemy import literal_column

from sqlalchemy import and_, func, or_
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.exceptions import IndexingValidationError
from src.models.grants.developer_app import DeveloperApp
from src.models.grants.grant import Grant
from src.models.notifications.notification import PlaylistSeen
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.associated_wallet import AssociatedWallet
from src.models.users.user_events import UserEvent
from src.models.users.user import User
from src.queries.confirm_indexing_transaction_error import (
    confirm_indexing_transaction_error,
)
from src.queries.get_skipped_transactions import (
    clear_indexing_error,
    save_and_get_skip_tx_hash,
    set_indexing_error,
)
from src.tasks.entity_manager.entities.developer_app import (
    create_developer_app,
    delete_developer_app,
    get_app_address_from_signature,
)
from src.tasks.entity_manager.entities.grant import create_grant, revoke_grant
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
    ExistingRecordDict,
    ManageEntityParameters,
    RecordDict,
    expect_cid_metadata_json,
    generate_metadata_cid_v1,
    get_metadata_type_and_format,
    get_record_key,
    parse_metadata,
    save_cid_metadata,
)
from src.utils import helpers
from src.utils.indexing_errors import IndexingError
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)

# Please toggle below variable to true for development
ENABLE_DEVELOPMENT_FEATURES = True


def get_record_columns(record) -> List[str]:
    columns = [str(m.key) for m in record.__table__.columns]
    return columns


def entity_manager_update(
    update_task: DatabaseTask,
    session: Session,
    entity_manager_txs: List[Any],
    block_number: int,
    block_timestamp,
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
        hex_blockhash = update_task.web3.toHex(block_hash)

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

        new_records: RecordDict = defaultdict(lambda: defaultdict(list))

        pending_track_routes: List[TrackRoute] = []
        pending_playlist_routes: List[PlaylistRoute] = []

        # cid -> metadata type
        cid_type: Dict[str, str] = {}
        # cid -> metadata
        cid_metadata: Dict[str, Dict] = {}

        revert_blocks: List[RevertBlock] = []
        # process in tx order and populate records_to_save
        for tx_receipt in entity_manager_txs:
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
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
                        revert_blocks,
                        pending_track_routes,
                        pending_playlist_routes,
                        update_task.eth_manager,
                        update_task.web3,
                        block_timestamp,
                        block_number,
                        hex_blockhash,
                        txhash,
                        logger,
                    )

                    # update logger context with this tx event
                    logger.update_context(event["args"])

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

                    logger.info("process transaction")  # log event context
                except IndexingValidationError as e:
                    # swallow exception to keep indexing
                    logger.error(f"failed to process transaction error {e}")
                except Exception as e:
                    indexing_error = IndexingError(
                        "tx-failure",
                        block_number,
                        hex_blockhash,
                        txhash,
                        str(e),
                    )
                    create_and_raise_indexing_error(
                        indexing_error, update_task.redis, session
                    )
                    logger.error(f"skipping transaction hash {indexing_error}")

        # compile records_to_save
        records_to_save = get_records_to_save(
            params, new_records, original_records, existing_records_in_json
        )

        # insert/update all tracks, playlist records in this block
        session.add_all(records_to_save)
        num_total_changes += len(new_records)
        # update metrics
        metric_latency.save_time(
            {"scope": "entity_manager_update"},
            start_time=update_start_time,
        )
        metric_num_changed.save(
            len(new_records["playlists"]), {"entity_type": EntityType.PLAYLIST.value}
        )
        metric_num_changed.save(
            len(new_records["tracks"]), {"entity_type": EntityType.TRACK.value}
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


def get_records_to_save(
    params, new_records, original_records, existing_records_in_json
):
    records_to_save = []
    for record_type, record_dict in new_records.items():
        for entity_id, records in record_dict.items():
            if not records:
                continue
            # invalidate all new records except the last
            for record in records:
                if "is_current" in get_record_columns(record):
                    record.is_current = False

                if "updated_at" in get_record_columns(record):
                    record.updated_at = params.block_datetime
            if "is_current" in get_record_columns(records[-1]):
                records[-1].is_current = True
            records_to_save.extend(records)
            # invalidate original record if it already existed in the DB
            # also add revert_blocks
            if (
                record_type in original_records
                and entity_id in original_records[record_type]
                and "is_current"
                in get_record_columns(original_records[record_type][entity_id])
            ):
                original_records[record_type][entity_id].is_current = False

    prev_records: Dict[EntityType, List[Dict]] = defaultdict(list)
    for record_type, existing_records in existing_records_in_json.items():
        if existing_records:
            prev_records[record_type] = existing_records
    revert_block = RevertBlock(
        blocknumber=params.block_number, prev_records=prev_records
    )
    records_to_save.append(revert_block)

    # add EM logs to save
    records_to_save.extend(params.revert_blocks)
    return records_to_save


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
                entities_to_fetch[EntityType.USER_EVENT].add(entity_id)
                entities_to_fetch[EntityType.ASSOCIATED_WALLET].add(entity_id)
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
                            get_app_address_from_signature(
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
                else:
                    logger.error(
                        "tasks | entity_manager.py | Missing grantee address in metadata required for add grant tx"
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
                # to prevent playlists from including premium tracks
                tracks = json_metadata.get("playlist_contents", {}).get("track_ids", [])
                for track in tracks:
                    entities_to_fetch[EntityType.TRACK].add(track["track"])

                if entity_type == EntityType.TRACK:
                    user_id = json_metadata.get("ai_attribution_user_id")
                    if user_id:
                        entities_to_fetch[EntityType.USER].add(user_id)

    return entities_to_fetch


def fetch_records_in_json(
    session: Session, existing_records, existing_entities, table, identifier
):
    json_records = {}
    for record in existing_records:
        existing_entities[EntityType.USER] = {getattr(record, identifier): record}
        sql = text(
            f"SELECT row_to_json({table}) FROM {table} WHERE {identifier} = {getattr(record, identifier)} and is_current"
        )
        result = session.execute(sql).fetchone()
        json_records[getattr(record, identifier)] = result[0]
    return json_records


def fetch_existing_entities(session: Session, entities_to_fetch: EntitiesToFetchDict):
    existing_entities: ExistingRecordDict = defaultdict(dict)
    existing_entities_in_json: Dict[EntityType, List[dict]] = defaultdict(list)

    # PLAYLISTS
    if entities_to_fetch[EntityType.PLAYLIST]:
        playlists: List[Playlist] = (
            session.query(Playlist)
            .filter(
                Playlist.playlist_id.in_(entities_to_fetch[EntityType.PLAYLIST]),
                Playlist.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.PLAYLIST] = {
            playlist.playlist_id: playlist for playlist in playlists
        }

    # TRACKS
    if entities_to_fetch[EntityType.TRACK]:
        tracks: List[Track] = (
            session.query(Track, literal_column(f"row_to_json({Track.__tablename__})"))
            .filter(
                Track.track_id.in_(entities_to_fetch[EntityType.TRACK]),
                Track.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.TRACK] = {track.track_id: track for track, _ in tracks}
        existing_entities_in_json[EntityType.TRACK] = [track_json for _, track_json in tracks]

    # USERS
    if entities_to_fetch[EntityType.USER]:
        users: List[User] = (
            session.query(User, literal_column(f"row_to_json({User.__tablename__})"))
            .filter(
                User.user_id.in_(entities_to_fetch[EntityType.USER]),
                User.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.USER] = {user.user_id: user for user, _ in users}
        existing_entities_in_json[EntityType.USER]= [user_json for _, user_json in users]

    # FOLLOWS
    if entities_to_fetch[EntityType.FOLLOW]:
        follow_ops_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.FOLLOW]
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
        follows: List[Follow] = session.query(Follow, literal_column(f"row_to_json({Follow.__tablename__})")).filter(or_(*and_queries)).all()
        existing_entities[EntityType.FOLLOW] = {
            get_record_key(
                follow.follower_user_id, EntityType.USER, follow.followee_user_id
            ): follow
            for follow, _ in follows
        }
        existing_entities_in_json[EntityType.FOLLOW] = [follow_json for _, follow_json in follows]

    # SAVES
    if entities_to_fetch[EntityType.SAVE]:
        saves_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.SAVE]
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
        saves: List[Save] = session.query(Save, literal_column(f"row_to_json({Save.__tablename__})")).filter(or_(*and_queries)).all()
        existing_entities[EntityType.SAVE] = {
            get_record_key(save.user_id, save.save_type, save.save_item_id): save
            for save, _ in saves
        }
        existing_entities_in_json[EntityType.SAVE] = [save_json for _, save_json in saves]

    # REPOSTS
    if entities_to_fetch[EntityType.REPOST]:
        reposts_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.REPOST]
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
        reposts: List[Repost] = session.query(Repost, literal_column(f"row_to_json({Repost.__tablename__})")).filter(or_(*and_queries)).all()
        existing_entities[EntityType.REPOST] = {
            get_record_key(
                repost.user_id, repost.repost_type, repost.repost_item_id
            ): repost
            for repost, _ in reposts
        }
        existing_entities_in_json[EntityType.REPOST] = [repost_json for _, repost_json in reposts]

    # SUBSCRIPTIONS
    if entities_to_fetch[EntityType.SUBSCRIPTION]:
        subscriptions_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.SUBSCRIPTION]
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
        subscriptions: List[Subscription] = (
            session.query(Subscription, literal_column(f"row_to_json({Subscription.__tablename__})")).filter(or_(*and_queries)).all()
        )
        existing_entities[EntityType.SUBSCRIPTION] = {
            get_record_key(
                subscription.subscriber_id, EntityType.USER, subscription.user_id
            ): subscription
            for subscription, _ in subscriptions
        }
        existing_entities_in_json[EntityType.SUBSCRIPTION] = [sub_json for _, sub_json in subscriptions]

    # PLAYLIST SEEN
    if entities_to_fetch[EntityType.PLAYLIST_SEEN]:
        playlist_seen_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.PLAYLIST_SEEN]
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

        playlist_seens: List[PlaylistSeen] = (
            session.query(PlaylistSeen, literal_column(f"row_to_json({PlaylistSeen.__tablename__})")).filter(or_(*and_queries)).all()
        )
        existing_entities[EntityType.PLAYLIST_SEEN] = {
            (playlist_seen.user_id, playlist_seen.playlist_id): playlist_seen
            for playlist_seen, _ in playlist_seens
        }
        existing_entities_in_json[EntityType.PLAYLIST_SEEN] = [seen_json for _, seen_json in playlist_seens]

    # GRANTS
    if entities_to_fetch[EntityType.GRANT]:
        grants_to_fetch: Set[Tuple] = entities_to_fetch[EntityType.GRANT]
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

        grants: List[Tuple[Grant, Dict]] = session.query(Grant, literal_column(f"row_to_json({Grant.__tablename__})")).filter(or_(*and_queries)).all()
        for grant, grant_json in grants:
        existing_entities[EntityType.GRANT] = {
            (grant.grantee_address.lower(), grant.user_id): grant for grant, _ in grants
        }
        existing_entities_in_json[EntityType.GRANT] = [grant_json for _, grant_json in grants]
        for grant, _ in grants:
            entities_to_fetch[EntityType.DEVELOPER_APP].add(
                grant.grantee_address.lower()
            )

    # APP DEVELOPER APPS
    if entities_to_fetch[EntityType.DEVELOPER_APP]:
        developer_apps: List[DeveloperApp] = (
            session.query(DeveloperApp, literal_column(f"row_to_json({DeveloperApp.__tablename__})"))
            .filter(
                func.lower(DeveloperApp.address).in_(
                    entities_to_fetch[EntityType.DEVELOPER_APP]
                ),
                DeveloperApp.is_current == True,
            )
            .all()
        )
        existing_entities[EntityType.DEVELOPER_APP] = {
            developer_app.address.lower(): developer_app
            for developer_app, _ in developer_apps
        }
        existing_entities_in_json[EntityType.DEVELOPER_APP] = [app_json for _, app_json in developer_apps]

    return existing_entities, existing_entities_in_json


def get_entity_manager_events_tx(update_task, tx_receipt):
    return getattr(
        update_task.entity_manager_contract.events, MANAGE_ENTITY_EVENT_TYPE
    )().processReceipt(tx_receipt)


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
