import logging
import time

from sqlalchemy import func, text
from src.models import IndexingCheckpoints, Play
from src.tasks.celery_app import celery
from src.utils.update_indexing_checkpoints import UPDATE_INDEXING_CHECKPOINTS_QUERY

logger = logging.getLogger(__name__)

AGGREGATE_INTERVAL_PLAYS_TABLE_NAME = "aggregate_interval_plays"

# UPDATE_AGGREGATE_INTERVAL_PLAYS_QUERY
# Get new plays that came after the last indexing checkpoint for aggregate_interval_plays
# Group those new plays by play item id / intervals to get the aggregate play counts
# For new play item ids, insert those aggregate counts
# For existing play item ids, add the new aggregate count to the existing aggregate count
UPDATE_AGGREGATE_INTERVAL_PLAYS_QUERY = """
    WITH aggregate_interval_plays_last_checkpoint AS (
        SELECT
            :prev_id_checkpoint AS prev_id_checkpoint,
            :new_id_checkpoint AS new_id_checkpoint
    ),
    new_plays AS (
        SELECT
            tracks.track_id as track_id,
            tracks.genre as genre,
            tracks.created_at as created_at,
            COALESCE (week_listen_counts.count, 0) as week_listen_counts,
            COALESCE (month_listen_counts.count, 0) as month_listen_counts,
            COALESCE (year_listen_counts.count, 0) as year_listen_counts
        FROM
            tracks
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.id > (
                    SELECT
                        prev_id_checkpoint
                    FROM
                        aggregate_interval_plays_last_checkpoint
                )
            AND plays.id <= (
                SELECT
                    new_id_checkpoint
                FROM
                    aggregate_interval_plays_last_checkpoint
            )
            AND plays.created_at > (now() - interval '1 week')
            GROUP BY plays.play_item_id
        ) as week_listen_counts ON week_listen_counts.play_item_id = tracks.track_id
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.id > (
                    SELECT
                        prev_id_checkpoint
                    FROM
                        aggregate_interval_plays_last_checkpoint
                )
            AND plays.id <= (
                SELECT
                    new_id_checkpoint
                FROM
                    aggregate_interval_plays_last_checkpoint
            )
            AND plays.created_at > (now() - interval '1 month')
            GROUP BY plays.play_item_id
        ) as month_listen_counts ON month_listen_counts.play_item_id = tracks.track_id
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.id > (
                    SELECT
                        prev_id_checkpoint
                    FROM
                        aggregate_interval_plays_last_checkpoint
                )
            AND plays.id <= (
                SELECT
                    new_id_checkpoint
                FROM
                    aggregate_interval_plays_last_checkpoint
            )
            AND plays.created_at > (now() - interval '1 year')
            GROUP BY plays.play_item_id
        ) as year_listen_counts ON year_listen_counts.play_item_id = tracks.track_id
        WHERE
            tracks.is_current is True AND
            tracks.is_delete is False AND
            tracks.is_unlisted is False AND
            tracks.stem_of is Null
    )
    INSERT INTO
        aggregate_interval_plays (track_id, genre, created_at, week_listen_counts, month_listen_counts, year_listen_counts)
    SELECT
        track_id, genre, created_at, week_listen_counts, month_listen_counts, year_listen_counts
    FROM
        new_plays ON CONFLICT (track_id) DO
    UPDATE
    SET
        week_listen_counts = aggregate_interval_plays.week_listen_counts + EXCLUDED.week_listen_counts,
        month_listen_counts = aggregate_interval_plays.month_listen_counts + EXCLUDED.month_listen_counts,
        year_listen_counts = aggregate_interval_plays.year_listen_counts + EXCLUDED.year_listen_counts
    """


def _update_aggregate_interval_plays(session):
    # get the last updated id that counted towards the current aggregate_interval_plays
    prev_id_checkpoint = (
        session.query(IndexingCheckpoints.last_checkpoint).filter(
            IndexingCheckpoints.tablename == AGGREGATE_INTERVAL_PLAYS_TABLE_NAME
        )
    ).scalar()

    if not prev_id_checkpoint:
        prev_id_checkpoint = 0

    # get the new play id checkpoint
    new_id_checkpoint = (session.query(func.max(Play.id))).scalar()

    if not new_id_checkpoint or prev_id_checkpoint == new_id_checkpoint:
        return

    # update aggregate_interval_plays with new plays that came after the prev_id_checkpoint
    logger.info(
        f"index_aggregate_interval_plays.py | Updating {AGGREGATE_INTERVAL_PLAYS_TABLE_NAME}"
    )

    session.execute(
        text(UPDATE_AGGREGATE_INTERVAL_PLAYS_QUERY),
        {
            "prev_id_checkpoint": prev_id_checkpoint,
            "new_id_checkpoint": new_id_checkpoint,
        },
    )

    # update indexing_checkpoints with the new id
    session.execute(
        text(UPDATE_INDEXING_CHECKPOINTS_QUERY),
        {
            "tablename": AGGREGATE_INTERVAL_PLAYS_TABLE_NAME,
            "last_checkpoint": new_id_checkpoint,
        },
    )


# ####### CELERY TASKS ####### #
@celery.task(name="update_aggregate_interval_plays", bind=True)
def update_aggregate_interval_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = update_aggregate_interval_plays.db
    redis = update_aggregate_interval_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_aggregate_interval_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()

            with db.scoped_session() as session:
                _update_aggregate_interval_plays(session)

            logger.info(
                f"index_aggregate_interval_plays.py | Finished updating \
                {AGGREGATE_INTERVAL_PLAYS_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_aggregate_interval_plays.py | Failed to acquire update_aggregate_interval_plays"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_interval_plays.py | Fatal error in main loop",
            exc_info=True,
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
