import logging
import time

from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import challenges_last_processed_event_redis_key

logger = logging.getLogger(__name__)
index_challenges_last_event_key = ""


def index_challenges(event_bus, db, redis, num_iterations=1000):
    with db.scoped_session() as session:
        for i in range(num_iterations):
            num_processed = event_bus.process_events(session)
            if num_processed:
                redis.set(challenges_last_processed_event_redis_key, int(time.time()))


@celery.task(name="index_challenges", bind=True, rate_limit="5/s")
@save_duration_metric(metric_group="celery_task")
def index_challenges_task(self):
    db = index_challenges_task.db
    redis = index_challenges_task.redis
    event_bus = index_challenges_task.challenge_event_bus
    have_lock = False
    update_lock = redis.lock("index_challenges_lock", timeout=7200)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if not have_lock:
            logger.debug(
                "index_challenges.py | Failed to acquire index challenges lock"
            )
            return

        index_challenges(event_bus, db, redis)

    except Exception as e:
        logger.error("index_challenges.py | Fatal error in main loop", exc_info=True)
        raise e

    finally:
        if not have_lock:
            return

        if have_lock:
            update_lock.release()

        celery.send_task("index_challenges", queue="index_challenges")
