# pylint: disable=C0302
import asyncio
import concurrent.futures
import logging
import time
from datetime import datetime
from operator import itemgetter, or_
from typing import Any, Dict, Set, Tuple

from src.app import get_contract_addresses
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.trending_challenge import should_trending_challenge_update
from src.models.indexing.block import Block
from src.models.indexing.ursm_content_node import URSMContentNode
from src.models.playlists.playlist import Playlist
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.associated_wallet import AssociatedWallet
from src.models.users.user import User
from src.models.users.user_events import UserEvents
from src.queries.confirm_indexing_transaction_error import (
    confirm_indexing_transaction_error,
)
from src.queries.get_skipped_transactions import (
    clear_indexing_error,
    get_indexing_error,
    set_indexing_error,
)
from src.queries.skipped_transactions import add_network_level_skipped_transaction
from src.tasks.celery_app import celery
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.tasks.playlists import playlist_state_update
from src.tasks.social_features import social_feature_state_update
from src.tasks.sort_block_transactions import sort_block_transactions
from src.tasks.tracks import track_event_types_lookup, track_state_update
from src.tasks.user_library import user_library_state_update
from src.tasks.user_replica_set import user_replica_set_state_update
from src.tasks.users import user_event_types_lookup, user_state_update
from src.utils import helpers, multihash
from src.utils.constants import CONTRACT_NAMES_ON_CHAIN, CONTRACT_TYPES
from src.utils.index_blocks_performance import (
    record_add_indexed_block_to_db_ms,
    record_fetch_ipfs_metadata_ms,
    record_index_blocks_ms,
    sweep_old_add_indexed_block_to_db_ms,
    sweep_old_fetch_ipfs_metadata_ms,
    sweep_old_index_blocks_ms,
)
from src.utils.indexing_errors import IndexingError
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    PrometheusRegistry,
    save_duration_metric,
)
from src.utils.redis_cache import (
    remove_cached_playlist_ids,
    remove_cached_track_ids,
    remove_cached_user_ids,
)
from src.utils.redis_constants import (
    latest_block_hash_redis_key,
    latest_block_redis_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
)
from src.utils.session_manager import SessionManager

USER_FACTORY = CONTRACT_TYPES.USER_FACTORY.value
TRACK_FACTORY = CONTRACT_TYPES.TRACK_FACTORY.value
SOCIAL_FEATURE_FACTORY = CONTRACT_TYPES.SOCIAL_FEATURE_FACTORY.value
PLAYLIST_FACTORY = CONTRACT_TYPES.PLAYLIST_FACTORY.value
USER_LIBRARY_FACTORY = CONTRACT_TYPES.USER_LIBRARY_FACTORY.value
USER_REPLICA_SET_MANAGER = CONTRACT_TYPES.USER_REPLICA_SET_MANAGER.value

USER_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[CONTRACT_TYPES.USER_FACTORY]
TRACK_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[CONTRACT_TYPES.TRACK_FACTORY]
SOCIAL_FEATURE_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.SOCIAL_FEATURE_FACTORY
]
PLAYLIST_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.PLAYLIST_FACTORY
]
USER_LIBRARY_FACTORY_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.USER_LIBRARY_FACTORY
]
USER_REPLICA_SET_MANAGER_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[
    CONTRACT_TYPES.USER_REPLICA_SET_MANAGER
]

TX_TYPE_TO_HANDLER_MAP = {
    USER_FACTORY: user_state_update,
    TRACK_FACTORY: track_state_update,
    SOCIAL_FEATURE_FACTORY: social_feature_state_update,
    PLAYLIST_FACTORY: playlist_state_update,
    USER_LIBRARY_FACTORY: user_library_state_update,
    USER_REPLICA_SET_MANAGER: user_replica_set_state_update,
}

BLOCKS_PER_DAY = (24 * 60 * 60) / 5

logger = logging.getLogger(__name__)


# HELPER FUNCTIONS

default_padded_start_hash = (
    "0x0000000000000000000000000000000000000000000000000000000000000000"
)
default_config_start_hash = "0x0"

# Used to update user_replica_set_manager address and skip txs conditionally
zero_address = "0x0000000000000000000000000000000000000000"


def get_contract_info_if_exists(self, address):
    for contract_name, contract_address in get_contract_addresses().items():
        if update_task.web3.toChecksumAddress(contract_address) == address:
            return (contract_name, contract_address)
    return None


def initialize_blocks_table_if_necessary(db: SessionManager):
    redis = update_task.redis

    target_blockhash = None
    target_blockhash = update_task.shared_config["discprov"]["start_block"]
    target_block = update_task.web3.eth.get_block(target_blockhash, True)

    with db.scoped_session() as session:
        current_block_query_result = session.query(Block).filter_by(is_current=True)
        if current_block_query_result.count() == 0:
            blocks_query_result = session.query(Block)
            assert (
                blocks_query_result.count() == 0
            ), "Corrupted DB State - Expect single row marked as current"
            block_model = Block(
                blockhash=target_blockhash,
                number=target_block.number,
                parenthash=target_blockhash,
                is_current=True,
            )
            if (
                target_block.number == 0
                or target_blockhash == default_config_start_hash
            ):
                block_model.number = None

            session.add(block_model)
            logger.info(
                f"index.py | initialize_blocks_table_if_necessary | Initializing blocks table - {block_model}"
            )
        else:
            assert (
                current_block_query_result.count() == 1
            ), "Expected SINGLE row marked as current"

            # set the last indexed block in redis
            current_block_result = current_block_query_result.first()
            if current_block_result.number:
                redis.set(
                    most_recent_indexed_block_redis_key, current_block_result.number
                )
            if current_block_result.blockhash:
                redis.set(
                    most_recent_indexed_block_hash_redis_key,
                    current_block_result.blockhash,
                )

    return target_blockhash


