# pylint: disable=C0302
import concurrent.futures
import logging
import time
from operator import itemgetter, or_

from src.app import get_contract_addresses
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.trending_challenge import should_trending_challenge_update
from src.models.indexing.block import Block
from src.models.indexing.ursm_content_node import UrsmContentNode
from src.models.notifications.notification import NotificationSeen
from src.models.playlists.playlist import Playlist
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
    get_indexing_error,
    set_indexing_error,
)
from src.queries.skipped_transactions import add_network_level_skipped_transaction
from src.tasks.celery_app import celery
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.sort_block_transactions import sort_block_transactions
from src.utils import helpers
from src.utils.constants import CONTRACT_NAMES_ON_CHAIN, CONTRACT_TYPES
from src.utils.index_blocks_performance import (
    record_add_indexed_block_to_db_ms,
    record_index_blocks_ms,
    sweep_old_add_indexed_block_to_db_ms,
    sweep_old_fetch_metadata_ms,
    sweep_old_index_blocks_ms,
)
from src.utils.indexing_errors import IndexingError
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    save_duration_metric,
)
from src.utils.redis_constants import (
    latest_block_hash_redis_key,
    latest_block_redis_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
)
from src.utils.session_manager import SessionManager

ENTITY_MANAGER = CONTRACT_TYPES.ENTITY_MANAGER.value

ENTITY_MANAGER_CONTRACT_NAME = CONTRACT_NAMES_ON_CHAIN[CONTRACT_TYPES.ENTITY_MANAGER]

