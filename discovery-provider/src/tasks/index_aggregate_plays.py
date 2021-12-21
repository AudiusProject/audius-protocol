import logging
import time

from sqlalchemy import func, text
from src.models import IndexingCheckpoints, Play
from src.tasks.celery_app import celery
from src.utils.update_indexing_checkpoints import UPDATE_INDEXING_CHECKPOINTS_QUERY

logger = logging.getLogger(__name__)

AGGREGATE_PLAYS_TABLE_NAME = "aggregate_plays"

### UPDATE_AGGREGATE_PLAYS_QUERY ###
# Get new plays that came after the last indexing checkpoint for aggregate_play
# Group those new plays by play item id to get the aggregate play counts
# For new play item ids, insert those aggregate counts
# For existing play item ids, add the new aggregate count to the existing aggregate count
UPDATE_AGGREGATE_PLAYS_QUERY = """
    WITH aggregate_plays_last_checkpoint AS (
        SELECT
            :prev_id_checkpoint AS prev_id_checkpoint,
            :new_id_checkpoint AS new_id_checkpoint
    ),
    new_plays AS (
        SELECT
            play_item_id,
            count(play_item_id) AS count
        FROM
            plays p
        WHERE
            p.id > (
                SELECT
                    prev_id_checkpoint
                FROM
                    aggregate_plays_last_checkpoint
            )
            AND p.id <= (
                SELECT
                    new_id_checkpoint
                FROM
                    aggregate_plays_last_checkpoint
            )
        GROUP BY
            play_item_id
    )
    INSERT INTO
        aggregate_plays (play_item_id, count)
    SELECT
        new_plays.play_item_id,
        new_plays.count
    FROM
        new_plays ON CONFLICT (play_item_id) DO
    UPDATE
    SET
        count = aggregate_plays.count + EXCLUDED.count
    """


def _update_aggregate_plays(session):
    # get the last updated id that counted towards the current aggregate plays
    prev_id_checkpoint = (
        session.query(IndexingCheckpoints.last_checkpoint).filter(
            IndexingCheckpoints.tablename == AGGREGATE_PLAYS_TABLE_NAME
        )
    ).scalar()

    if not prev_id_checkpoint:
        prev_id_checkpoint = 0

    # get the new latest
    new_id_checkpoint = (session.query(func.max(Play.id))).scalar()

    # update aggregate plays with new plays that came after the prev_id_checkpoint
    logger.info(f"index_aggregate_plays.py | Updating {AGGREGATE_PLAYS_TABLE_NAME}")

    session.execute(
        text(UPDATE_AGGREGATE_PLAYS_QUERY),
        {
            "prev_id_checkpoint": prev_id_checkpoint,
            "new_id_checkpoint": new_id_checkpoint,
        },
    )

    # update indexing_checkpoints with the new id
    session.execute(
        text(UPDATE_INDEXING_CHECKPOINTS_QUERY),
        {
            "tablename": AGGREGATE_PLAYS_TABLE_NAME,
            "last_checkpoint": new_id_checkpoint,
        },
    )


######## CELERY TASKS ########
@celery.task(name="update_aggregate_plays", bind=True)
def update_aggregate_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_aggregate_plays.db
    redis = update_aggregate_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_aggregate_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()

            with db.scoped_session() as session:
                _update_aggregate_plays(session)

            logger.info(
                f"index_aggregate_plays.py | Finished updating \
                {AGGREGATE_PLAYS_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_aggregate_plays.py | Failed to acquire update_aggregate_plays"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_plays.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
