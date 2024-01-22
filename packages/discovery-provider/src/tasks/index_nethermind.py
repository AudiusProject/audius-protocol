# pylint: disable=C0302
import concurrent.futures
import copy
import os
from datetime import datetime
from typing import Dict, List, Sequence, Tuple, TypedDict, cast

from hexbytes import HexBytes
from redis import Redis
from sqlalchemy.orm.session import Session
from web3 import Web3
from web3.exceptions import BlockNotFound
from web3.types import BlockData, HexStr, TxReceipt

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.trending_challenge import should_trending_challenge_update
from src.models.grants.developer_app import DeveloperApp
from src.models.grants.grant import Grant
from src.models.indexing.block import Block
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
from src.tasks.celery_app import celery
from src.tasks.entity_manager.entity_manager import entity_manager_update
from src.tasks.sort_block_transactions import sort_block_transactions
from src.utils import helpers, web3_provider
from src.utils.constants import CONTRACT_TYPES
from src.utils.indexing_errors import NotAllTransactionsFetched
from src.utils.redis_constants import (
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
)
from src.utils.structured_logger import StructuredLogger, log_duration

ENTITY_MANAGER = CONTRACT_TYPES.ENTITY_MANAGER.value

TX_TYPE_TO_HANDLER_MAP = {
    ENTITY_MANAGER: entity_manager_update,
}

BLOCKS_PER_DAY = (24 * 60 * 60) / 5

FINAL_POA_BLOCK = helpers.get_final_poa_block()


logger = StructuredLogger(__name__)


web3 = web3_provider.get_web3()

# HELPER FUNCTIONS

default_padded_start_hash = (
    "0x0000000000000000000000000000000000000000000000000000000000000000"
)
default_config_start_hash = "0x0"

# Used to update user_replica_set_manager address and skip txs conditionally
zero_address = "0x0000000000000000000000000000000000000000"

model_mapping = {
    Save.__tablename__: Save,
    Repost.__tablename__: Repost,
    Follow.__tablename__: Follow,
    Subscription.__tablename__: Subscription,
    Playlist.__tablename__: Playlist,
    Track.__tablename__: Track,
    User.__tablename__: User,
    AssociatedWallet.__tablename__: AssociatedWallet,
    UserEvent.__tablename__: UserEvent,
    NotificationSeen.__tablename__: NotificationSeen,
    PlaylistSeen.__tablename__: PlaylistSeen,
    DeveloperApp.__tablename__: DeveloperApp,
    Grant.__tablename__: Grant,
}


class TxReceiptAndHash(TypedDict):
    tx_receipt: TxReceipt
    tx_hash: str


def fetch_tx_receipt(tx_hash: HexBytes) -> TxReceiptAndHash:
    receipt = web3.eth.get_transaction_receipt(tx_hash)
    return {"tx_receipt": receipt, "tx_hash": tx_hash.hex()}


@log_duration(logger)
def fetch_tx_receipts(block: BlockData):
    # We fetch HexBytes rather than full TxData
    block_transactions = cast(Sequence[HexBytes], block["transactions"])
    block_tx_with_receipts: dict[str, TxReceipt] = {}
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_tx_receipt = {
            executor.submit(fetch_tx_receipt, tx): tx
            for tx in (block_transactions or [])
        }
        for future in concurrent.futures.as_completed(future_to_tx_receipt):
            tx = future_to_tx_receipt[future]
            try:
                tx_receipt_info = future.result()
                tx_hash = tx_receipt_info["tx_hash"]
                block_tx_with_receipts[tx_hash] = tx_receipt_info["tx_receipt"]
            except Exception as exc:
                logger.error(
                    f"index_nethermind.py | fetch_tx_receipts {tx.hex()} generated {exc}"
                )
    num_processed_txs = len(block_tx_with_receipts.keys())
    num_submitted_txs = len(block_transactions)
    logger.debug(
        f"index_nethermind.py num_processed_txs {num_processed_txs} num_submitted_txs {num_submitted_txs}."
    )
    if num_processed_txs != num_submitted_txs:
        raise NotAllTransactionsFetched(
            message=f"index_nethermind.py | fetch_tx_receipts Expected {num_submitted_txs} received {num_processed_txs}",
        )
    return block_tx_with_receipts


