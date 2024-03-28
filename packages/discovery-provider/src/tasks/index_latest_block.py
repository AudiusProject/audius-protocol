import datetime
import logging
import time

from src.tasks.celery_app import celery
from src.utils import helpers, web3_provider
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import (
    latest_block_hash_redis_key,
    latest_block_redis_key,
)

web3 = web3_provider.get_web3()

logger = logging.getLogger(__name__)


def update_latest_block_redis(final_poa_block):
    latest_block_from_chain = web3.eth.get_block("latest", True)
    default_indexing_interval_seconds = int(
        update_task.shared_config["discprov"]["block_processing_interval_sec"]
    )
    redis = update_task.redis
    # these keys have a TTL which is the indexing interval
    redis.set(
        latest_block_redis_key,
        latest_block_from_chain.number + (final_poa_block or 0),
        ex=default_indexing_interval_seconds,
    )
    redis.set(
        latest_block_hash_redis_key,
        latest_block_from_chain.hash.hex(),
        ex=default_indexing_interval_seconds,
    )


@celery.task(name="index_latest_block", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_task(self):
    redis = update_task.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_latest_block_lock", timeout=60 * 10)
    interval = datetime.timedelta(seconds=30)
    interval = datetime.timedelta(seconds=5)
    start_time = time.time()
    errored = False
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            final_poa_block = helpers.get_final_poa_block()
            update_latest_block_redis(final_poa_block)
        else:
            logger.info(
                "index_latest_block.py | Failed to acquire index_latest_block_lock"
            )
    except Exception as e:
        logger.error(f"{self.name}.py | Fatal error in main loop", exc_info=True)
        errored = True
        raise e
    finally:
        end_time = time.time()
        elapsed = end_time - start_time
        time_left = max(0, interval.total_seconds() - elapsed)
        logger.info(
            {
                "task_name": self.name,
                "elapsed": elapsed,
                "interval": interval.total_seconds(),
                "time_left": time_left,
                "errored": errored,
            },
        )
        if have_lock:
            update_lock.release()
        celery.send_task(self.name, countdown=time_left)