TX_TYPE_TO_HANDLER_MAP = {
    ENTITY_MANAGER: entity_manager_update,
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


def get_latest_block(db: SessionManager, final_poa_block):
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
        if final_poa_block:
            target_latest_block_number = min(
                target_latest_block_number, final_poa_block
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
            logger.debug(
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
    tx_type_to_grouped_lists_map,
    block,
):
    block_number, block_hash, block_timestamp = itemgetter(
        "number", "hash", "timestamp"
    )(block)

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
        ]

        (
            total_changes_for_tx_type,
            _,
        ) = bulk_processor(*tx_processing_args)

        logger.info(
            f"index.py | {bulk_processor.__name__} completed"
            f" {tx_type}_state_changed={total_changes_for_tx_type > 0} for block={block_number}"
        )


def create_and_raise_indexing_error(err, redis):
    logger.debug(
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
    metric = PrometheusMetric(PrometheusMetricNames.INDEX_BLOCKS_DURATION_SECONDS)
    for i in block_order_range:
        start_time = time.time()
        metric.reset_timer()
        block = blocks_list[i]
        block_index = num_blocks - i
        block_number, block_hash, latest_block_timestamp = itemgetter(
            "number", "hash", "timestamp"
        )(block)

        final_poa_block = helpers.get_final_poa_block(shared_config)
        if final_poa_block and block_number > final_poa_block:
            logger.info("index.py | skipping block {block_number} past final_poa_block")
            break

        logger.info(
            f"index.py | index_blocks | {self.request.id} | block {block.number} - {block_index}/{num_blocks}"
        )
        challenge_bus: ChallengeEventBus = update_task.challenge_event_bus

        with db.scoped_session() as session, challenge_bus.use_scoped_dispatch_queue():
            skip_tx_hash = get_tx_hash_to_skip(session, redis)
            skip_whole_block = skip_tx_hash == "commit"  # db tx failed at commit level
            if skip_whole_block:
                logger.debug(
                    f"index.py | Skipping all txs in block {block.hash} {block.number}"
                )
                save_skipped_tx(session, redis)
                add_indexed_block_to_db(session, block)
            else:
                txs_grouped_by_type = {
                    ENTITY_MANAGER: [],
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
                    logger.debug(
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
                            logger.debug(
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
                    logger.debug(
                        f"index.py | index_blocks - parse_tx_receipts in {time.time() - parse_tx_receipts_start_time}s"
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
                    logger.debug(
                        f"index.py | index_blocks - add_indexed_block_to_db in {duration_ms}ms"
                    )

                    """
                    Add state changes in block to db (users, tracks, etc.)
                    """
                    process_state_changes_start_time = time.time()
                    # bulk process operations once all tx's for block have been parsed
                    # and get changed entity IDs for cache clearing
                    # after session commit
                    process_state_changes(
                        self,
                        session,
                        txs_grouped_by_type,
                        block,
                    )
                    metric.save_time(
                        {"scope": "process_state_changes"},
                        start_time=process_state_changes_start_time,
                    )
                    logger.debug(
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
                logger.debug(
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

        add_indexed_block_to_redis(block, redis)
        logger.debug(
            f"index.py | update most recently processed block complete for block=${block_number}"
        )

        # Record the time this took in redis
        metric.save_time({"scope": "full"})
        duration_ms = round(time.time() - start_time * 1000)
        record_index_blocks_ms(redis, duration_ms)

        # Sweep records older than 30 days every day
        if block_number % BLOCKS_PER_DAY == 0:
            sweep_old_index_blocks_ms(redis, 30)
            sweep_old_fetch_metadata_ms(redis, 30)
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

    if num_revert_blocks > 100:
        raise Exception("Unexpected revert, >100 blocks")

    if num_revert_blocks > 50:
        logger.error(f"index.py | {self.request.id} | Revert blocks list > 50")
        logger.error(revert_blocks_list)
        revert_blocks_list = revert_blocks_list[:50]
        logger.error(
            f"index.py | {self.request.id} | Sliced revert blocks list {revert_blocks_list}"
        )

    logger.debug(f"index.py | {self.request.id} | Reverting {num_revert_blocks} blocks")
    logger.debug(revert_blocks_list)

    with db.scoped_session() as session:
        rebuild_playlist_index = False
        rebuild_track_index = False
        rebuild_user_index = False

        for revert_block in revert_blocks_list:
            # Cache relevant information about current block
            revert_hash = revert_block.blockhash
            revert_block_number = revert_block.number
            logger.debug(f"Reverting {revert_block_number}")
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
            revert_subscription_entries = (
                session.query(Subscription)
                .filter(Subscription.blockhash == revert_hash)
                .all()
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
                session.query(UrsmContentNode)
                .filter(UrsmContentNode.blockhash == revert_hash)
                .all()
            )
            revert_associated_wallets = (
                session.query(AssociatedWallet)
                .filter(AssociatedWallet.blockhash == revert_hash)
                .all()
            )
            revert_user_events_entries = (
                session.query(UserEvent)
                .filter(UserEvent.blockhash == revert_hash)
                .all()
            )
            revert_track_routes = (
                session.query(TrackRoute)
                .filter(TrackRoute.blockhash == revert_hash)
                .all()
            )

            revert_notification_seen = (
                session.query(NotificationSeen)
                .filter(NotificationSeen.blocknumber == revert_block_number)
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
                logger.debug(f"Reverting repost: {repost_to_revert}")
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
                logger.debug(f"Reverting follow: {follow_to_revert}")
                session.delete(follow_to_revert)

            for subscription_to_revert in revert_subscription_entries:
                previous_subscription_entry = (
                    session.query(Subscription)
                    .filter(
                        Subscription.subscriber_id
                        == subscription_to_revert.subscriber_id
                    )
                    .filter(Subscription.user_id == subscription_to_revert.user_id)
                    .filter(Subscription.blocknumber < revert_block_number)
                    .order_by(Subscription.blocknumber.desc())
                    .first()
                )
                if previous_subscription_entry:
                    previous_subscription_entry.is_current = True
                logger.debug(f"Reverting subscription: {subscription_to_revert}")
                session.delete(subscription_to_revert)

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
                logger.debug(f"Reverting track: {track_to_revert}")
                session.delete(track_to_revert)

            for ursm_content_node_to_revert in revert_ursm_content_node_entries:
                cnode_sp_id = ursm_content_node_to_revert.cnode_sp_id
                previous_ursm_content_node_entry = (
                    session.query(UrsmContentNode)
                    .filter(UrsmContentNode.cnode_sp_id == cnode_sp_id)
                    .filter(UrsmContentNode.blocknumber < revert_block_number)
                    .order_by(UrsmContentNode.blocknumber.desc())
                    .first()
                )
                if previous_ursm_content_node_entry:
                    previous_ursm_content_node_entry.is_current = True
                # Remove previous ursm Content Node entires
                logger.debug(
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
                logger.debug(f"Reverting user: {user_to_revert}")
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
                logger.debug(f"Reverting associated Wallet: {user_id}")
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
                logger.debug(f"Reverting track route {track_route_to_revert}")
                session.delete(track_route_to_revert)

            for notification_seen_to_revert in revert_notification_seen:
                session.delete(notification_seen_to_revert)
                # NOTE: There is no need mark previous as is_current for notification seen

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
            session.query(UserEvent)
            .filter(UserEvent.user_id == user_id)
            .filter(UserEvent.blocknumber < revert_block_number)
            .order_by(UserEvent.blocknumber.desc())
            .first()
        )
        if previous_user_events_entry:
            session.query(UserEvent).filter(UserEvent.user_id == user_id).filter(
                UserEvent.blocknumber == previous_user_events_entry.blocknumber
            ).update({"is_current": True})
        logger.debug(f"Reverting user events: {user_events_to_revert}")
        session.delete(user_events_to_revert)


# CELERY TASKS
@celery.task(name="update_discovery_provider", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_task(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    return
