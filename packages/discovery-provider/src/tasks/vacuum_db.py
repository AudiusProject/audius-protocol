import datetime
import logging
import time

from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)


@celery.task(name="vacuum_db", bind=True)
@save_duration_metric(metric_group="celery_task")
def vacuum_db(self):
    """Vacuum the db"""

    db = vacuum_db.db
    redis = vacuum_db.redis

    have_lock = False
    update_lock = redis.lock("vacuum_db", timeout=3600)

    interval = datetime.timedelta(days=1)
    start_time = time.time()
    errored = False
    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            engine = db._engine
            with engine.connect().execution_options(
                isolation_level="AUTOCOMMIT"
            ) as connection:
                connection.execute("VACUUM ANALYZE")
        else:
            logger.info("vacuum_db.py | Failed to acquire lock")
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
