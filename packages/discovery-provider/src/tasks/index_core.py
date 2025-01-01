import logging
import threading
import time
from typing import Optional

from redis import Redis
from sqlalchemy.orm.session import Session

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.tasks.core.core_client import CoreClient, get_core_instance
from src.tasks.core.gen.protocol_pb2 import BlockResponse
from src.tasks.index_core_cutovers import (
    get_adjusted_core_block,
    get_core_cutover,
    get_core_cutover_chain_id,
    get_sol_cutover,
)
from src.tasks.index_core_manage_entities import index_core_manage_entity
from src.tasks.index_core_plays import index_core_play
from src.tasks.index_solana_plays import get_latest_slot
from src.utils.session_manager import SessionManager

root_logger = logging.getLogger(__name__)

CORE_INDEXER_MINIMUM_TIME_SECS = 1

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
        self.core = get_core_instance(db=db)
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
            latest_indexed_block = self.core.latest_indexed_block(
                session=session, chain_id=self.chain_id
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
            update_lock = self.redis.lock("index_core_lock")
            start_time = time.time()
            try:
                have_lock = update_lock.acquire(blocking=False)
                if not have_lock:
                    self.logger.info("failed to aquire lock")
                    continue

                initialized = self.indexer_initialized
                if not initialized:
                    self.initialize()

                indexed_block = self.index_core_block()
                if not indexed_block:
                    continue

                self.latest_indexed_block_height = indexed_block.height
            except Exception as e:
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

    def index_core_block(self) -> Optional[BlockResponse]:
        # TODO: return current_height with get_block grpc so we don't
        # need to make two calls for this
        node_info = self.core.get_node_info()
        if node_info:
            self.latest_chain_block_height = node_info.current_height

        # replace inner logger with contextual data
        next_block = self.latest_indexed_block_height + 1

        if next_block > self.latest_chain_block_height:
            return None

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

        with self.db.scoped_session() as session:
            _, previous_indexed_block = self.core.get_block(
                session=session, height=next_block - 1
            )

            block, indexed_block = self.core.get_block(
                session=session, height=next_block
            )
            if not block:
                self.logger.info("could not get block")
                return None

            if indexed_block:
                self.logger.info("block already indexed")
                return None

            if block.height < 0:
                return None

            self.logger.info("indexing block")

            self._index_core_txs(
                session=session,
                block=block,
            )

            # if first block there's no parent hash
            parenthash = (
                previous_indexed_block.blockhash if previous_indexed_block else None
            )

            # commit block after indexing
            if self.core.commit_indexed_block(
                session=session,
                chain_id=self.chain_id,
                height=block.height,
                blockhash=block.blockhash,
                parenthash=parenthash,
            ):
                return block
            return None

    def _index_core_txs(
        self,
        session: Session,
        block: BlockResponse,
    ):
        # TODO: parallelize?
        for tx in block.transactions:
            # Check which type of transaction is currently set
            transaction_type = tx.WhichOneof("transaction")
            self.logger

            if transaction_type == "plays" and self.should_index_plays():
                index_core_play(
                    session=session,
                    core=self.core,
                    challenge_bus=self.challenge_bus,
                    block=block,
                    tx=tx,
                )
                continue
            elif transaction_type == "manage_entity":
                index_core_manage_entity(session=session, core=self.core, tx=tx)
                continue
            elif transaction_type == "validator_registration":
                continue
            elif transaction_type == "sla_rollup":
                continue
            else:
                root_logger.warning(
                    f"index_core.py | unhandled tx type found {transaction_type}"
                )
