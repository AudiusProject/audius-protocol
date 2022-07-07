import logging
from inspect import currentframe
from time import time
from typing import Any, Callable, Optional

from redis import Redis
from sqlalchemy import text
from sqlalchemy.orm.session import Session
from src.models.indexing.block import Block
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    PrometheusRegistry,
)
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)


def init_task_and_acquire_lock(
    logger,
    db,
    redis,
    table_name,
    aggregate_func: Callable[[Session, Redis], Any],
    timeout=60 * 10,
    blocking_timeout=None,
    lock_name=None,
):

    current_frame = currentframe()
    # get name of the caller function
    task_name = (
        current_frame.f_back.f_code.co_name
        if current_frame is not None and current_frame.f_back is not None
        else "unknown"
    )

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    if not lock_name:
        lock_name = f"update_aggregate_table:{table_name}"
    update_lock = redis.lock(
        lock_name, timeout=timeout, blocking_timeout=blocking_timeout
    )
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time()

            with db.scoped_session() as session:
                aggregate_func(session, redis)

            logger.info(
                f"{task_name} | Finished updating \
                {table_name} in: {time()-start_time} sec"
            )
        else:
            logger.info(f"{task_name} | Failed to acquire {lock_name}")
    except Exception as e:
        logger.error(f"{task_name} | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()


def update_aggregate_table(
    logger,
    session,
    table_name,
    query,
    checkpoint_name,
    current_checkpoint,
):
    metric = PrometheusMetric(
        PrometheusRegistry[PrometheusMetricNames.UPDATE_AGGREGATE_TABLE_LATENCY_SECONDS]
    )

    # get name of the caller function
    task_name = f"{currentframe().f_back.f_code.co_name}()"

    # get the last updated id that counted towards the current aggregate track
    prev_checkpoint = get_last_indexed_checkpoint(session, table_name)
    if not current_checkpoint or current_checkpoint == prev_checkpoint:
        logger.info(
            f"{task_name} | Skipping aggregation update because there are no new blocks"
            f" | checkpoint: ({prev_checkpoint}, {current_checkpoint}]"
        )
        return

    # update aggregate track with new tracks that came after the prev_checkpoint
    logger.info(
        f"{task_name} | Updating {table_name}"
        f" | checkpoint: ({prev_checkpoint}, {current_checkpoint}]"
    )

    session.execute(
        text(query),
        {
            f"prev_{checkpoint_name}": prev_checkpoint,
            f"current_{checkpoint_name}": current_checkpoint,
        },
    )

    metric.save_time({"table_name": table_name, "task_name": task_name})

    # update indexing_checkpoints with the new id
    save_indexed_checkpoint(session, table_name, current_checkpoint)


def get_latest_blocknumber(session: Session) -> Optional[int]:
    db_block_query = (
        session.query(Block.number).filter(Block.is_current == True).first()
    )
    if db_block_query is None:
        logger.error("Unable to get latest block number")
        return None
    return db_block_query[0]
