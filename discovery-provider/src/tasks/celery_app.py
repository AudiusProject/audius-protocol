from __future__ import absolute_import

from inspect import currentframe
from time import time

from celery import Celery
from sqlalchemy import text
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

# Create the celery application
# Invoked by worker.py
celery = Celery(__name__)

# Celery removes all configured loggers. This setting prevents
# Celery from overriding the configured logger set in create_celery()
celery.conf.update({"worker_hijack_root_logger": False})


def celery_worker(logger, db, redis, table_name, aggregate_func):
    # get name of the caller function
    worker_name = currentframe().f_back.f_code.co_name

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    lock_name = f"index_{table_name}_lock"
    update_lock = redis.lock(lock_name, timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time()

            with db.scoped_session() as session:
                aggregate_func(session)

            logger.info(
                f"{worker_name} | Finished updating \
                {table_name} in: {time()-start_time} sec"
            )
        else:
            logger.info(f"{worker_name} | Failed to acquire {lock_name}")
    except Exception as e:
        logger.error(f"{worker_name} | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()


def aggregate_worker(
    logger, session, table_name, query, checkpoint_name, current_checkpoint
):
    # get name of the caller function
    worker_name = f"{currentframe().f_back.f_code.co_name}()"

    # get the last updated id that counted towards the current aggregate track
    prev_checkpoint = get_last_indexed_checkpoint(session, table_name)

    if not current_checkpoint or current_checkpoint == prev_checkpoint:
        logger.info(f"{worker_name} | Skip update because there are no new blocks")
        return

    # update aggregate track with new tracks that came after the prev_checkpoint
    logger.info(f"{worker_name} | Updating {table_name} | checkpoint: ({prev_checkpoint}, {current_checkpoint}]")

    session.execute(
        text(query),
        {
            f"prev_{checkpoint_name}": prev_checkpoint,
            f"current_{checkpoint_name}": current_checkpoint,
        },
    )

    # update indexing_checkpoints with the new id
    save_indexed_checkpoint(session, table_name, current_checkpoint)