def get_entity_manager_events_tx(index_nethermind, event_type, tx_receipt):
    return getattr(
        index_nethermind.entity_manager_contract.events, event_type
    )().process_receipt(tx_receipt)


def get_contract_type_for_tx(tx_type_to_grouped_lists_map, tx, tx_receipt):
    entity_manager_address = os.getenv(
        "audius_contracts_nethermind_entity_manager_address"
    )
    if not entity_manager_address:
        entity_manager_address = os.getenv("audius_contracts_entity_manager_address")
    tx_target_contract_address = tx.to
    contract_type = None
    for tx_type in tx_type_to_grouped_lists_map.keys():
        tx_is_type = tx_target_contract_address == entity_manager_address
        if tx_is_type:
            contract_type = tx_type
            logger.debug(
                f"{tx_type} contract addr: {tx_target_contract_address}"
                f" tx from block - {tx}, receipt - {tx_receipt}"
            )
            break

    return contract_type


def add_indexed_block_to_db(
    session: Session, next_block: BlockData, current_block: Block
):
    block_model = Block(
        blockhash=web3.to_hex(next_block["hash"]),
        parenthash=web3.to_hex(next_block["parentHash"]),
        number=next_block["number"],
        is_current=True,
    )

    current_block.is_current = False
    session.add(block_model)


def add_indexed_block_to_redis(block: BlockData, redis: Redis):
    redis.set(most_recent_indexed_block_redis_key, block["number"])
    redis.set(most_recent_indexed_block_hash_redis_key, block["hash"].hex())


def process_state_changes(
    session: Session,
    tx_type_to_grouped_lists_map: dict[str, List[TxReceipt]],
    block: BlockData,
):
    block_number = block["number"]
    block_hash = block["hash"].hex()
    block_timestamp = block["timestamp"]

    for tx_type, bulk_processor in TX_TYPE_TO_HANDLER_MAP.items():
        txs_to_process = tx_type_to_grouped_lists_map[tx_type]
        tx_processing_args = [
            index_nethermind,
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
            f"{bulk_processor.__name__} completed"
            f" {tx_type}_state_changed={total_changes_for_tx_type > 0} for block={block_number}"
        )


def get_latest_database_block(session: Session) -> Block:
    """
    Gets the latest block in the database.
    This block necessarily has `is_current` set to True.
    """
    latest_database_block_query = session.query(Block).filter(Block.is_current == True)
    latest_database_block_results = latest_database_block_query.all()
    assert (
        len(latest_database_block_results) == 1
    ), "Expected a single row with is_current=True"
    latest_database_block = latest_database_block_results[0]

    return latest_database_block


def is_block_on_chain(web3: Web3, block: Block):
    """
    Determines if the provided block is valid on chain by fetching its hash.
    """
    try:
        block_from_chain = web3.eth.get_block(HexStr(block.blockhash))
        return block_from_chain
    except BlockNotFound:
        return False
    # Raise any other type of exception


def get_next_block(web3: Web3, latest_database_block: Block, final_poa_block=0):
    if latest_database_block.number is None:
        logger.info(f"Block number invalid {latest_database_block}, returning early")
        return False

    # Get next block to index
    next_block_number = latest_database_block.number - (final_poa_block or 0) + 1
    try:
        next_block_immutable = web3.eth.get_block(next_block_number)
        # Copy the immutable attribute dict to a mutable dict
        next_block: BlockData = cast(BlockData, dict(next_block_immutable))
        next_block["number"] = next_block["number"] + final_poa_block
        return next_block
    except BlockNotFound:
        logger.info(f"Block not found {next_block_number}, returning early")
        # Return early because we've likely indexed up to the head of the chain
        return False


def get_relevant_blocks(
    web3: Web3, latest_database_block: Block, final_poa_block=0
) -> Tuple[BlockData | bool, BlockData | bool]:
    with concurrent.futures.ThreadPoolExecutor() as executor:
        is_block_on_chain_future = executor.submit(
            is_block_on_chain, web3, latest_database_block
        )
        next_block_future = executor.submit(
            get_next_block, web3, latest_database_block, final_poa_block
        )

        block_on_chain = is_block_on_chain_future.result()
        next_block = next_block_future.result()

        if (
            next_block
            and web3.to_hex(next_block["parentHash"]) != latest_database_block.blockhash
            and latest_database_block.number != 0
        ):
            block_on_chain = False

        return block_on_chain, next_block


