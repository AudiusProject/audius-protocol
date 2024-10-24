import logging
from collections import defaultdict
from typing import Optional

from src.tasks.celery_app import celery
from src.tasks.core.block_iterator import CoreBlockIterator
from src.tasks.entity_manager.entity_manager import (
    fetch_entities,
    fetch_existing_entities,
)

logger = logging.getLogger(__name__)


def index_core_plays(play_txs):
    for play in play_txs:
        logger.info(
            f"User ID: {play.user_id}, Track ID: {play.track_id}, Timestamp: {play.timestamp}, Signature: {play.signature}"
        )
    return


def index_core_manage_entities(manage_entity_tx):
    """Mimics the manage entity logic by converting core ManageEntityLegacy's into
    indexable tasks then running through the same code.
    """
    logger.info(f"index_core_blocks.py | manage entity {manage_entity_tx}")

    # entities_to_fetch = fetch_entities(
    #     entities_to_fetch=defaultdict(set),
    # )
    return


def index_core_transactions(txs):
    for tx in txs:
        logger.info(f"index_core_blocks.py | tx {tx}")
        oneof_field = tx.WhichOneof("transaction")
        logger.info(f"index_core_blocks.py | tx Transaction field set: {oneof_field}")
        if tx.HasField("plays"):
            logger.info("index_core_blocks.py | got plays tx")
        elif tx.HasField("manage_entity"):
            logger.info("index_core_blocks.py | got manage entity tx")
            index_core_manage_entities(tx)
        elif tx.HasField("sla_rollup"):
            logger.info("index_core_blocks.py | got sla rollup tx")
        else:
            logger.warning("got unimplemented tx")


@celery.task(name="index_core_blocks", bind=True)
def index_core_blocks(self):
    redis = index_core_blocks.redis
    db = index_core_blocks.db
    block_iterator = CoreBlockIterator(db=db)

    try:
        update_lock = redis.lock("index_core_blocks", blocking_timeout=25, timeout=600)
        have_lock = update_lock.acquire(blocking=False)
        if not have_lock:
            return

        block = block_iterator.next_block()

        block_hash = block.blockhash
        chainid = block.chainid
        proposer = block.proposer
        height = block.height
        transactions = block.transactions

        if height < 0:
            return

        logger.info(
            f"index_core_blocks.py | saw block {height} from {proposer} on chain {chainid} {block_hash}"
        )

        # create db session here?
        index_core_transactions(txs=transactions)
        block_iterator.commit_block(block_num=height)

    except Exception as e:
        logger.error(
            "index_core_blocks.py | error indexing core blocks: %s", e, exc_info=True
        )
    finally:
        if update_lock.locked():
            update_lock.release()
        else:
            logger.warning(
                "index_core_blocks.py | Tried to release a lock we don't hold."
            )

        celery.send_task("index_core_blocks")