def get_latest_block(db: SessionManager):
    latest_block = None
    block_processing_window = int(
        update_task.shared_config["discprov"]["block_processing_window"]
    )
    with db.scoped_session() as session:
        current_block_query = session.query(Block).filter_by(is_current=True)
        assert current_block_query.count() == 1, "Expected SINGLE row marked as current"

        current_block_query_results = current_block_query.all()
        current_block = current_block_query_results[0]
        current_block_number = current_block.number

        if current_block_number == None:
            current_block_number = 0

        target_latest_block_number = current_block_number + block_processing_window

        latest_block_from_chain = update_task.web3.eth.get_block("latest", True)
        latest_block_number_from_chain = latest_block_from_chain.number

        target_latest_block_number = min(
            target_latest_block_number, latest_block_number_from_chain
        )

        logger.info(
            f"index.py | get_latest_block | current={current_block_number} target={target_latest_block_number}"
        )
        latest_block = update_task.web3.eth.get_block(target_latest_block_number, True)
    return latest_block


def update_latest_block_redis():
    latest_block_from_chain = update_task.web3.eth.get_block("latest", True)
    default_indexing_interval_seconds = int(
        update_task.shared_config["discprov"]["block_processing_interval_sec"]
    )
    redis = update_task.redis
    # these keys have a TTL which is the indexing interval
    redis.set(
        latest_block_redis_key,
        latest_block_from_chain.number,
        ex=default_indexing_interval_seconds,
    )
    redis.set(
        latest_block_hash_redis_key,
        latest_block_from_chain.hash.hex(),
        ex=default_indexing_interval_seconds,
    )


def fetch_tx_receipt(transaction):
    web3 = update_task.web3
    tx_hash = web3.toHex(transaction["hash"])
    receipt = web3.eth.get_transaction_receipt(tx_hash)
    response = {}
    response["tx_receipt"] = receipt
    response["tx_hash"] = tx_hash
    return response


def fetch_tx_receipts(self, block):
    block_hash = self.web3.toHex(block.hash)
    block_number = block.number
    block_transactions = block.transactions
    block_tx_with_receipts = {}
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_tx_receipt = {
            executor.submit(fetch_tx_receipt, tx): tx for tx in block_transactions
        }
        for future in concurrent.futures.as_completed(future_to_tx_receipt):
            tx = future_to_tx_receipt[future]
            try:
                tx_receipt_info = future.result()
                tx_hash = tx_receipt_info["tx_hash"]
                block_tx_with_receipts[tx_hash] = tx_receipt_info["tx_receipt"]
            except Exception as exc:
                logger.error(f"index.py | fetch_tx_receipts {tx} generated {exc}")
    num_processed_txs = len(block_tx_with_receipts.keys())
    num_submitted_txs = len(block_transactions)
    if num_processed_txs != num_submitted_txs:
        raise IndexingError(
            type="tx",
            blocknumber=block_number,
            blockhash=block_hash,
            txhash=None,
            message=f"index.py | fetch_tx_receipts Expected ${num_submitted_txs} received {num_processed_txs}",
        )
    return block_tx_with_receipts


def fetch_cid_metadata(
    db,
    user_factory_txs,
    track_factory_txs,
):
    start_time = datetime.now()
    user_contract = update_task.user_contract
    track_contract = update_task.track_contract

    blacklisted_cids: Set[str] = set()
    cids_txhash_set: Tuple[str, Any] = set()
    cid_type: Dict[str, str] = {}  # cid -> entity type track / user

    # cid -> user_id lookup to make fetching replica set more efficient
    cid_to_user_id: Dict[str, int] = {}
    cid_metadata: Dict[str, Dict] = {}  # cid -> metadata

    # fetch transactions
    with db.scoped_session() as session:
        for tx_receipt in user_factory_txs:
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            user_events_tx = getattr(
                user_contract.events, user_event_types_lookup["update_multihash"]
            )().processReceipt(tx_receipt)
            for entry in user_events_tx:
                event_args = entry["args"]
                cid = helpers.multihash_digest_to_cid(event_args._multihashDigest)
                if not is_blacklisted_ipld(session, cid):
                    cids_txhash_set.add((cid, txhash))
                    cid_type[cid] = "user"
                else:
                    blacklisted_cids.add(cid)
                user_id = event_args._userId
                cid_to_user_id[cid] = user_id

        for tx_receipt in track_factory_txs:
            txhash = update_task.web3.toHex(tx_receipt.transactionHash)
            for event_type in [
                track_event_types_lookup["new_track"],
                track_event_types_lookup["update_track"],
            ]:
                track_events_tx = getattr(
                    track_contract.events, event_type
                )().processReceipt(tx_receipt)
                for entry in track_events_tx:
                    event_args = entry["args"]
                    track_metadata_digest = event_args._multihashDigest.hex()
                    track_metadata_hash_fn = event_args._multihashHashFn
                    track_owner_id = event_args._trackOwnerId
                    buf = multihash.encode(
                        bytes.fromhex(track_metadata_digest), track_metadata_hash_fn
                    )
                    cid = multihash.to_b58_string(buf)
                    if not is_blacklisted_ipld(session, cid):
                        cids_txhash_set.add((cid, txhash))
                        cid_type[cid] = "track"
                    else:
                        blacklisted_cids.add(cid)
                    cid_to_user_id[cid] = track_owner_id

        # user -> replica set string lookup, used to make user and track cid get_metadata fetches faster
        user_to_replica_set = dict(
            session.query(User.user_id, User.creator_node_endpoint)
            .filter(
                User.is_current == True,
                User.user_id.in_(cid_to_user_id.values()),
            )
            .group_by(User.user_id, User.creator_node_endpoint)
            .all()
        )

    # first attempt - fetch all CIDs from replica set
    try:
        cid_metadata.update(
            update_task.cid_metadata_client.fetch_metadata_from_gateway_endpoints(
                cid_metadata.keys(),
                cids_txhash_set,
                cid_to_user_id,
                user_to_replica_set,
                cid_type,
                should_fetch_from_replica_set=True,
            )
        )
    except asyncio.TimeoutError:
        # swallow exception on first attempt fetching from replica set
        pass

    # second attempt - fetch missing CIDs from other cnodes
    if len(cid_metadata) != len(cids_txhash_set):
        cid_metadata.update(
            update_task.cid_metadata_client.fetch_metadata_from_gateway_endpoints(
                cid_metadata.keys(),
                cids_txhash_set,
                cid_to_user_id,
                user_to_replica_set,
                cid_type,
                should_fetch_from_replica_set=False,
            )
        )

    if cid_type and len(cid_metadata) != len(cid_type.keys()):
        missing_cids_msg = f"Did not fetch all CIDs - missing {[set(cid_type.keys()) - set(cid_metadata.keys())]} CIDs"
        raise Exception(missing_cids_msg)

    logger.info(
        f"index.py | finished fetching {len(cid_metadata)} CIDs in {datetime.now() - start_time} seconds"
    )
    return cid_metadata, blacklisted_cids


