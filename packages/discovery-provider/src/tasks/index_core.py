import logging
import time
from typing import Optional

from sqlalchemy.orm.session import Session

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.tasks.celery_app import celery
from src.tasks.core.core_client import CoreClient, get_core_instance
from src.tasks.core.gen.protocol_pb2 import BlockResponse
from src.tasks.index_core_cutovers import get_core_cutover, get_sol_cutover
from src.tasks.index_core_manage_entities import index_core_manage_entity
from src.tasks.index_core_plays import index_core_play
from src.tasks.index_solana_plays import get_latest_slot
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

CORE_INDEXER_MINIMUM_TIME_SECS = 1


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
        logger.info(
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
            logger.warning(
                f"index_core.py | unhandled tx type found {transaction_type}"
            )


def _index_core(db: SessionManager) -> Optional[BlockResponse]:
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


@celery.task(name="index_core", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_core(self):
    db = index_core.db
    redis = index_core.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("index_core_lock")

    start_time = time.time()
    try:
        # Attempt to acquire lock
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            indexed_block = _index_core(db)
            if indexed_block:
                logger.debug(f"index_core.py | indexed block {indexed_block.height}")
        else:
            logger.error(
                f"index_core.py | {self.request.id} | \
                    Failed to acquire index_core_lock"
            )
    except Exception as e:
        logger.error(
            "index_core.py | Fatal error in main loop of index_core: %s",
            e,
            exc_info=True,
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
        elapsed_time = time.time() - start_time
        if elapsed_time < CORE_INDEXER_MINIMUM_TIME_SECS:
            time.sleep(CORE_INDEXER_MINIMUM_TIME_SECS - elapsed_time)
        celery.send_task("index_core", queue="index_sol")
