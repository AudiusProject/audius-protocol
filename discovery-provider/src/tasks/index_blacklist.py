import logging
from src.app import contract_addresses
from src.models import IPLDBlacklistBlock, BlacklistedIPLD
from src.tasks.celery_app import celery
from src.tasks.ipld_blacklist import ipld_blacklist_state_update
from src.utils.redis_constants import (
    most_recent_indexed_ipld_block_redis_key,
    most_recent_indexed_ipld_block_hash_redis_key,
)

logger = logging.getLogger(__name__)


######## HELPER FUNCTIONS ########


default_padded_start_hash = (
    "0x0000000000000000000000000000000000000000000000000000000000000000"
)
default_config_start_hash = "0x0"


def initialize_blacklist_blocks_table_if_necessary(db):
    target_blockhash = None
    target_blockhash = update_ipld_blacklist_task.shared_config["discprov"][
        "start_block"
    ]
    target_block = update_ipld_blacklist_task.web3.eth.getBlock(target_blockhash, True)
    with db.scoped_session() as session:
        current_block_query_result = session.query(IPLDBlacklistBlock).filter_by(
            is_current=True
        )
        if current_block_query_result.count() == 0:
            blocks_query_result = session.query(IPLDBlacklistBlock)
            assert (
                blocks_query_result.count() == 0
            ), "Corrupted DB State - Expect single row marked as current"
            block_model = IPLDBlacklistBlock(
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
        else:
            assert (
                current_block_query_result.count() == 1
            ), "Expected SINGLE row marked as current"

    return target_blockhash


def get_latest_blacklist_block(db):
    latest_block = None
    block_processing_window = int(
        update_ipld_blacklist_task.shared_config["discprov"][
            "blacklist_block_processing_window"
        ]
    )
    with db.scoped_session() as session:
        current_block_query = session.query(IPLDBlacklistBlock).filter_by(
            is_current=True
        )
        assert current_block_query.count() == 1, "Expected SINGLE row marked as current"

        current_block_query_results = current_block_query.all()
        current_block = current_block_query_results[0]
        current_block_number = current_block.number

        if current_block_number == None:
            current_block_number = 0

        target_latest_block_number = current_block_number + block_processing_window

        latest_block_from_chain = update_ipld_blacklist_task.web3.eth.getBlock(
            "latest", True
        )
        latest_block_number_from_chain = latest_block_from_chain.number

        target_latest_block_number = min(
            target_latest_block_number, latest_block_number_from_chain
        )

        logger.info(
            f"IPLDBLACKLIST | get_latest_blacklist_block | "
            f"current={current_block_number} target={target_latest_block_number}"
        )
        latest_block = update_ipld_blacklist_task.web3.eth.getBlock(
            target_latest_block_number, True
        )
    return latest_block


def index_blocks(self, db, blocks_list):
    redis = update_ipld_blacklist_task.redis
    num_blocks = len(blocks_list)
    block_order_range = range(len(blocks_list) - 1, -1, -1)
    for i in block_order_range:
        if i % 1000 == 0:
            indexing_num = num_blocks - i
            logger.info(f"{indexing_num}/{num_blocks} blocks")

        block = blocks_list[i]
        block_number = block.number
        block_timestamp = block.timestamp

        # Handle each block in a distinct transaction
        with db.scoped_session() as session:
            current_block_query = session.query(IPLDBlacklistBlock).filter_by(
                is_current=True
            )

            block_model = IPLDBlacklistBlock(
                blockhash=update_ipld_blacklist_task.web3.toHex(block.hash),
                parenthash=update_ipld_blacklist_task.web3.toHex(block.parentHash),
                number=block.number,
                is_current=True,
            )

            # Update blocks table after
            assert (
                current_block_query.count() == 1
            ), "Expected single row marked as current"

            former_current_block = current_block_query.first()
            former_current_block.is_current = False
            session.add(block_model)

            ipld_blacklist_factory_txs = []

            # Parse tx events in each block
            for tx in block.transactions:
                tx_hash = update_ipld_blacklist_task.web3.toHex(tx["hash"])
                tx_target_contract_address = tx["to"]
                tx_receipt = update_ipld_blacklist_task.web3.eth.getTransactionReceipt(
                    tx_hash
                )

                # Handle ipld blacklist operations
                if (
                    tx_target_contract_address
                    == contract_addresses["ipld_blacklist_factory"]
                ):
                    logger.info(
                        f"IPLDBlacklistFactory operation, contract addr from block: {tx_target_contract_address}"
                        f" tx from block - {tx}, receipt - {tx_receipt}, "
                        "adding to ipld_blacklist_factory_txs to process in bulk"
                    )
                    ipld_blacklist_factory_txs.append(tx_receipt)

            if ipld_blacklist_factory_txs:
                logger.warning(
                    f"ipld_blacklist_factory_txs {ipld_blacklist_factory_txs}"
                )

            ipld_blacklist_state_update(
                self,
                update_ipld_blacklist_task,
                session,
                ipld_blacklist_factory_txs,
                block_number,
                block_timestamp,
            )

        # Add the block number of the most recently processed ipld block to redis
        redis.set(most_recent_indexed_ipld_block_redis_key, block_number)
        redis.set(most_recent_indexed_ipld_block_hash_redis_key, block.hash.hex())

    if num_blocks > 0:
        logger.info(f"IPLDBLACKLIST | Indexed {num_blocks} blocks")


def revert_blocks(self, db, revert_blocks_list):
    with db.scoped_session() as session:
        # Traverse list of blocks to undo
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
            session.query(IPLDBlacklistBlock).filter(
                IPLDBlacklistBlock.blockhash == parent_hash
            ).update({"is_current": True})
            session.query(IPLDBlacklistBlock).filter(
                IPLDBlacklistBlock.blockhash == revert_hash
            ).update({"is_current": False})

            revert_ipld_blacklist_entries = (
                session.query(BlacklistedIPLD)
                .filter(BlacklistedIPLD.blockhash == revert_hash)
                .all()
            )

            for ipld_blacklist_to_revert in revert_ipld_blacklist_entries:
                metadata_multihash = ipld_blacklist_to_revert.metadata_multihash
                previous_ipld_blacklist_entry = (
                    session.query(BlacklistedIPLD)
                    .filter(BlacklistedIPLD.ipld == metadata_multihash)
                    .filter(BlacklistedIPLD.blocknumber < revert_block_number)
                    .order_by(BlacklistedIPLD.blocknumber.desc())
                    .first()
                )
                if previous_ipld_blacklist_entry:
                    # First element in descending order is new current IPLD blacklist item
                    previous_ipld_blacklist_entry.is_current = True
                # Remove IPLD blacklist entries
                logger.info(f"Reverting IPLD Blacklist: {ipld_blacklist_to_revert}")
                session.delete(ipld_blacklist_to_revert)

            # Remove outdated block entry
            session.query(IPLDBlacklistBlock).filter(
                IPLDBlacklistBlock.blockhash == revert_hash
            ).delete()


######## CELERY TASKS ########


@celery.task(name="update_ipld_blacklist", bind=True)
def update_ipld_blacklist_task(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_ipld_blacklist_task.db
    web3 = update_ipld_blacklist_task.web3
    redis = update_ipld_blacklist_task.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("ipld_blacklist_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            initialize_blacklist_blocks_table_if_necessary(db)

            latest_block = get_latest_blacklist_block(db)

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

                    latest_block_db_query = session.query(IPLDBlacklistBlock).filter(
                        IPLDBlacklistBlock.blockhash == current_hash
                        and IPLDBlacklistBlock.parenthash == parent_hash
                        and IPLDBlacklistBlock.is_current == True
                    )

                    # Exit loop if we are up to date
                    if latest_block_db_query.count() > 0:
                        block_intersection_found = True
                        intersect_block_hash = current_hash
                        continue

                    index_blocks_list.append(latest_block)

                    parent_block_query = session.query(IPLDBlacklistBlock).filter(
                        IPLDBlacklistBlock.blockhash == parent_hash
                    )

                    # Intersection is considered found if current block parenthash is
                    # present in Blocks table
                    block_intersection_found = parent_block_query.count() > 0

                    num_blocks = len(index_blocks_list)
                    if num_blocks % 1000 == 0:
                        logger.info(
                            f"IPLDBLACKLIST | Populating blacklist index_blocks_list, current length == {num_blocks}"
                        )

                    # Special case for initial block hash value of 0x0 and 0x0000....
                    reached_initial_block = parent_hash == default_padded_start_hash
                    if reached_initial_block:
                        block_intersection_found = True
                        intersect_block_hash = default_config_start_hash
                    else:
                        latest_block = web3.eth.getBlock(parent_hash, True)
                        intersect_block_hash = web3.toHex(latest_block.hash)

                # Determine whether current indexed data (is_current == True) matches the
                # intersection block hash
                # Important when determining whether undo operations are necessary
                base_query = session.query(IPLDBlacklistBlock)
                base_query = base_query.filter(IPLDBlacklistBlock.is_current == True)
                db_block_query = base_query.all()

                assert len(db_block_query) == 1, "Expected SINGLE row marked as current"

                db_current_block = db_block_query[0]

                # Check current block
                undo_operations_required = (
                    db_current_block.blockhash != intersect_block_hash
                )

                if undo_operations_required:
                    logger.info(
                        f"IPLDBLACKLIST | Undo required - {undo_operations_required}. \
                                Intersect_blockhash : {intersect_block_hash}.\
                                DB current blockhash {db_current_block.blockhash}"
                    )

                # Assign traverse block to current database block
                traverse_block = db_current_block

                # Add blocks to 'block remove' list from here as we traverse to the
                # valid intersect block
                while traverse_block.blockhash != intersect_block_hash:
                    revert_blocks_list.append(traverse_block)
                    parent_query = session.query(IPLDBlacklistBlock).filter(
                        IPLDBlacklistBlock.blockhash == traverse_block.parenthash
                    )

                    if parent_query.count() == 0:
                        logger.info(
                            f"IPLDBLACKLIST | Special case exit traverse block parenthash - {traverse_block.parenthash}"
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
                f"IPLDBLACKLIST | Exited block intersection loop - {block_intersection_found}"
            )
        else:
            logger.info("IPLDBLACKLIST | Failed to acquire ipld_blacklist_lock")
    except Exception as e:
        logger.error("IPLDBLACKLIST | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