# During each indexing iteration, check if the address for UserReplicaSetManager
# has been set in the L2 contract registry - if so, update the global contract_addresses object
# This change is to ensure no indexing restart is necessary when UserReplicaSetManager is
# added to the registry.
def update_ursm_address(self):
    web3 = update_task.web3
    shared_config = update_task.shared_config
    abi_values = update_task.abi_values
    user_replica_set_manager_address = get_contract_addresses()[
        USER_REPLICA_SET_MANAGER
    ]
    if user_replica_set_manager_address == zero_address:
        logger.info(
            f"index.py | update_ursm_address, found {user_replica_set_manager_address}"
        )
        registry_address = web3.toChecksumAddress(
            shared_config["contracts"]["registry"]
        )
        registry_instance = web3.eth.contract(
            address=registry_address, abi=abi_values["Registry"]["abi"]
        )
        user_replica_set_manager_address = registry_instance.functions.getContract(
            bytes(USER_REPLICA_SET_MANAGER_CONTRACT_NAME, "utf-8")
        ).call()
        if user_replica_set_manager_address != zero_address:
            get_contract_addresses()[USER_REPLICA_SET_MANAGER] = web3.toChecksumAddress(
                user_replica_set_manager_address
            )
            logger.info(
                f"index.py | Updated user_replica_set_manager_address={user_replica_set_manager_address}"
            )


def get_tx_hash_to_skip(session, redis):
    """Fetch if there is a tx_hash to be skipped because of continuous errors"""
    indexing_error = get_indexing_error(redis)
    if (
        isinstance(indexing_error, dict)
        and "has_consensus" in indexing_error
        and indexing_error["has_consensus"]
    ):
        return indexing_error["txhash"]
    else:
        return None


def save_skipped_tx(session, redis):
    indexing_error = get_indexing_error(redis)
    try:
        add_network_level_skipped_transaction(
            session,
            indexing_error["blocknumber"],
            indexing_error["blockhash"],
            indexing_error["txhash"],
        )
    except Exception:
        logger.warning(
            f"index.py | save_skipped_tx: Failed to add_network_level_skipped_transaction for {indexing_error}"
        )


def get_contract_type_for_tx(tx_type_to_grouped_lists_map, tx, tx_receipt):
    tx_target_contract_address = tx["to"]
    contract_type = None
    for tx_type in tx_type_to_grouped_lists_map.keys():
        tx_is_type = tx_target_contract_address == get_contract_addresses()[tx_type]
        if tx_is_type:
            contract_type = tx_type
            logger.info(
                f"index.py | {tx_type} contract addr: {tx_target_contract_address}"
                f" tx from block - {tx}, receipt - {tx_receipt}"
            )
            break
    return contract_type


def add_indexed_block_to_db(db_session, block):
    web3 = update_task.web3
    current_block_query = db_session.query(Block).filter_by(is_current=True)

    block_model = Block(
        blockhash=web3.toHex(block.hash),
        parenthash=web3.toHex(block.parentHash),
        number=block.number,
        is_current=True,
    )

    # Update blocks table after
    assert current_block_query.count() == 1, "Expected single row marked as current"

    previous_block = current_block_query.first()
    previous_block.is_current = False
    db_session.add(block_model)


def add_indexed_block_to_redis(block, redis):
    redis.set(most_recent_indexed_block_redis_key, block.number)
    redis.set(most_recent_indexed_block_hash_redis_key, block.hash.hex())


