import logging
from typing import Union

from redis import Redis
from src.queries.get_related_artists import update_related_artist_scores_if_needed
from src.tasks.celery_app import celery
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

INDEX_RELATED_ARTIST_REDIS_QUEUE = "related-artists-calculation-queue"


def queue_related_artist_calculation(redis: Redis, user_id: int):
    redis.rpush(INDEX_RELATED_ARTIST_REDIS_QUEUE, user_id)


def process_related_artists_queue(db: SessionManager, redis: Redis):
    next: Union[int, bool] = True
    needed_update_count = 0
    with db.scoped_session() as session:
        while next and needed_update_count < 10:
            next = redis.lpop(INDEX_RELATED_ARTIST_REDIS_QUEUE)
            if next:
                next = int(next)
                logger.debug(
                    f"index_related_artists.py | Checking user_id={next} for related artists recalculation..."
                )
                needed_update, reason = update_related_artist_scores_if_needed(
                    session, next
                )
                if needed_update:
                    logger.info(
                        f"index_related_artists.py | Updated related artists for user_id={next}"
                    )
                    needed_update_count += 1
                else:
                    logger.info(
                        f"index_related_artists.py | Skipped updating user_id={next} reason={reason}"
                    )


@celery.task(name="index_related_artists", bind=True)
def index_related_artists(self):
    redis = index_related_artists.redis
    db = index_related_artists.db
    have_lock = False
    update_lock = redis.lock("related_artists_lock", timeout=3600)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            process_related_artists_queue(db, redis)
        else:
            logger.info("index_related_artists.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "index_related_artists.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
