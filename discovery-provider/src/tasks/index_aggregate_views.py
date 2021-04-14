import logging
import time
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)

# Names of the aggregate tables to update
AGGREGATE_USER = 'aggregate_user'
AGGREGATE_TRACK = 'aggregate_track'
AGGREGATE_PLAYLIST = 'aggregate_playlist'

DEFAULT_UPDATE_TIMEOUT = 60

def update_view(mat_view_name, db):
    with db.scoped_session() as session:
        start_time = time.time()
        logger.info(f"index_aggregate_views.py | Updating {mat_view_name}")
        session.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {mat_view_name}")
        logger.info(
            f"index_aggregate_views.py | Finished updating {mat_view_name} in: {time.time()-start_time} sec"
        )

def update_materialized_view(db, redis, mat_view_name, timeout=DEFAULT_UPDATE_TIMEOUT):
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(f"refresh_mat_view:{mat_view_name}", timeout=timeout)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update_view(mat_view_name, db)
        else:
            logger.info(f"index_aggregate_views.py | Failed to acquire lock refresh_mat_view:{mat_view_name}")
    except Exception as e:
        logger.error("index_aggregate_views.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()


######## CELERY TASKS ########
@celery.task(name="update_aggregate_user", bind=True)
def update_aggregate_user(self):
    db = update_aggregate_user.db
    redis = update_aggregate_user.redis
    update_materialized_view(db, redis, AGGREGATE_USER)

@celery.task(name="update_aggregate_track", bind=True)
def update_aggregate_track(self):
    db = update_aggregate_track.db
    redis = update_aggregate_track.redis
    update_materialized_view(db, redis, AGGREGATE_TRACK)

@celery.task(name="update_aggregate_playlist", bind=True)
def update_aggregate_playlist(self):
    db = update_aggregate_playlist.db
    redis = update_aggregate_playlist.redis
    update_materialized_view(db, redis, AGGREGATE_PLAYLIST)
