import logging
import time
from src.monitors import monitor_names
from src.monitors.monitors import MONITORS, get_monitor_redis_key
from src.tasks.celery_app import celery

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
        f"monitoring_queue.py | Computed value for {monitor[monitor_names.name]} {value}"
    )

    redis.set(key, value)

    if "ttl" in monitor:
        # Set a TTL (in seconds) key to track when this value needs refreshing.
        # We store a separate TTL key rather than expiring the value itself
        # so that in the case of an error, the current value can still be read
        redis.set(ttl_key, 1, monitor["ttl"])


@celery.task(name="monitoring_queue", bind=True)
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

    have_lock = False
    update_lock = redis.lock("monitoring_queue_lock", timeout=2000)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
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
        else:
            logger.info("monitoring_queue.py | Failed to acquire lock")
    except Exception as e:
        logger.error("monitoring_queue.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
