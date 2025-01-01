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

    # checks all the connections and gathers base values so the indexer can proceed
    def initialize(self):
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

        self.indexer_caught_up
        self.indexer_initialized = True

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
            start_time = time.time()
            try:
                initialized = self.indexer_initialized
                if not initialized:
                    self.initialize()

            except Exception as e:
                root_logger.error(f"core indexer error {e}")
            finally:
                elapsed_time = time.time() - start_time
                should_wait = (
                    self.indexer_caught_up
                    and elapsed_time < CORE_INDEXER_MINIMUM_TIME_SECS
                )
                if should_wait:
                    time.sleep(CORE_INDEXER_MINIMUM_TIME_SECS - elapsed_time)

    def index_core_block(self):
        node_info = self.core.get_node_info()


def start_core_indexer(db: SessionManager, redis: Redis, core: CoreClient):
    thread = threading.Thread(target=index_core, args=(db, redis, core), daemon=True)
    thread.start()
    root_logger.info("core indexer thread started")


def _index_core_txs(
    session: Session,
    core: CoreClient,
    challenge_bus: ChallengeEventBus,
    block: BlockResponse,
    should_index_plays: bool,
):
    # TODO: parallelize?
    for tx in block.transactions:
        # Check which type of transaction is currently set
        transaction_type = tx.WhichOneof("transaction")
        root_logger.info(
            f"index_core.py | block {block.height} tx type {transaction_type} {should_index_plays}"
        )

        if transaction_type == "plays" and should_index_plays:
            index_core_play(
                session=session,
                core=core,
                challenge_bus=challenge_bus,
                block=block,
                tx=tx,
            )
            continue
        elif transaction_type == "manage_entity":
            index_core_manage_entity(session=session, core=core, tx=tx)
            continue
        elif transaction_type == "validator_registration":
            continue
        elif transaction_type == "sla_rollup":
            continue
        else:
            root_logger.warning(
                f"index_core.py | unhandled tx type found {transaction_type}"
            )


def _index_core_block(
    logger: logging.Logger, db: SessionManager, redis: Redis, core: CoreClient
) -> Optional[BlockResponse]:
    core = get_core_instance(db)
    latest_processed_slot = get_latest_slot(db)

    logger.info(
        f"index_core.py | latest slot {latest_processed_slot} cutover {get_sol_cutover()}"
    )

    should_index_plays = False
    if latest_processed_slot >= get_sol_cutover():
        should_index_plays = True

    # TODO: cache node info
    node_info = core.get_node_info()
    if not node_info:
        return None

    chainid = node_info.chainid
    current_block = node_info.current_height
    if current_block < get_core_cutover():
        return None

    with db.scoped_session() as session:
        latest_indexed_block = core.latest_indexed_block(
            session=session, chain_id=chainid
        )

        # if no blocks indexed on this chain id, start at 1
        next_block = 1
        if latest_indexed_block:
            next_block = latest_indexed_block.height + 1

        block, indexed_block = core.get_block(session=session, height=next_block)
        if not block:
            logger.error(f"index_core.py | could not get block {next_block} {chainid}")
            return None

        if indexed_block:
            return None

        # core returns -1 for block that doesn't exist
        if block.height < 0:
            return None

        challenge_bus: ChallengeEventBus = index_core.challenge_event_bus
        _index_core_txs(
            session=session,
            core=core,
            challenge_bus=challenge_bus,
            block=block,
            should_index_plays=should_index_plays,
        )
        # if first block there's no parent hash
        parenthash = latest_indexed_block.blockhash if latest_indexed_block else None

        # commit block after indexing
        if core.commit_indexed_block(
            session=session,
            chain_id=chainid,
            height=block.height,
            blockhash=block.blockhash,
            parenthash=parenthash,
        ):
            return block
        return None


# TODO: make this into a class so all the args become methods
def index_core(db: SessionManager, redis: Redis, core: CoreClient):
    try:
        node_info = core.get_node_info()
        if not node_info:
            return

        block_logger = logging.LoggerAdapter(
            logger=root_logger,
            extra={
                "height": node_info.current_height,
                "chain_id": node_info.chainid,
            },
        )
        indexed_block = _index_core_block(block_logger, db=db, redis=redis, core=core)
        if indexed_block:
            root_logger.debug(f"index_core.py | indexed block {indexed_block.height}")
    except Exception as e:
        root_logger.error(
            "index_core.py | Fatal error in main loop of index_core: %s",
            e,
            exc_info=True,
        )
