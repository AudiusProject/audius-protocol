import logging
import time
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)

# Vacuum can't happen inside a db txn, so we have to acquire
# a new connection and set it's isolation level to AUTOCOMMIT
# as per: https://stackoverflow.com/questions/1017463/postgresql-how-to-run-vacuum-from-code-outside-transaction-block
# (note that connections have their isolation level wiped before being returned
# to the conn pool: https://docs.sqlalchemy.org/en/14/core/connections.html
def vacuum_matviews(db):
    logger.info(f"index_materialized_views.py | Beginning vacuum")
    vacuum_start = time.time()

    engine = db._engine
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        connection.execute("VACUUM ANALYZE track_lexeme_dict")
        connection.execute("VACUUM ANALYZE user_lexeme_dict")
        connection.execute("VACUUM ANALYZE playlist_lexeme_dict")
        connection.execute("VACUUM ANALYZE album_lexeme_dict")

    logger.info(f"index_materialized_views.py | vacuumed in {time.time() - vacuum_start} sec.")

def update_views(self, db):
    with db.scoped_session() as session:
        start_time = time.time()
        logger.info('index_materialized_views.py | Updating materialized views')
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY user_lexeme_dict")
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY track_lexeme_dict")
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY playlist_lexeme_dict")
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY album_lexeme_dict")
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY tag_track_user")
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate_plays")

    vacuum_matviews(db)

    logger.info(
        f"index_materialized_views.py | Finished updating materialized views in: {time.time() - start_time} sec."
    )


######## CELERY TASKS ########
@celery.task(name="update_materialized_views", bind=True)
def update_materialized_views(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_materialized_views.db
    redis = update_materialized_views.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("materialized_view_lock", timeout=60*10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            update_views(self, db)
        else:
            logger.info("index_materialized_views.py | Failed to acquire update_materialized_views")
    except Exception as e:
        logger.error("index_materialized_views.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
