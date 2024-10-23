import logging
from typing import Optional

from src.tasks.celery_app import celery
from src.tasks.core.block_iterator import CoreBlockIterator

logger = logging.getLogger(__name__)

block_iterator: Optional[CoreBlockIterator] = None


def index_core_plays():
    return


def index_core_manage_entities():
    return


def index_core_transactions(txs):
    for tx in txs:
        if tx.HasField("plays"):
            logger.info("index_core_blocks.py | got plays tx")
        elif tx.HasField("manage_entity"):
            logger.info("index_core_blocks.py | got manage entity tx")
        elif tx.HasField("sla_rollup"):
            logger.info("index_core_blocks.py | got sla rollup tx")
        else:
            logger.warning("got unimplemented tx")


@celery.task(name="index_core_blocks", bind=True)
def index_core_blocks(self):
    global block_iterator

    redis = index_core_blocks.redis
    db = index_core_blocks.db

    update_lock = redis.lock("index_core_blocks", blocking_timeout=25, timeout=600)
    have_lock = update_lock.acquire(blocking=False)
    if not have_lock:
        logger.disable()
        return

    try:
        if not block_iterator:
            block_iterator = CoreBlockIterator(db=db)

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
        update_lock.release()
        celery.send_task("index_core_blocks")
