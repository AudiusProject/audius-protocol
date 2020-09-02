import logging
import json
from src.utils import db_session
from src.tasks.celery_app import celery
from src.tasks.generate_trending import generate_trending, trending_cache_hits_key, \
        trending_cache_miss_key, trending_cache_total_key

logger = logging.getLogger(__name__)


######## HELPER FUNCTIONS ########
def update_trending_cache(self, db, redis, time):
    with db.scoped_session() as session:
        resp = generate_trending(session, time, None, 1000, 0)
        resp_json = json.dumps(resp)
        redis_key = f"trending-{time}"
        # Cache value for 5 minutes
        redis.set(redis_key, resp_json, 300)
        logger.info(f"index_cache.py | Updated trending cache {redis_key}")

# Update cache for all trending timeframes
def update_all_trending_cache(self, db, redis):
    logger.warning(f"index_cache.py | Update all trending cache")
    update_trending_cache(self, db, redis, "day")
    update_trending_cache(self, db, redis, "week")
    update_trending_cache(self, db, redis, "month")
    update_trending_cache(self, db, redis, "year")

def print_cache_statistics(self, redis):
    total = redis.get(trending_cache_total_key)
    hits = redis.get(trending_cache_hits_key)
    misses = redis.get(trending_cache_miss_key)
    logger.warning(f"index_cache.py | Trending cache - {hits}  hits, {misses} misses, {total} total")


######## CELERY TASKS ########
@celery.task(name="update_discovery_cache", bind=True)
def update_discovery_cache(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_discovery_cache.db
    redis = update_discovery_cache.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("update_discovery_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update_all_trending_cache(self, db, redis)
            print_cache_statistics(self, redis)
        else:
            logger.info("index_cache.py | Failed to acquire update_discovery_lock")
    except Exception as e:
        logger.error("index_cache.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