def process_state_changes(
    main_indexing_task,
    session,
    cid_metadata,
    blacklisted_cids,
    tx_type_to_grouped_lists_map,
    block,
):
    block_number, block_hash, block_timestamp = itemgetter(
        "number", "hash", "timestamp"
    )(block)

    changed_entity_ids_map = {
        USER_FACTORY: [],
        TRACK_FACTORY: [],
        PLAYLIST_FACTORY: [],
        USER_REPLICA_SET_MANAGER: [],
    }

    for tx_type, bulk_processor in TX_TYPE_TO_HANDLER_MAP.items():

        txs_to_process = tx_type_to_grouped_lists_map[tx_type]
        tx_processing_args = [
            main_indexing_task,
            update_task,
            session,
            txs_to_process,
            block_number,
            block_timestamp,
            block_hash,
            cid_metadata,
            blacklisted_cids,
        ]

        (
            total_changes_for_tx_type,
            changed_entity_ids,
        ) = bulk_processor(*tx_processing_args)

        if tx_type in changed_entity_ids_map.keys():
            changed_entity_ids_map[tx_type] = changed_entity_ids

        logger.info(
            f"index.py | {bulk_processor.__name__} completed"
            f" {tx_type}_state_changed={total_changes_for_tx_type > 0} for block={block_number}"
        )

    return changed_entity_ids_map


def remove_updated_entities_from_cache(redis, changed_entity_type_to_updated_ids_map):
    CONTRACT_TYPE_TO_CLEAR_CACHE_HANDLERS = {
        USER_FACTORY: remove_cached_user_ids,
        USER_REPLICA_SET_MANAGER: remove_cached_user_ids,
        TRACK_FACTORY: remove_cached_track_ids,
        PLAYLIST_FACTORY: remove_cached_playlist_ids,
    }
    for (
        contract_type,
        clear_cache_handler,
    ) in CONTRACT_TYPE_TO_CLEAR_CACHE_HANDLERS.items():
        changed_entity_ids = changed_entity_type_to_updated_ids_map[contract_type]
        if changed_entity_ids:
            clear_cache_handler(redis, changed_entity_ids)


def create_and_raise_indexing_error(err, redis):
    logger.info(
        f"index.py | Error in the indexing task at"
        f" block={err.blocknumber} and hash={err.txhash}"
    )
    set_indexing_error(redis, err.blocknumber, err.blockhash, err.txhash, err.message)
    confirm_indexing_transaction_error(
        redis, err.blocknumber, err.blockhash, err.txhash, err.message
    )
    raise err


