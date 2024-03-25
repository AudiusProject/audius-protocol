import datetime
import logging
import time

from src.monitors import monitor_names
from src.monitors.monitors import MONITORS, get_monitor_redis_key
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)


def refresh(redis, db, monitor):
    """
    Refreshes the cached value for a monitor

    Args:
        redis: Singleton redis instance
        db: Singleton database instance
        monitor: dict The monitor dictionary qwith name, func, ttl, and type
    """
    key = get_monitor_redis_key(monitor)
    ttl_key = f"{key}:ttl"

    is_fresh = redis.get(ttl_key)
    if is_fresh:
        return

    # Invoke the monitor function with kwargs for db and redis.
    # This allows any monitor to access the db and/or redis connection.
    value = monitor[monitor_names.func](db=db, redis=redis)
    logger.info(
        f"monitoring_queue.py | Computed value for {monitor[monitor_names.name]}"
    )

    redis.set(key, value)

    if "ttl" in monitor:
        # Set a TTL (in seconds) key to track when this value needs refreshing.
        # We store a separate TTL key rather than expiring the value itself
        # so that in the case of an error, the current value can still be read
        redis.set(ttl_key, 1, monitor["ttl"])


@celery.task(name="monitoring_queue", bind=True)
@save_duration_metric(metric_group="celery_task")
def monitoring_queue_task(self):
    """
    A persistent cron-style queue that periodically monitors various
    health metrics and caches values in redis.

    The queue runs every minute on cron, but individual monitors establish
    their own freshness/refresh rate to operate on.
        1. The queue spins up and for each monitor checks to see if it needs a refresh
        2. Refreshes the value and stores the update in redis
    """
    db = monitoring_queue_task.db
    redis = monitoring_queue_task.redis

    interval = datetime.timedelta(seconds=60)
    start_time = time.time()
    errored = False

    try:
        start_time = time.time()

        for monitor in MONITORS.values():
            try:
                refresh(redis, db, monitor)
            except Exception as e:
                logger.warning(
                    f"monitoring_queue.py | Error computing {monitor['name']} {e}"
                )

        end_time = time.time()
        logger.info(
            f"monitoring_queue.py | Finished monitoring_queue in {end_time - start_time} seconds"
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
        celery.send_task(self.name, countdown=time_left)