@log_duration(logger)
def index_next_block(
    session: Session, latest_database_block: Block, next_block: BlockData
):
    """
    Given the latest block in the database, index forward one block.
    """
    redis = index_nethermind.redis
    shared_config = index_nethermind.shared_config
    next_block_number = next_block["number"]
    logger.set_context("block", next_block_number)

    indexing_transaction_index_sort_order_start_block = (
        shared_config["discprov"]["indexing_transaction_index_sort_order_start_block"]
        or 0
    )

    challenge_bus: ChallengeEventBus = index_nethermind.challenge_event_bus
    with challenge_bus.use_scoped_dispatch_queue():
        txs_grouped_by_type: dict[str, List[TxReceipt]] = {
            ENTITY_MANAGER: [],
        }
        try:
            """
            Fetch transaction receipts
            """
            tx_receipt_dict = fetch_tx_receipts(next_block)

            """
            Parse transaction receipts
            """
            sorted_txs = sort_block_transactions(
                next_block,
                tx_receipt_dict.values(),
                indexing_transaction_index_sort_order_start_block,
            )
            logger.set_context("tx_count", len(sorted_txs))

            # Parse tx events in each block
            for tx in sorted_txs:
                tx_hash = tx["transactionHash"].hex()
                tx_receipt = tx_receipt_dict[tx_hash]
                contract_type = get_contract_type_for_tx(
                    txs_grouped_by_type, tx, tx_receipt
                )
                if contract_type:
                    txs_grouped_by_type[contract_type].append(tx_receipt)

            """
            Add block to db
            """
            add_indexed_block_to_db(session, next_block, latest_database_block)

            """
            Add state changes in block to db (users, tracks, etc.)
            """
            # bulk process operations once all tx's for block have been parsed
            # and get changed entity IDs for cache clearing
            # after session commit
            process_state_changes(
                session,
                txs_grouped_by_type,
                next_block,
            )

        except NotAllTransactionsFetched as e:
            raise e
        try:
            # Only dispatch trending challenge computation on a similar block, modulo 100
            # so things are consistent. Note that if a discovery node is behind, this will be
            # inconsistent.
            # TODO: Consider better alternatives for consistency with behind nodes. Maybe this
            # should not be calculated.
            if next_block["number"] % 100 == 0:
                # Check the last block's timestamp for updating the trending challenge
                [should_update, date] = should_trending_challenge_update(
                    session, next_block["timestamp"]
                )
                if should_update:
                    celery.send_task(
                        "calculate_trending_challenges", kwargs={"date": date}
                    )
        except Exception as e:
            # Do not throw error, as this should not stop indexing
            logger.error(
                f"Error in calling update trending challenge {e}",
                exc_info=True,
            )
        try:
            # Every 100 blocks, poll and apply delist statuses from trusted notifier
            if next_block["number"] % 100 == 0:
                celery.send_task(
                    "update_delist_statuses",
                    kwargs={"current_block_timestamp": next_block["timestamp"]},
                )
        except Exception as e:
            # Do not throw error, as this should not stop indexing
            logger.error(
                f"Error in calling update_delist_statuses {e}",
                exc_info=True,
            )

    add_indexed_block_to_redis(next_block, redis)


def get_block(web3: Web3, blocknumber: int, final_poa_block=0):
    try:
        adjusted_blocknumber = blocknumber - (final_poa_block or 0)
        block = web3.eth.get_block(adjusted_blocknumber)
        block = copy.deepcopy(block)
        return block
    except BlockNotFound:
        logger.info(f"Block not found {adjusted_blocknumber}")
        return False


def revert_delist_cursors(session: Session, revert_block_parent_hash: str):
    parent_number_results = (
        session.query(Block.number)
        .filter(Block.blockhash == revert_block_parent_hash)
        .first()
    )
    if not parent_number_results or parent_number_results[0] is None:
        return
    parent_number = parent_number_results[0]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        block_future = executor.submit(get_block, web3, parent_number, FINAL_POA_BLOCK)

        parent_block = block_future.result()
        if not parent_block:
            return
        celery.send_task(
            "revert_delist_status_cursors",
            kwargs={"reverted_cursor_timestamp": parent_block.timestamp},
        )