def index_blocks(self, db, blocks_list):
    web3 = update_task.web3
    redis = update_task.redis
    shared_config = update_task.shared_config

    indexing_transaction_index_sort_order_start_block = (
        shared_config["discprov"]["indexing_transaction_index_sort_order_start_block"]
        or 0
    )

    num_blocks = len(blocks_list)
    block_order_range = range(len(blocks_list) - 1, -1, -1)
    latest_block_timestamp = None
    changed_entity_ids_map = {}
    metric = PrometheusMetric(
        PrometheusRegistry[PrometheusMetricNames.INDEX_BLOCKS_DURATION_SECONDS]
    )
    for i in block_order_range:
        start_time = time.time()
        metric.reset_timer()
        update_ursm_address(self)
        block = blocks_list[i]
        block_index = num_blocks - i
        block_number, block_hash, latest_block_timestamp = itemgetter(
            "number", "hash", "timestamp"
        )(block)
        logger.info(
            f"index.py | index_blocks | {self.request.id} | block {block.number} - {block_index}/{num_blocks}"
        )
        challenge_bus: ChallengeEventBus = update_task.challenge_event_bus

        with db.scoped_session() as session, challenge_bus.use_scoped_dispatch_queue():
            skip_tx_hash = get_tx_hash_to_skip(session, redis)
            skip_whole_block = skip_tx_hash == "commit"  # db tx failed at commit level
            if skip_whole_block:
                logger.info(
                    f"index.py | Skipping all txs in block {block.hash} {block.number}"
                )
                save_skipped_tx(session, redis)
                add_indexed_block_to_db(session, block)
            else:
                txs_grouped_by_type = {
                    USER_FACTORY: [],
                    TRACK_FACTORY: [],
                    SOCIAL_FEATURE_FACTORY: [],
                    PLAYLIST_FACTORY: [],
                    USER_LIBRARY_FACTORY: [],
                    USER_REPLICA_SET_MANAGER: [],
                }
                try:
                    """
                    Fetch transaction receipts
                    """
                    fetch_tx_receipts_start_time = time.time()
                    tx_receipt_dict = fetch_tx_receipts(self, block)
                    metric.save_time(
                        {"scope": "fetch_tx_receipts"},
                        start_time=fetch_tx_receipts_start_time,
                    )
                    logger.info(
                        f"index.py | index_blocks - fetch_tx_receipts in {time.time() - fetch_tx_receipts_start_time}s"
                    )

                    """
                    Parse transaction receipts
                    """
                    parse_tx_receipts_start_time = time.time()

                    sorted_txs = sort_block_transactions(
                        block, indexing_transaction_index_sort_order_start_block
                    )

                    # Parse tx events in each block
                    for tx in sorted_txs:
                        tx_hash = web3.toHex(tx["hash"])
                        tx_target_contract_address = (
                            tx["to"] if tx["to"] else zero_address
                        )
                        tx_receipt = tx_receipt_dict[tx_hash]
                        should_skip_tx = (
                            tx_target_contract_address == zero_address
                        ) or (skip_tx_hash is not None and skip_tx_hash == tx_hash)

                        if should_skip_tx:
                            logger.info(
                                f"index.py | Skipping tx {tx_hash} targeting {tx_target_contract_address}"
                            )
                            save_skipped_tx(session, redis)
                            continue
                        else:
                            contract_type = get_contract_type_for_tx(
                                txs_grouped_by_type, tx, tx_receipt
                            )
                            if contract_type:
                                txs_grouped_by_type[contract_type].append(tx_receipt)
                    metric.save_time(
                        {"scope": "parse_tx_receipts"},
                        start_time=parse_tx_receipts_start_time,
                    )
                    logger.info(
                        f"index.py | index_blocks - parse_tx_receipts in {time.time() - parse_tx_receipts_start_time}s"
                    )

                    """
                    Fetch JSON metadata
                    """
                    fetch_ipfs_metadata_start_time = time.time()
                    # pre-fetch cids asynchronously to not have it block in user_state_update
                    # and track_state_update
                    cid_metadata, blacklisted_cids = fetch_cid_metadata(
                        db,
                        txs_grouped_by_type[USER_FACTORY],
                        txs_grouped_by_type[TRACK_FACTORY],
                    )
                    logger.info(
                        f"index.py | index_blocks - fetch_ipfs_metadata in {time.time() - fetch_ipfs_metadata_start_time}s"
                    )
                    # Record the time this took in redis
                    duration_ms = round(
                        (time.time() - fetch_ipfs_metadata_start_time) * 1000
                    )
                    record_fetch_ipfs_metadata_ms(redis, duration_ms)
                    metric.save_time(
                        {"scope": "fetch_ipfs_metadata"},
                        start_time=fetch_ipfs_metadata_start_time,
                    )
                    logger.info(
                        f"index.py | index_blocks - fetch_ipfs_metadata in {duration_ms}ms"
                    )

                    """
                    Add block to db
                    """
                    add_indexed_block_to_db_start_time = time.time()
                    add_indexed_block_to_db(session, block)
                    # Record the time this took in redis
                    duration_ms = round(
                        (time.time() - add_indexed_block_to_db_start_time) * 1000
                    )
                    record_add_indexed_block_to_db_ms(redis, duration_ms)
                    metric.save_time(
                        {"scope": "add_indexed_block_to_db"},
                        start_time=add_indexed_block_to_db_start_time,
                    )
                    logger.info(
                        f"index.py | index_blocks - add_indexed_block_to_db in {duration_ms}ms"
                    )

                    """
                    Add state changes in block to db (users, tracks, etc.)
                    """
                    process_state_changes_start_time = time.time()
                    # bulk process operations once all tx's for block have been parsed
                    # and get changed entity IDs for cache clearing
                    # after session commit
                    changed_entity_ids_map = process_state_changes(
                        self,
                        session,
                        cid_metadata,
                        blacklisted_cids,
                        txs_grouped_by_type,
                        block,
                    )
                    metric.save_time(
                        {"scope": "process_state_changes"},
                        start_time=process_state_changes_start_time,
                    )
                    logger.info(
                        f"index.py | index_blocks - process_state_changes in {time.time() - process_state_changes_start_time}s"
                    )

                except Exception as e:

                    blockhash = update_task.web3.toHex(block_hash)
                    indexing_error = IndexingError(
                        "prefetch-cids", block_number, blockhash, None, str(e)
                    )
                    create_and_raise_indexing_error(indexing_error, redis)

            try:
                commit_start_time = time.time()
                session.commit()
                metric.save_time({"scope": "commit_time"}, start_time=commit_start_time)
                logger.info(
                    f"index.py | session committed to db for block={block_number} in {time.time() - commit_start_time}s"
                )
            except Exception as e:
                # Use 'commit' as the tx hash here.
                # We're at a point where the whole block can't be added to the database, so
                # we should skip it in favor of making progress
                blockhash = update_task.web3.toHex(block_hash)
                indexing_error = IndexingError(
                    "session.commit", block_number, blockhash, "commit", str(e)
                )
                create_and_raise_indexing_error(indexing_error, redis)
            try:
                # Check the last block's timestamp for updating the trending challenge
                [should_update, date] = should_trending_challenge_update(
                    session, latest_block_timestamp
                )
                if should_update:
                    celery.send_task(
                        "calculate_trending_challenges", kwargs={"date": date}
                    )
            except Exception as e:
                # Do not throw error, as this should not stop indexing
                logger.error(
                    f"index.py | Error in calling update trending challenge {e}",
                    exc_info=True,
                )
            if skip_tx_hash:
                clear_indexing_error(redis)

        if changed_entity_ids_map:
            remove_updated_entities_from_cache(redis, changed_entity_ids_map)

        logger.info(
            f"index.py | redis cache clean operations complete for block=${block_number}"
        )

        add_indexed_block_to_redis(block, redis)
        logger.info(
            f"index.py | update most recently processed block complete for block=${block_number}"
        )

        # Record the time this took in redis
        metric.save_time({"scope": "full"})
        duration_ms = round(time.time() - start_time * 1000)
        record_index_blocks_ms(redis, duration_ms)

        # Sweep records older than 30 days every day
        if block_number % BLOCKS_PER_DAY == 0:
            sweep_old_index_blocks_ms(redis, 30)
            sweep_old_fetch_ipfs_metadata_ms(redis, 30)
            sweep_old_add_indexed_block_to_db_ms(redis, 30)

    if num_blocks > 0:
        logger.info(f"index.py | index_blocks | Indexed {num_blocks} blocks")


