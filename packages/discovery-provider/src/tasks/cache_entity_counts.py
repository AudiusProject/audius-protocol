import logging

from src.queries.get_sitemap import (
    get_max_playlist_count,
    get_max_track_count,
    get_max_user_count,
    max_playlist_count_redis_key,
    max_track_count_redis_key,
    max_user_count_redis_key,
)
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(name="cache_entity_counts", bind=True)
def cache_entity_counts_task(self):
    db = cache_entity_counts_task.db_read_replica
    redis = cache_entity_counts_task.redis
    have_lock = False
    update_lock = redis.lock("cache_current_nodes_lock", timeout=5 * 60)
    have_lock = update_lock.acquire(blocking=False)
    if have_lock:
        with db.scoped_session() as session:
            track_count = get_max_track_count(session)
            redis.set(max_track_count_redis_key, track_count)

            playlist_count = get_max_playlist_count(session)
            redis.set(max_playlist_count_redis_key, playlist_count)

            user_count = get_max_user_count(session)
            redis.set(max_user_count_redis_key, user_count)

        update_lock.release()
