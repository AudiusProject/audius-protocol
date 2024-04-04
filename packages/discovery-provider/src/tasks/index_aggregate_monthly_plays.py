import logging
import time

from sqlalchemy import func, text

from src.models.social.play import Play
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)

AGGREGATE_MONTHLY_PLAYS_TABLE_NAME = "aggregate_monthly_plays"

# UPSERT_AGGREGATE_MONTHLY_PLAYS_QUERY
# Get new plays that came after the last indexing checkpoint for aggregate_monthly_play
# Group those new plays by play item id and month to get the aggregate monthly play counts
# For new play item ids, insert those aggregate counts
# For existing play item ids, add the new aggregate count to the existing aggregate count
UPSERT_AGGREGATE_MONTHLY_PLAYS_QUERY = """
    with new_plays as (
        select
            play_item_id,
            date_trunc('month', created_at) as timestamp,
            coalesce(country, '') as country,
            count(play_item_id) as count
        from
            plays p
        where
            p.id > :prev_id_checkpoint
            and p.id <= :new_id_checkpoint
        group by
            play_item_id, date_trunc('month', created_at), coalesce(country, '')
    )
    insert into
        aggregate_monthly_plays (play_item_id, timestamp, country, count)
    select
        new_plays.play_item_id,
        new_plays.timestamp,
        new_plays.country,
        new_plays.count
    from
        new_plays on conflict (play_item_id, timestamp, country) do
    update
    set
        count = aggregate_monthly_plays.count + excluded.count
    """


def _index_aggregate_monthly_plays(session):
    # get the last updated id that counted towards the current aggregate monthly plays
    prev_id_checkpoint = get_last_indexed_checkpoint(
        session, AGGREGATE_MONTHLY_PLAYS_TABLE_NAME
    )

    # get the new latest checkpoint
    most_recent_play_id = (session.query(func.max(Play.id))).scalar()

    if not most_recent_play_id:
        return

    new_id_checkpoint = (
        min(most_recent_play_id - prev_id_checkpoint, 1000000) + prev_id_checkpoint
    )

    if not new_id_checkpoint or new_id_checkpoint == prev_id_checkpoint:
        logger.info(
            "index_aggregate_monthly_plays.py | Skip update because there are no new plays"
        )
        return

    # update aggregate monthly plays with new plays that came after the prev_id_checkpoint
    # group into monthly buckets
    # insert / update those buckets into table
    logger.info(
        f"index_aggregate_monthly_plays.py | Updating {AGGREGATE_MONTHLY_PLAYS_TABLE_NAME}"
    )

    session.execute(
        text(UPSERT_AGGREGATE_MONTHLY_PLAYS_QUERY),
        {
            "prev_id_checkpoint": prev_id_checkpoint,
            "new_id_checkpoint": new_id_checkpoint,
        },
    )

    # update indexing_checkpoints with the new id
    save_indexed_checkpoint(
        session, AGGREGATE_MONTHLY_PLAYS_TABLE_NAME, new_id_checkpoint
    )


# ####### CELERY TASKS ####### #
@celery.task(name="index_aggregate_monthly_plays", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_aggregate_monthly_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = index_aggregate_monthly_plays.db
    redis = index_aggregate_monthly_plays.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_aggregate_monthly_plays_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time.time()
            logger.info(
                f"index_aggregate_monthly_plays.py | Started updating {AGGREGATE_MONTHLY_PLAYS_TABLE_NAME}"
            )

            with db.scoped_session() as session:
                _index_aggregate_monthly_plays(session)

            logger.info(
                f"index_aggregate_monthly_plays.py | Finished updating \
                {AGGREGATE_MONTHLY_PLAYS_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_aggregate_monthly_plays.py | Failed to acquire index_aggregate_monthly_plays"
            )
    except Exception as e:
        logger.error(
            "index_aggregate_monthly_plays.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
