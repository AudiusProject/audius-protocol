import logging
from typing import Optional

from src.tasks.celery_app import celery
from src.tasks.core.block_iterator import CoreBlockIterator

logger = logging.getLogger(__name__)

block_iterator: Optional[CoreBlockIterator] = None


@celery.task(name="index_core_blocks", bind=True)
def index_core_blocks(self):
    logger.info("index_core_blocks.py | starting index core blocks")
    global block_iterator

    redis = index_core_blocks.redis
    db = index_core_blocks.db

    update_lock = redis.lock("index_core_blocks", blocking_timeout=25, timeout=600)
    have_lock = update_lock.acquire(blocking=False)
    if not have_lock:
        logger.disable()
        return

    try:
        logger.info("index_core_blocks.py | indexing core blocks")
        if not block_iterator:
            block_iterator = CoreBlockIterator(db=db)

        block_iterator.next_block()

    except Exception as e:
        logger.error(
            "index_core_blocks.py | error indexing core blocks: %s", e, exc_info=True
        )
    finally:
        update_lock.release()
        celery.send_task("index_core_blocks")
