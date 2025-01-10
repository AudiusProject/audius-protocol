import json
import logging
from datetime import datetime
from typing import Optional, TypedDict, cast

from redis import Redis
from sqlalchemy import desc

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.core.core_indexed_blocks import CoreIndexedBlocks
from src.models.social.play import Play
from src.tasks.celery_app import celery
from src.tasks.core.core_client import CoreClient, get_core_instance
from src.tasks.core.gen.protocol_pb2 import BlockResponse
from src.tasks.index_core_cutovers import (
    get_core_cutover,
    get_core_cutover_chain_id,
    get_sol_cutover,
)
from src.tasks.index_core_plays import index_core_plays
from src.utils.session_manager import SessionManager

root_logger = logging.getLogger(__name__)

index_core_lock_key = "index_core_lock"

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


class IndexingResult(TypedDict):
    indexed_sol_plays_slot: Optional[int]


# dresses up the core health to look like the solana plays endpoint
def update_core_listens_health(
    redis: Redis,
    latest_indexed_block: BlockResponse,
    core_plays_cutover: int,
    sol_plays_cutover: int,
):
    latest_indexed_slot = latest_indexed_block.height
    latest_chain_slot = latest_indexed_block.current_height

    slot_diff = latest_chain_slot - latest_indexed_slot
    time_diff = (
        datetime.utcnow() - latest_indexed_block.timestamp.ToDatetime()
    ).total_seconds()

    health: CoreListensHealth = {
        "slot_diff": slot_diff,
        "time_diff": time_diff,
        "latest_chain_slot": latest_chain_slot,
        "latest_indexed_slot": latest_indexed_slot,
        "tx_info": {
            "chain_tx": None,
            "db_tx": {
                "signature": "",
                "slot": latest_indexed_slot,
                "timestamp": latest_indexed_block.timestamp.ToSeconds(),
            },
        },
        "core_block_cutover": core_plays_cutover,
        "sol_slot_cutover": sol_plays_cutover,
    }
    redis.set(core_listens_health_check_cache_key, json.dumps(health))


def update_core_health(
    redis: Redis, latest_indexed_block: BlockResponse, indexing_plays: bool
):
    health: CoreHealth = {
        "chain_id": latest_indexed_block.chainid,
        "indexing_entity_manager": False,
        "indexing_plays": indexing_plays,
        "latest_chain_block": latest_indexed_block.current_height,
        "latest_indexed_block": latest_indexed_block.height,
    }
    redis.set(core_health_check_cache_key, json.dumps(health))


