import logging
import time
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(name="vacuum_db", bind=True)
def vacuum_db(self):
    """Vacuum the db"""

    db = vacuum_db.db
    redis = vacuum_db.redis

    have_lock = False
    update_lock = redis.lock("vacuum_db", timeout=3600)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            with db.scoped_session() as session:
                session.execute("VACUUM FULL")
        else:
            logger.info("vacuum_db.py | Failed to acquire lock")
    except Exception as e:
        logger.error("vacuum_db.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
