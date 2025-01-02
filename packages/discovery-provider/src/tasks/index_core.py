import logging
import threading
import time
from typing import Optional

from redis import Redis

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.tasks.core.core_client import CoreClient, get_core_instance
from src.tasks.core.gen.protocol_pb2 import BlockResponse
from src.tasks.index_core_cutovers import (
    get_adjusted_core_block,
    get_core_cutover,
    get_core_cutover_chain_id,
    get_sol_cutover,
)
from src.tasks.index_core_plays import index_core_play
from src.tasks.index_solana_plays import get_latest_slot
from src.utils.session_manager import SessionManager

root_logger = logging.getLogger(__name__)

CORE_INDEXER_MINIMUM_TIME_SECS = 1
CORE_INDEXER_ERROR_SLEEP_SECS = 5

core_health_check_cache_key = "core:indexer:health"
core_plays_health_check_cache_key = "core:indexer:health:plays"
core_em_health_check_cache_key = "core:indexer:health:em"


class CoreIndexer:
    db: SessionManager
    redis: Redis
    challenge_bus: ChallengeEventBus
    core: CoreClient
    logger: logging.Logger
    stop_event: threading.Event

    indexer_initialized: bool
    indexer_caught_up: bool

    sol_plays_cutover_end: int
    sol_latest_processed_slot: int
    core_plays_cutover_start: int
    core_plays_cutover_chain_id: str

    chain_id: str
    latest_indexed_block_height: int
    latest_chain_block_height: int

    def __init__(
        self, db: SessionManager, redis: Redis, challenge_bus: ChallengeEventBus
    ):
        self.db = db
        self.redis = redis
        self.challenge_bus = challenge_bus
        self.core = get_core_instance()
        self.stop_event = threading.Event()
        self.indexer_initialized = False
        self.indexer_caught_up = False
        self.logger = logging.LoggerAdapter(
            logger=root_logger,
            extra={
                "indexer": "core",
            },
        )

    # checks all the connections and gathers base values so the indexer can proceed
    def initialize(self):
        self.logger.info("initializing core indexer")
        # set up cutover data
        self.sol_plays_cutover_end = get_sol_cutover()
        self.core_plays_cutover_start = get_core_cutover()
        self.core_plays_cutover_chain_id = get_core_cutover_chain_id()

        # gather current data
        node_info = self.core.get_node_info()
        if not node_info:
            raise Exception("node info not available")

        # gather chain data
        self.chain_id = node_info.chainid
        self.latest_chain_block_height = node_info.current_height

        # gather indexer state
        with self.db.scoped_session() as session:
            latest_indexed_block = (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == self.chain_id)
                .order_by(CoreIndexedBlocks.height.desc())
                .first()
            )
            self.latest_indexed_block_height = 0
            if latest_indexed_block:
                self.latest_indexed_block_height = latest_indexed_block.height

        self.indexer_initialized = True
        self.logger.info("initialized core indexer")

    # starts indexer in it's own thread to avoid blocking main
    def start(self):
        thread = threading.Thread(target=self.index_core, daemon=True)
        thread.start()
        root_logger.info("core indexer thread started")

    def latest_indexed_adjusted_sol_block_height(self) -> int:
        return get_adjusted_core_block(self.latest_indexed_block_height)

    # indexer will consider itself caught up if it is within 30 blocks (seconds) behind the chain
    def evaluate_indexer_caught_up(self):
        self.indexer_caught_up = (
            self.latest_indexed_block_height >= self.latest_chain_block_height - 30
        )

    def should_index_plays(self) -> bool:
        latest_processed_slot = get_latest_slot(self.db)
        self.sol_latest_processed_slot = latest_processed_slot
        return self.sol_latest_processed_slot >= self.sol_plays_cutover_end

    def index_core(self):
        while not self.stop_event.is_set():
            have_lock = False
            was_error = False
            update_lock = self.redis.lock("index_core_lock")
            start_time = time.time()
            try:
                have_lock = update_lock.acquire(blocking=False)
                if not have_lock:
                    raise Exception("failed to aquire lock")

                initialized = self.indexer_initialized
                if not initialized:
                    self.initialize()

                indexed_block = self.index_core_block()
                if not indexed_block:
                    continue

                self.latest_indexed_block_height = indexed_block.height
            except Exception as e:
                was_error = True
                self.logger.error(f"error {e}")
            finally:
                if have_lock:
                    update_lock.release()
                elapsed_time = time.time() - start_time
                should_wait = (
                    self.indexer_caught_up
                    and elapsed_time < CORE_INDEXER_MINIMUM_TIME_SECS
                )
                if should_wait:
                    time.sleep(CORE_INDEXER_MINIMUM_TIME_SECS - elapsed_time)
                if was_error:
                    time.sleep(CORE_INDEXER_ERROR_SLEEP_SECS)

    # indexes a core block
    # raises an exception in the case of an error
    # returns None when can't proceed due to non errors (ex: block doesn't exist yet)
    def index_core_block(self) -> Optional[BlockResponse]:
        # replace inner logger with contextual data
        next_block = self.latest_indexed_block_height + 1

        # get block from chain, set current chain height from response
        # if block height returned is -1 then block doesn't exist yet
        chain_block = self.core.get_block(height=next_block)
        self.latest_chain_block_height = chain_block.current_height
        if chain_block.height < 0:
            return None

        # set new child logger with context
        self.logger = logging.LoggerAdapter(
            logger=root_logger,
            extra={
                "indexer": "core",
                "chain_id": self.chain_id,
                "latest_indexed_block": self.latest_indexed_block_height,
                "next_indexed_block": next_block,
                "latest_chain_block": self.latest_chain_block_height,
            },
        )
        self.core.set_logger(self.logger)

        # create scoped session for indexing
        # if error is raised a rollback occurs
        # tranasction gets committed when scope is exited
        with self.db.scoped_session() as session:
            self.logger.info("indexing block")

            # TODO: parallelize?
            for tx in chain_block.transactions:
                # Check which type of transaction is currently set
                transaction_type = tx.WhichOneof("transaction")

                if transaction_type == "plays" and self.should_index_plays():
                    index_core_play(
                        logger=self.logger,
                        session=session,
                        core=self.core,
                        challenge_bus=self.challenge_bus,
                        block=chain_block,
                        tx=tx,
                    )
                    continue
                elif transaction_type == "manage_entity":
                    continue
                elif transaction_type == "validator_registration":
                    continue
                elif transaction_type == "sla_rollup":
                    continue
                else:
                    self.logger.warning(
                        f"index_core.py | unhandled tx type found {transaction_type}"
                    )

            # get block parenthash, in none case also use None
            # this would be the case in solana cutover where the previous
            # block to the cutover isn't indexed either
            parenthash: Optional[str] = None
            previous_height = chain_block.height - 1
            if previous_height > 0:
                parent_block = (
                    session.query(CoreIndexedBlocks)
                    .filter_by(height=previous_height)
                    .one_or_none()
                )
                if parent_block:
                    parenthash = parent_block.blockhash

            new_block = CoreIndexedBlocks(
                chain_id=self.chain_id,
                height=chain_block.height,
                blockhash=chain_block.blockhash,
                parenthash=parenthash,
            )
            session.add(new_block)

            return chain_block
        return None