@log_duration(logger)
def revert_block(session: Session, block_to_revert: Block):
    start_time = datetime.now()

    # Cache relevant information about current block
    revert_hash = block_to_revert.blockhash
    revert_block_number = block_to_revert.number
    parent_hash = block_to_revert.parenthash
    if not parent_hash:
        return
    logger.set_context("block", revert_block_number)

    # Special case for default start block value of 0x0 / 0x0...0
    if block_to_revert.parenthash == default_padded_start_hash:
        parent_hash = default_config_start_hash

    # Update newly current block row and outdated row (indicated by current block's parent hash)
    session.query(Block).filter(Block.blockhash == revert_hash).update(
        {"is_current": False}
    )
    session.query(Block).filter(Block.blockhash == parent_hash).update(
        {"is_current": True}
    )

    # set delist cursor back to parent block's timestamp
    revert_delist_cursors(session, parent_hash)

    # aggregate all transactions in current block
    revert_block_record = (
        session.query(RevertBlock)
        .filter(RevertBlock.blocknumber == revert_block_number)
        .first()
    )

    revert_track_routes = (
        session.query(TrackRoute)
        .filter(TrackRoute.blocknumber == revert_block_number)
        .all()
    )
    revert_playlist_routes = (
        session.query(PlaylistRoute)
        .filter(PlaylistRoute.blocknumber == revert_block_number)
        .all()
    )

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

    for playlist_route_to_revert in revert_playlist_routes:
        playlist_id = playlist_route_to_revert.playlist_id
        previous_playlist_route_entry = (
            session.query(PlaylistRoute)
            .filter(
                PlaylistRoute.playlist_id == playlist_id,
                PlaylistRoute.blocknumber < revert_block_number,
            )
            .order_by(PlaylistRoute.blocknumber.desc(), PlaylistRoute.slug.asc())
            .first()
        )
        if previous_playlist_route_entry:
            previous_playlist_route_entry.is_current = True
        logger.info(f"Reverting playlist route {playlist_route_to_revert}")
        session.delete(playlist_route_to_revert)

    # delete block record and cascade delete from tables ^
    session.query(Block).filter(Block.blockhash == revert_hash).delete()
    if not revert_block_record:
        logger.info("No reverts to apply")
        return

    revert_records = []
    prev_records: Dict[str, List[Dict]] = dict(revert_block_record.prev_records)
    # apply reverts
    for record_type in prev_records:
        for json_record in prev_records[record_type]:
            if record_type not in model_mapping:
                # skip playlist/track routes reverts
                continue
            Model = model_mapping[record_type]
            # filter out unnecessary keys
            filtered_json_record = {
                k: v for k, v in json_record.items() if k in Model.__table__.columns  # type: ignore
            }
            revert_records.append(Model(**filtered_json_record))
    # Remove outdated block entry
    session.add_all(revert_records)

    logger.info(
        f"Reverted {revert_block_number} in {datetime.now() - start_time} seconds"
    )


@celery.task(name="index_nethermind", bind=True)
@log_duration(logger)
def index_nethermind(self):
    logger.reset_context()
    logger.set_context("request_id", self.request.id)

    redis = index_nethermind.redis
    db = index_nethermind.db
    update_lock = redis.lock("index_nethermind_lock", blocking_timeout=25, timeout=600)
    have_lock = update_lock.acquire(blocking=False)

    if not have_lock:
        # Some other task is indexing. When tasks are fast, celery can get caught up
        # with itself.
        logger.disable()
        return

    try:
        with db.scoped_session() as session:
            latest_database_block = get_latest_database_block(session)

            in_valid_state, next_block = get_relevant_blocks(
                web3, latest_database_block, FINAL_POA_BLOCK
            )
            if not next_block:
                # Nothing to index
                logger.disable()
                update_lock.release()
                # Send the task with a small amount of sleep to free up cycles
                celery.send_task(
                    "index_nethermind", countdown=0.5, queue="index_nethermind"
                )
                return

            if in_valid_state:
                index_next_block(session, latest_database_block, next_block)
            else:
                revert_block(session, latest_database_block)
    except Exception as e:
        logger.error(f"Error in indexing blocks {e}", exc_info=True)
    update_lock.release()
    celery.send_task("index_nethermind", queue="index_nethermind")
