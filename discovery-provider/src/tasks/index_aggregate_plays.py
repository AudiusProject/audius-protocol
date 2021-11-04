import logging
import time
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)


def update(self, db):
    with db.scoped_session() as session:
        start_time = time.time()
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate_plays")

    logger.info(
        f"index_aggregate_plays.py | Finished updating in: {time.time() - start_time} sec."
    )


######## CELERY TASKS ########
@celery.task(name="update_aggregate_plays", bind=True)
def update_aggregate_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_aggregate_plays.db
    redis = update_aggregate_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_aggregate_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update(self, db)
        else:
            logger.info(
                "index_aggregate_plays.py | Failed to acquire update_aggregate_plays"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_plays.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