# transactions are reverted in reverse dependency order (social features --> playlists --> tracks --> users)
def revert_blocks(self, db, revert_blocks_list):
    # TODO: Remove this exception once the unexpected revert scenario has been diagnosed
    num_revert_blocks = len(revert_blocks_list)
    if num_revert_blocks == 0:
        return

    logger.info(f"index.py | {self.request.id} | num_revert_blocks:{num_revert_blocks}")

    if num_revert_blocks > 10000:
        raise Exception("Unexpected revert, >10,0000 blocks")

    if num_revert_blocks > 500:
        logger.error(f"index.py | {self.request.id} | Revert blocks list > 500")
        logger.error(revert_blocks_list)
        revert_blocks_list = revert_blocks_list[:500]
        logger.error(
            f"index.py | {self.request.id} | Sliced revert blocks list {revert_blocks_list}"
        )

    logger.info(f"index.py | {self.request.id} | Reverting {num_revert_blocks} blocks")
    logger.info(revert_blocks_list)

    with db.scoped_session() as session:

        rebuild_playlist_index = False
        rebuild_track_index = False
        rebuild_user_index = False

        for revert_block in revert_blocks_list:
            # Cache relevant information about current block
            revert_hash = revert_block.blockhash
            revert_block_number = revert_block.number
            logger.info(f"Reverting {revert_block_number}")
            parent_hash = revert_block.parenthash

            # Special case for default start block value of 0x0 / 0x0...0
            if revert_block.parenthash == default_padded_start_hash:
                parent_hash = default_config_start_hash

            # Update newly current block row and outdated row (indicated by current block's parent hash)
            session.query(Block).filter(Block.blockhash == revert_hash).update(
                {"is_current": False}
            )
            session.query(Block).filter(Block.blockhash == parent_hash).update(
                {"is_current": True}
            )

            # aggregate all transactions in current block
            revert_save_entries = (
                session.query(Save).filter(Save.blockhash == revert_hash).all()
            )
            revert_repost_entries = (
                session.query(Repost).filter(Repost.blockhash == revert_hash).all()
            )
            revert_follow_entries = (
                session.query(Follow).filter(Follow.blockhash == revert_hash).all()
            )
            revert_playlist_entries = (
                session.query(Playlist).filter(Playlist.blockhash == revert_hash).all()
            )
            revert_track_entries = (
                session.query(Track).filter(Track.blockhash == revert_hash).all()
            )
            revert_user_entries = (
                session.query(User).filter(User.blockhash == revert_hash).all()
            )
            revert_ursm_content_node_entries = (
                session.query(URSMContentNode)
                .filter(URSMContentNode.blockhash == revert_hash)
                .all()
            )
            revert_associated_wallets = (
                session.query(AssociatedWallet)
                .filter(AssociatedWallet.blockhash == revert_hash)
                .all()
            )
            revert_user_events_entries = (
                session.query(UserEvents)
                .filter(UserEvents.blockhash == revert_hash)
                .all()
            )
            revert_track_routes = (
                session.query(TrackRoute)
                .filter(TrackRoute.blockhash == revert_hash)
                .all()
            )

            # Revert all of above transactions
            for save_to_revert in revert_save_entries:
                save_item_id = save_to_revert.save_item_id
                save_user_id = save_to_revert.user_id
                save_type = save_to_revert.save_type
                previous_save_entry = (
                    session.query(Save)
                    .filter(Save.user_id == save_user_id)
                    .filter(Save.save_item_id == save_item_id)
                    .filter(Save.save_type == save_type)
                    .order_by(Save.blocknumber.desc())
                    .first()
                )
                if previous_save_entry:
                    previous_save_entry.is_current = True
                # Remove outdated save item entry
                session.delete(save_to_revert)

            for repost_to_revert in revert_repost_entries:
                repost_user_id = repost_to_revert.user_id
                repost_item_id = repost_to_revert.repost_item_id
                repost_type = repost_to_revert.repost_type
                previous_repost_entry = (
                    session.query(Repost)
                    .filter(Repost.user_id == repost_user_id)
                    .filter(Repost.repost_item_id == repost_item_id)
                    .filter(Repost.repost_type == repost_type)
                    .order_by(Repost.blocknumber.desc())
                    .first()
                )
                # Update prev repost row (is_delete) to is_current == True
                if previous_repost_entry:
                    previous_repost_entry.is_current = True
                # Remove outdated repost entry
                logger.info(f"Reverting repost: {repost_to_revert}")
                session.delete(repost_to_revert)

            for follow_to_revert in revert_follow_entries:
                previous_follow_entry = (
                    session.query(Follow)
                    .filter(
                        Follow.follower_user_id == follow_to_revert.follower_user_id
                    )
                    .filter(
                        Follow.followee_user_id == follow_to_revert.followee_user_id
                    )
                    .order_by(Follow.blocknumber.desc())
                    .first()
                )
                # update prev follow row (is_delete) to is_current = true
                if previous_follow_entry:
                    previous_follow_entry.is_current = True
                # remove outdated follow entry
                logger.info(f"Reverting follow: {follow_to_revert}")
                session.delete(follow_to_revert)

            for playlist_to_revert in revert_playlist_entries:
                playlist_id = playlist_to_revert.playlist_id
                previous_playlist_entry = (
                    session.query(Playlist)
                    .filter(Playlist.playlist_id == playlist_id)
                    .filter(Playlist.blocknumber < revert_block_number)
                    .order_by(Playlist.blocknumber.desc())
                    .first()
                )
                if previous_playlist_entry:
                    previous_playlist_entry.is_current = True
                # Remove outdated playlist entry
                session.delete(playlist_to_revert)

            for track_to_revert in revert_track_entries:
                track_id = track_to_revert.track_id
                previous_track_entry = (
                    session.query(Track)
                    .filter(Track.track_id == track_id)
                    .filter(Track.blocknumber < revert_block_number)
                    .order_by(Track.blocknumber.desc())
                    .first()
                )
                if previous_track_entry:
                    # First element in descending order is new current track item
                    previous_track_entry.is_current = True
                # Remove track entries
                logger.info(f"Reverting track: {track_to_revert}")
                session.delete(track_to_revert)

            for ursm_content_node_to_revert in revert_ursm_content_node_entries:
                cnode_sp_id = ursm_content_node_to_revert.cnode_sp_id
                previous_ursm_content_node_entry = (
                    session.query(URSMContentNode)
                    .filter(URSMContentNode.cnode_sp_id == cnode_sp_id)
                    .filter(URSMContentNode.blocknumber < revert_block_number)
                    .order_by(URSMContentNode.blocknumber.desc())
                    .first()
                )
                if previous_ursm_content_node_entry:
                    previous_ursm_content_node_entry.is_current = True
                # Remove previous ursm Content Node entires
                logger.info(
                    f"Reverting ursm Content Node: {ursm_content_node_to_revert}"
                )
                session.delete(ursm_content_node_to_revert)

            # TODO: ASSERT ON IDS GREATER FOR BOTH DATA MODELS
            for user_to_revert in revert_user_entries:
                user_id = user_to_revert.user_id
                previous_user_entry = (
                    session.query(User)
                    .filter(
                        User.user_id == user_id,
                        User.blocknumber < revert_block_number,
                        # Or both possibilities to allow use of composite index
                        # on user, block, is_current
                        or_(User.is_current == True, User.is_current == False),
                    )
                    .order_by(User.blocknumber.desc())
                    .first()
                )
                if previous_user_entry:
                    # Update previous user row, setting is_current to true
                    previous_user_entry.is_current = True
                # Remove outdated user entries
                logger.info(f"Reverting user: {user_to_revert}")
                session.delete(user_to_revert)

            for associated_wallets_to_revert in revert_associated_wallets:
                user_id = associated_wallets_to_revert.user_id
                previous_associated_wallet_entry = (
                    session.query(AssociatedWallet)
                    .filter(AssociatedWallet.user_id == user_id)
                    .filter(AssociatedWallet.blocknumber < revert_block_number)
                    .order_by(AssociatedWallet.blocknumber.desc())
                    .first()
                )
                if previous_associated_wallet_entry:
                    session.query(AssociatedWallet).filter(
                        AssociatedWallet.user_id == user_id
                    ).filter(
                        AssociatedWallet.blocknumber
                        == previous_associated_wallet_entry.blocknumber
                    ).update(
                        {"is_current": True}
                    )
                # Remove outdated associated wallets
                logger.info(f"Reverting associated Wallet: {user_id}")
                session.delete(associated_wallets_to_revert)

            revert_user_events(session, revert_user_events_entries, revert_block_number)

            for track_route_to_revert in revert_track_routes:
                track_id = track_route_to_revert.track_id
                previous_track_route_entry = (
                    session.query(TrackRoute)
                    .filter(
                        TrackRoute.track_id == track_id,
                        TrackRoute.blocknumber < revert_block_number,
                    )
                    .order_by(TrackRoute.blocknumber.desc(), TrackRoute.slug.asc())
                    .first()
                )
                if previous_track_route_entry:
                    previous_track_route_entry.is_current = True
                logger.info(f"Reverting track route {track_route_to_revert}")
                session.delete(track_route_to_revert)

            # Remove outdated block entry
            session.query(Block).filter(Block.blockhash == revert_hash).delete()

            rebuild_playlist_index = rebuild_playlist_index or bool(
                revert_playlist_entries
            )
            rebuild_track_index = rebuild_track_index or bool(revert_track_entries)
            rebuild_user_index = rebuild_user_index or bool(revert_user_entries)
    # TODO - if we enable revert, need to set the most_recent_indexed_block_redis_key key in redis


