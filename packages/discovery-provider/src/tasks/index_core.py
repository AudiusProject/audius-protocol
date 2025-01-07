import ast
import json
import logging
import os
import signal
import threading
import time
from datetime import datetime
from logging import Logger, LoggerAdapter
from typing import List, Optional, TypedDict

from redis import Redis
from sqlalchemy import desc
from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus, setup_challenge_bus
from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.models.social.play import Play
from src.tasks.core.core_client import CoreClient, get_core_instance
from src.tasks.core.gen.protocol_pb2 import BlockResponse, SignedTransaction
from src.tasks.index_core_cutovers import (
    get_adjusted_core_block,
    get_core_cutover,
    get_core_cutover_chain_id,
    get_sol_cutover,
)
from src.utils.config import shared_config
from src.utils.redis_connection import get_redis
from src.utils.session_manager import SessionManager

root_logger = logging.getLogger(__name__)

CORE_INDEXER_MINIMUM_TIME_SECS = 1
CORE_INDEXER_ERROR_SLEEP_SECS = 5

core_health_check_cache_key = "core:indexer:health"
core_listens_health_check_cache_key = "core:indexer:health:listens"
core_em_health_check_cache_key = "core:indexer:health:em"


class CoreListensTxInfo(TypedDict):
    signature: str
    slot: int
    timestamp: int


class CoreListensTxInfoHealth(TypedDict):
    chain_tx: CoreListensTxInfo | None
    db_tx: CoreListensTxInfo


class CoreListensHealth(TypedDict):
    latest_chain_slot: int
    latest_indexed_slot: int
    slot_diff: int
    time_diff: float
    sol_slot_cutover: int
    core_block_cutover: int
    tx_info: CoreListensTxInfoHealth


class CoreHealth(TypedDict):
    indexing_plays: bool
    indexing_entity_manager: bool
    latest_chain_block: int
    latest_indexed_block: int
    chain_id: str


class PlayInfo(TypedDict):
    user_id: int | None
    play_item_id: int
    created_at: datetime
    updated_at: datetime
    source: str
    city: str
    region: str
    country: str
    slot: int
    signature: str


class PlayChallengeInfo(TypedDict):
    user_id: int
    created_at: datetime
    slot: int


class IndexingResult(TypedDict):
    indexed_sol_plays_slot: Optional[int]


