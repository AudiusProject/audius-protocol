import logging
import time
from src.tasks.celery_app import celery
from src.queries.get_trending_playlists import make_trending_cache_key, make_get_unpopulated_playlists
from src.utils.redis_cache import pickle_and_set
from src.utils.redis_constants import trending_playlists_last_completion_redis_key

logger = logging.getLogger(__name__)

TIME_RANGES = ["week", "month", "year"]

def cache_trending(db, redis):
    with db.scoped_session() as session:
        for time_range in TIME_RANGES:
            key = make_trending_cache_key(time_range)
            res = make_get_unpopulated_playlists(session, time_range)()
            pickle_and_set(redis, key, res)

@celery.task(name="cache_trending_playlists", bind=True)
def cache_trending_playlists(self):
    """Caches user Audio balances, in wei."""

    db = cache_trending_playlists.db
    redis = cache_trending_playlists.redis

    have_lock = False
    update_lock = redis.lock("cache_trending_playlists_lock", timeout=7200)

    try:
        have_lock = update_lock.acquire(blocking=False)

        if have_lock:
            logger.info(f"cache_trending_playlists.py | Starting")
            start_time = time.time()
            cache_trending(db, redis)
            end_time = time.time()
            logger.info(f"cache_trending_playlists.py | Finished in {end_time - start_time} seconds")
            redis.set(trending_playlists_last_completion_redis_key, int(end_time))
        else:
            logger.info("cache_trending_playlists.py | Failed to acquire lock")
    except Exception as e:
        logger.error("cache_trending_playlists.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
