import datetime
import logging
import time

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
    interval = datetime.timedelta(minutes=10)
    start_time = time.time()
    errored = False
    try:
        with db.scoped_session() as session:
            track_count = get_max_track_count(session)
            redis.set(max_track_count_redis_key, track_count)

            playlist_count = get_max_playlist_count(session)
            redis.set(max_playlist_count_redis_key, playlist_count)

            user_count = get_max_user_count(session)
            redis.set(max_user_count_redis_key, user_count)
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