class CoreIndexer:
    db: SessionManager
    redis: Redis
    challenge_bus: ChallengeEventBus
    core: CoreClient
    logger: LoggerAdapter[Logger]
    stop_event: bool

    indexer_initialized: bool
    indexer_caught_up: bool

    sol_plays_cutover_end: int
    sol_latest_processed_slot: int
    core_plays_cutover_start: int
    core_plays_cutover_chain_id: str

    chain_id: str
    latest_indexed_block_height: int
    latest_chain_block_height: int

    def __init__(self):
        database_url = shared_config["db"]["url"]
        self.db = SessionManager(
            database_url, ast.literal_eval(shared_config["db"]["engine_args_literal"])
        )
        self.redis = get_redis()
        self.challenge_bus = setup_challenge_bus()
        self.core = get_core_instance()

        self.stop_event = False

        self.indexer_initialized = False
        self.indexer_caught_up = False
        self.logger = logging.LoggerAdapter(
            logger=root_logger,
            extra={
                "indexer": "core",
            },
        )

        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)

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

        self.sol_latest_processed_slot = 0
        self.latest_indexed_block_height = 0

        # gather indexer state
        with self.db.scoped_session() as session:
            latest_indexed_block = (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == self.chain_id)
                .order_by(CoreIndexedBlocks.height.desc())
                .first()
            )
            if latest_indexed_block:
                self.latest_indexed_block_height = latest_indexed_block.height

            latest_slot_record = (
                session.query(Play)
                .filter(Play.slot != None)
                .filter(Play.signature != None)
                .order_by(desc(Play.slot))
                .first()
            )
            if latest_slot_record and latest_slot_record.slot:
                self.sol_latest_processed_slot = latest_slot_record.slot

        self.redis.delete("index_core_lock")

        self.indexer_initialized = True
        self.logger.info("initialized core indexer")

    def signal_handler(self, signal_received, frame):
        """Handles termination signals and sets the stop event."""
        self.logger.info(f"Signal {signal_received} received.")
        self.stop()

    # starts indexer in it's own thread to avoid blocking main and getting caught up in celery
    def start(self):
        # start core indexer alongside beat service, there's only one instance of beat
        audius_service = os.getenv("audius_service")
        root_logger.warning(
            f"core indexer starting with audius_service {audius_service}"
        )
        if not audius_service or audius_service != "beat":
            return

        thread = threading.Thread(target=self.index_core, daemon=True)
        thread.start()
        root_logger.warning("core indexer thread started")

    def stop(self):
        self.logger.warning("Stopping Core Indexer...")
        self.stop_event = True

    def latest_indexed_adjusted_sol_block_height(self) -> int:
        return get_adjusted_core_block(self.latest_indexed_block_height)

    # indexer will consider itself caught up if it is within 30 blocks (seconds) behind the chain
    def evaluate_indexer_caught_up(self):
        self.indexer_caught_up = (
            self.latest_indexed_block_height >= self.latest_chain_block_height - 30
        )

    def should_index_plays(self) -> bool:
        return self.sol_latest_processed_slot >= self.sol_plays_cutover_end

    def index_core(self):
        while not self.stop_event:
            was_error = False
            start_time = time.time()
            try:
                initialized = self.indexer_initialized
                if not initialized:
                    self.initialize()

                indexed_block = self.index_core_block()
                if not indexed_block:
                    continue

                self.latest_indexed_block_height = indexed_block.height
                self.update_core_listens_health(indexed_block)
                self.update_core_health()

            except Exception as e:
                was_error = True
                self.logger.error(f"error {e}")
            finally:
                # shutdown if stop event sent
                if self.stop_event:
                    self.logger.info("Shutdown signal received. Stopping indexing")
                    break

                # sleep for the rest of the minimum time threshold
                # will not sleep if indexer considers itself not caught up
                # will sleep for longer if an error was found to allow
                # async processes to recover
                # TODO: add circuit breaker pattern for errors
                elapsed_time = time.time() - start_time
                should_wait = (
                    self.indexer_caught_up
                    and elapsed_time < CORE_INDEXER_MINIMUM_TIME_SECS
                )
                if should_wait:
                    time.sleep(CORE_INDEXER_MINIMUM_TIME_SECS - elapsed_time)
                if was_error:
                    time.sleep(CORE_INDEXER_ERROR_SLEEP_SECS)
        self.logger.info("Core indexer successfully shut down")

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

        # create scoped session for indexing
        # if error is raised a rollback occurs
        # tranasction gets committed when scope is exited
        with self.db.scoped_session() as session:
            self.logger.warn("indexing block")
            indexed_slot = None

            # TODO: parallelize?
            for tx in chain_block.transactions:
                # Check which type of transaction is currently set
                transaction_type = tx.WhichOneof("transaction")

                if transaction_type == "plays":
                    indexed_slot = self.index_core_plays(
                        session=session, block=chain_block, tx=tx
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
                    .filter(CoreIndexedBlocks.chain_id == self.chain_id)
                    .filter(CoreIndexedBlocks.height == previous_height)
                    .one_or_none()
                )
                if parent_block:
                    parenthash = parent_block.blockhash

            new_block = CoreIndexedBlocks(
                chain_id=self.chain_id,
                height=chain_block.height,
                blockhash=chain_block.blockhash,
                parenthash=parenthash,
                plays_slot=indexed_slot,
            )

            exists = (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == self.chain_id)
                .filter(CoreIndexedBlocks.height == chain_block.height)
                .one_or_none()
            )
            if not exists:
                session.add(new_block)
            if exists:
                self.logger.warning(f"block {chain_block.height} already indexed")

            return chain_block
        return None

    def index_core_plays(
        self, session: Session, block: BlockResponse, tx: SignedTransaction
    ) -> Optional[int]:
        self.logger.info("indexing play")

        if not self.should_index_plays():
            return None

        latest_slot = self.sol_plays_cutover_end
        latest_slot_record = (
            session.query(Play)
            .filter(Play.slot != None)
            .filter(Play.signature != None)
            .order_by(desc(Play.slot))
            .first()
        )
        if latest_slot_record and latest_slot_record.slot:
            latest_slot = latest_slot_record.slot
        # TODO: make association table?
        # next slot just increments from previous since we're on core now
        next_slot = latest_slot + 1

        plays: List[PlayInfo] = []
        challenge_bus_events: List[PlayChallengeInfo] = []

        tx_plays = tx.plays

        for tx_play in tx_plays.plays:
            user_id = None
            try:
                user_id = int(tx_play.user_id)
            except ValueError:
                log = ("Recording anonymous listen {!r}".format(tx_play.user_id),)
                self.logger.debug(
                    log,
                    exc_info=False,
                )

            signature = tx_play.signature
            timestamp = tx_play.timestamp.ToDatetime()
            track_id = int(tx_play.track_id)
            user_id = user_id
            slot = next_slot
            city = tx_play.city
            region = tx_play.region
            country = tx_play.country

            plays.append(
                {
                    "user_id": user_id,
                    "play_item_id": track_id,
                    "updated_at": datetime.now(),
                    "slot": slot,
                    "signature": signature,
                    "created_at": timestamp,
                    "source": "relay",
                    "city": city,
                    "region": region,
                    "country": country,
                }
            )

            # Only enqueue a challenge event if it's *not*
            # an anonymous listen
            if user_id is not None:
                challenge_bus_events.append(
                    {
                        "slot": slot,
                        "user_id": user_id,
                        "created_at": timestamp,
                    }
                )

        if not plays:
            return None

        session.execute(Play.__table__.insert().values(plays))
        self.logger.debug("index_core_plays.py | Dispatching listen events")
        listen_dispatch_start = time.time()
        for event in challenge_bus_events:
            self.challenge_bus.dispatch(
                ChallengeEvent.track_listen,
                event["slot"],
                event["created_at"],
                event["user_id"],
                {"created_at": event.get("created_at")},
            )
        listen_dispatch_end = time.time()
        listen_dispatch_diff = listen_dispatch_end - listen_dispatch_start
        self.logger.debug(
            f"index_core_plays.py | Dispatched listen events in {listen_dispatch_diff}"
        )

        return slot

    # dresses up the core health to look like the solana plays endpoint
    def update_core_listens_health(self, latest_indexed_block: BlockResponse):
        latest_indexed_slot = self.latest_indexed_block_height
        latest_chain_slot = self.latest_chain_block_height

        slot_diff = latest_chain_slot - latest_indexed_slot
        time_diff = (
            datetime.utcnow() - latest_indexed_block.timestamp.ToDatetime()
        ).total_seconds()

        health: CoreListensHealth = {
            "slot_diff": slot_diff,
            "time_diff": time_diff,
            "latest_chain_slot": self.latest_chain_block_height,
            "latest_indexed_slot": self.latest_indexed_block_height,
            "tx_info": {
                "chain_tx": None,
                "db_tx": {
                    "signature": "",
                    "slot": self.latest_indexed_block_height,
                    "timestamp": latest_indexed_block.timestamp.ToSeconds(),
                },
            },
            "core_block_cutover": self.core_plays_cutover_start,
            "sol_slot_cutover": self.sol_plays_cutover_end,
        }
        self.redis.set(core_listens_health_check_cache_key, json.dumps(health))

    def update_core_health(self):
        health: CoreHealth = {
            "chain_id": self.chain_id,
            "indexing_entity_manager": False,
            "indexing_plays": self.should_index_plays(),
            "latest_chain_block": self.latest_chain_block_height,
            "latest_indexed_block": self.latest_indexed_block_height,
        }
        self.redis.set(core_health_check_cache_key, json.dumps(health))