@celery.task(name="index_core", bind=True)
def index_core(self):
    redis: Redis = index_core.redis
    db: SessionManager = index_core.db
    challenge_bus: ChallengeEventBus = index_core.challenge_event_bus

    update_lock = redis.lock(index_core_lock_key, blocking_timeout=25, timeout=600)
    have_lock = False

    try:
        have_lock = update_lock.acquire(blocking=False)

        if not have_lock:
            return

        core: CoreClient = get_core_instance()

        # state that gets populated as indexing job goes on
        # used for updating health check and other things
        indexing_plays = False
        core_plays_cutover = 0
        sol_plays_cutover = 0
        block_indexed: Optional[BlockResponse] = None

        # execute all of indexing in one db session
        with db.scoped_session() as session:
            # gather initialization data for indexer
            # TODO: cache this across celery messages
            sol_plays_cutover = get_sol_cutover()
            core_plays_cutover = get_core_cutover()
            core_plays_cutover_chain_id = get_core_cutover_chain_id()

            core_node_info = core.get_node_info()

            latest_core_block_height = core_node_info.current_height
            core_chain_id = core_node_info.chainid

            latest_indexed_block: Optional[CoreIndexedBlocks] = (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == core_chain_id)
                .order_by(CoreIndexedBlocks.height.desc())
                .first()
            )

            latest_indexed_block_height: int = 0
            if latest_indexed_block and latest_indexed_block.height:
                latest_indexed_block_height = cast(int, latest_indexed_block.height)

            latest_slot_record: Play = (
                session.query(Play)
                .filter(Play.slot != None)
                .filter(Play.signature != None)
                .order_by(desc(Play.slot))
                .first()
            )

            latest_indexed_slot = 0
            if latest_slot_record and latest_slot_record.slot:
                latest_indexed_slot = cast(int, latest_slot_record.slot)

            # do some checks to see if we should be indexing or not
            on_cutover_chain = core_plays_cutover_chain_id == core_chain_id
            past_core_plays_cutover = latest_core_block_height >= core_plays_cutover
            if on_cutover_chain and not past_core_plays_cutover:
                return

            past_sol_plays_cutover = sol_plays_cutover <= latest_indexed_slot
            if not past_sol_plays_cutover:
                return

            indexing_plays = past_sol_plays_cutover and past_core_plays_cutover

            next_block = latest_indexed_block_height + 1

            logger = logging.LoggerAdapter(
                logger=root_logger,
                extra={
                    "indexer": "core",
                    "chain_id": core_chain_id,
                    "latest_indexed_block": latest_indexed_block_height,
                    "next_indexed_block": next_block,
                    "latest_chain_block": latest_core_block_height,
                },
            )

            logger.debug("indexing block")

            block = core.get_block(next_block)
            if not block:
                return

            if block.height < 0:
                return

            if block.chainid != core_chain_id:
                logger.warning(
                    f"mismatched chain id {block.chainid} given for block but indexing chain {core_chain_id}"
                )
                return

            indexed_slot: Optional[int] = None

            for tx in block.transactions:
                transaction_type = tx.WhichOneof("transaction")
                if transaction_type == "plays":
                    if indexing_plays:
                        indexed_slot = index_core_plays(
                            logger=logger,
                            session=session,
                            challenge_bus=challenge_bus,
                            latest_indexed_slot=latest_indexed_slot,
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
                    logger.warning(
                        f"index_core.py | unhandled tx type found {transaction_type}"
                    )

            # get block parenthash, in none case also use None
            # this would be the case in solana cutover where the previous
            # block to the cutover isn't indexed either
            parenthash: Optional[str] = None
            previous_height = block.height - 1
            if previous_height > 0:
                parent_block = (
                    session.query(CoreIndexedBlocks)
                    .filter(CoreIndexedBlocks.chain_id == core_chain_id)
                    .filter(CoreIndexedBlocks.height == previous_height)
                    .one_or_none()
                )
                if parent_block:
                    parenthash = parent_block.blockhash

            new_block = CoreIndexedBlocks(
                chain_id=core_chain_id,
                height=block.height,
                blockhash=block.blockhash,
                parenthash=parenthash,
                plays_slot=indexed_slot,
            )

            exists = (
                session.query(CoreIndexedBlocks)
                .filter(CoreIndexedBlocks.chain_id == core_chain_id)
                .filter(CoreIndexedBlocks.height == block.height)
                .one_or_none()
            )
            if not exists:
                session.add(new_block)
            if exists:
                logger.warning(f"block {block.height} already indexed")

            block_indexed = block

        # after session has been committed, update health checks and other things
        if block_indexed:
            update_core_health(
                redis=redis,
                latest_indexed_block=block_indexed,
                indexing_plays=indexing_plays,
            )
            update_core_listens_health(
                redis=redis,
                latest_indexed_block=block_indexed,
                core_plays_cutover=core_plays_cutover,
                sol_plays_cutover=sol_plays_cutover,
            )

    except Exception as e:
        root_logger.error(f"Error in indexing core blocks {e}", exc_info=True)
    finally:
        # don't queue up new message or release lock if never had lock
        if not have_lock:
            return

        if have_lock:
            update_lock.release()
        if not block_indexed:
            celery.send_task("index_core", countdown=0.5, queue="index_sol")
        else:
            celery.send_task("index_core", queue="index_sol")