def revert_user_events(session, revert_user_events_entries, revert_block_number):
    for user_events_to_revert in revert_user_events_entries:
        user_id = user_events_to_revert.user_id
        previous_user_events_entry = (
            session.query(UserEvents)
            .filter(UserEvents.user_id == user_id)
            .filter(UserEvents.blocknumber < revert_block_number)
            .order_by(UserEvents.blocknumber.desc())
            .first()
        )
        if previous_user_events_entry:
            session.query(UserEvents).filter(UserEvents.user_id == user_id).filter(
                UserEvents.blocknumber == previous_user_events_entry.blocknumber
            ).update({"is_current": True})
        logger.info(f"Reverting user events: {user_events_to_revert}")
        session.delete(user_events_to_revert)


# CELERY TASKS
@celery.task(name="update_discovery_provider", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_task(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_task.db
    web3 = update_task.web3
    redis = update_task.redis

    # Initialize contracts and attach to the task singleton
    track_abi = update_task.abi_values[TRACK_FACTORY_CONTRACT_NAME]["abi"]
    track_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()["track_factory"], abi=track_abi
    )

    user_abi = update_task.abi_values[USER_FACTORY_CONTRACT_NAME]["abi"]
    user_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()[USER_FACTORY], abi=user_abi
    )

    playlist_abi = update_task.abi_values[PLAYLIST_FACTORY_CONTRACT_NAME]["abi"]
    playlist_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()[PLAYLIST_FACTORY], abi=playlist_abi
    )

    social_feature_abi = update_task.abi_values[SOCIAL_FEATURE_FACTORY_CONTRACT_NAME][
        "abi"
    ]
    social_feature_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()[SOCIAL_FEATURE_FACTORY],
        abi=social_feature_abi,
    )

    user_library_abi = update_task.abi_values[USER_LIBRARY_FACTORY_CONTRACT_NAME]["abi"]
    user_library_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()[USER_LIBRARY_FACTORY], abi=user_library_abi
    )

    user_replica_set_manager_abi = update_task.abi_values[
        USER_REPLICA_SET_MANAGER_CONTRACT_NAME
    ]["abi"]
    user_replica_set_manager_contract = update_task.web3.eth.contract(
        address=get_contract_addresses()[USER_REPLICA_SET_MANAGER],
        abi=user_replica_set_manager_abi,
    )

    update_task.track_contract = track_contract
    update_task.user_contract = user_contract
    update_task.playlist_contract = playlist_contract
    update_task.social_feature_contract = social_feature_contract
    update_task.user_library_contract = user_library_contract
    update_task.user_replica_set_manager_contract = user_replica_set_manager_contract

    # Update redis cache for health check queries
    update_latest_block_redis()

    DEFAULT_LOCK_TIMEOUT = 60 * 10  # ten minutes

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    # blocking_timeout is duration it waits to try to acquire lock
    # timeout is the duration the lock is held
    update_lock = redis.lock(
        "disc_prov_lock", blocking_timeout=25, timeout=DEFAULT_LOCK_TIMEOUT
    )
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index.py | {self.request.id} | update_task | Acquired disc_prov_lock"
            )
            initialize_blocks_table_if_necessary(db)

            latest_block = get_latest_block(db)

            # Capture block information between latest and target block hash
            index_blocks_list = []

            # Capture outdated block information given current database state
            revert_blocks_list = []

            with db.scoped_session() as session:
                block_intersection_found = False
                intersect_block_hash = web3.toHex(latest_block.hash)

                # First, we capture the block hash at which the current tail
                # and our indexed data intersect
                while not block_intersection_found:
                    current_hash = web3.toHex(latest_block.hash)
                    parent_hash = web3.toHex(latest_block.parentHash)

                    latest_block_db_query = session.query(Block).filter(
                        Block.blockhash == current_hash
                        and Block.parenthash == parent_hash
                        and Block.is_current == True
                    )

                    # Exit loop if we are up to date
                    if latest_block_db_query.count() > 0:
                        block_intersection_found = True
                        intersect_block_hash = current_hash
                        continue

                    index_blocks_list.append(latest_block)

                    parent_block_query = session.query(Block).filter(
                        Block.blockhash == parent_hash
                    )

                    # Intersection is considered found if current block parenthash is
                    # present in Blocks table
                    block_intersection_found = parent_block_query.count() > 0

                    num_blocks = len(index_blocks_list)
                    if num_blocks % 50 == 0:
                        logger.info(
                            f"index.py | update_task | Populating index_blocks_list, current length == {num_blocks}"
                        )

                    # Special case for initial block hash value of 0x0 and 0x0000....
                    reached_initial_block = parent_hash == default_padded_start_hash
                    if reached_initial_block:
                        block_intersection_found = True
                        intersect_block_hash = default_config_start_hash
                    else:
                        latest_block = web3.eth.get_block(parent_hash, True)
                        intersect_block_hash = web3.toHex(latest_block.hash)

                # Determine whether current indexed data (is_current == True) matches the
                # intersection block hash
                # Important when determining whether undo operations are necessary
                base_query = session.query(Block)
                base_query = base_query.filter(Block.is_current == True)
                db_block_query = base_query.all()

                assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
                db_current_block = db_block_query[0]

                # Check current block
                undo_operations_required = (
                    db_current_block.blockhash != intersect_block_hash
                )

                if undo_operations_required:
                    logger.info(
                        f"index.py | update_task | Undo required - {undo_operations_required}. \
                                Intersect_blockhash : {intersect_block_hash}.\
                                DB current blockhash {db_current_block.blockhash}"
                    )
                else:
                    logger.info(
                        f"index.py | update_task | Intersect_blockhash : {intersect_block_hash}"
                    )

                # Assign traverse block to current database block
                traverse_block = db_current_block

                # Add blocks to 'block remove' list from here as we traverse to the
                # valid intersect block
                while traverse_block.blockhash != intersect_block_hash:
                    revert_blocks_list.append(traverse_block)
                    parent_query = session.query(Block).filter(
                        Block.blockhash == traverse_block.parenthash
                    )

                    if parent_query.count() == 0:
                        logger.info(
                            f"index.py | update_task | Special case exit traverse block parenthash - "
                            f"{traverse_block.parenthash}"
                        )
                        break
                    traverse_block = parent_query[0]

                # Ensure revert blocks list is available after session scope
                session.expunge_all()

            # Exit DB scope, revert/index functions will manage their own sessions
            # Perform revert operations
            revert_blocks(self, db, revert_blocks_list)

            # Perform indexing operations
            index_blocks(self, db, index_blocks_list)
            logger.info(
                f"index.py | update_task | {self.request.id} | Processing complete within session"
            )
        else:
            logger.info(
                f"index.py | update_task | {self.request.id} | Failed to acquire disc_prov_lock"
            )
    except Exception as e:
        logger.error(f"Fatal error in main loop {e}", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
