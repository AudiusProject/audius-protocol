import logging
import time
from datetime import datetime

from sqlalchemy import text
from src.tasks.celery_app import celery

logger = logging.getLogger(__name__)

PLAYS_ARCHIVE_TABLE_NAME = "plays_archive"

# ARCHIVE_PLAYS_QUERY
# in a sliding window, delete the oldest plays before the cutoff date
# delete no more than MAX_BATCH
ARCHIVE_PLAYS_QUERY = """
    INSERT INTO
        plays_archive
    SELECT
        id,
        user_id,
        source,
        play_item_id,
        created_at,
        updated_at,
        slot,
        signature,
        :current_timestamp
    FROM
        plays
    WHERE
        plays.created_at <= :cutoff_timestamp
    ORDER BY
        id ASC
    LIMIT
        :max_batch
    """

# PRUNE_PLAYS_QUERY
# prune those same plays that were archived
PRUNE_PLAYS_QUERY = """
    DELETE FROM
        plays
    WHERE
        id IN (
            SELECT
                id
            FROM
                plays
            WHERE
                plays.created_at <= :cutoff_timestamp
            ORDER BY
                id ASC
            LIMIT
                :max_batch
        )
    """

# Prune up to the cutoff date
# start at all plays before 2020 (328751 total)
# TODO move to a sliding window
DEFAULT_CUTOFF_TIMESTAMP = datetime.fromisoformat("2020-01-01")

# max number of plays to prune per run
DEFAULT_MAX_BATCH = 80000


def _prune_plays(
    session,
    current_timestamp,
    cutoff_timestamp=DEFAULT_CUTOFF_TIMESTAMP,
    max_batch=DEFAULT_MAX_BATCH,
):

    # copy over plays that have been fully indexed and are older than cutoff date
    session.execute(
        text(ARCHIVE_PLAYS_QUERY),
        {
            "current_timestamp": current_timestamp,
            "cutoff_timestamp": cutoff_timestamp,
            "max_batch": max_batch,
        },
    )

    # delete plays that have been moved over
    session.execute(
        text(PRUNE_PLAYS_QUERY),
        {
            "current_timestamp": current_timestamp,
            "cutoff_timestamp": cutoff_timestamp,
            "max_batch": max_batch,
        },
    )


# ####### CELERY TASKS ####### #
@celery.task(name="prune_plays", bind=True)
def prune_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = prune_plays.db
    redis = prune_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("prune_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()

            with db.scoped_session() as session:
                _prune_plays(session, datetime.now())

            logger.info(
                f"prune_plays.py | Finished archiving \
                {PLAYS_ARCHIVE_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info("prune_plays.py | Failed to acquire prune_plays_lock")
    except Exception as e:
        logger.error("prune_plays.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
