import logging

from src.queries.get_related_artists_minhash import update_related_artist_minhash
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)


def process_related_artists(db: SessionManager):
    with db.scoped_session() as session:
        logger.info("index_related_artists.py | starting")
        update_related_artist_minhash(session)
        logger.info("index_related_artists.py | done")


@celery.task(name="index_related_artists", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_related_artists(self):
    redis = index_related_artists.redis
    db = index_related_artists.db
    have_lock = False
    update_lock = redis.lock("related_artists_lock", timeout=600)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            process_related_artists(db)
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
