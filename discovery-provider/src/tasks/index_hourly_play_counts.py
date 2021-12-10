import logging
import time
import datetime
from typing import List
from sqlalchemy import func, desc, text
from sqlalchemy.dialects.postgresql import insert
from src.models.models import HourlyPlayCounts, AggregatePlays
from src.utils.update_indexing_checkpoints import UPDATE_INDEXING_CHECKPOINTS_QUERY
from src.tasks.celery_app import celery
from src.models import IndexingCheckpoints, Play

logger = logging.getLogger(__name__)

HOURLY_PLAY_COUNTS_TABLE_NAME = "hourly_play_counts"

UPSERT_HOURLY_PLAY_COUNTS_QUERY = """
    INSERT INTO hourly_play_counts (hourly_timestamp, play_count)
    VALUES(:hourly_timestamp, :play_count)
    ON CONFLICT (hourly_timestamp)
    DO UPDATE SET play_count = hourly_play_counts.play_count + EXCLUDED.play_count;
    """

def _index_hourly_play_counts(session):
    # get the last checkpoint
    prev_play_count = (session.query(IndexingCheckpoints.last_checkpoint)
        .filter(IndexingCheckpoints.tablename == HOURLY_PLAY_COUNTS_TABLE_NAME)
    ).scalar()

    if not prev_play_count:
        prev_play_count = 0

    current_play_count = int(session.query(func.sum(AggregatePlays.count)).scalar())

    if prev_play_count == current_play_count:
        logger.info("index_hourly_play_counts.py | No new plays in this hour")
        return

    if not prev_play_count:
        # populate existing plays
        logger.info("index_hourly_play_counts.py | Populating hourly metrics for the first time")

        current_hourly_play_counts: List[HourlyPlayCounts] = (session.query(
            func.date_trunc("hour", Play.created_at).label(
                "hourly_timestamp"
            ),
            func.count(Play.id).label("play_count")
        )
        .group_by(func.date_trunc("hour", Play.created_at))
        .order_by(desc("hourly_timestamp"))
        .all()
        )

        new_hourly_play_counts = []
        for hourly_play_count in current_hourly_play_counts:
            new_hourly_play_count = HourlyPlayCounts(
                hourly_timestamp = hourly_play_count.hourly_timestamp,
                play_count = hourly_play_count.play_count,
            )
            new_hourly_play_counts.append(new_hourly_play_count)
        session.add_all(new_hourly_play_counts)

    else:
        # insert new hourly play count

        session.execute(UPSERT_HOURLY_PLAY_COUNTS_QUERY, {
            "hourly_timestamp": datetime.datetime.now().replace(microsecond=0, second=0, minute=0),
            "play_count": current_play_count - prev_play_count
        })

    # update the checkpoint
    session.execute(
        text(UPDATE_INDEXING_CHECKPOINTS_QUERY),
        {
            "tablename": HOURLY_PLAY_COUNTS_TABLE_NAME,
            "last_checkpoint": current_play_count,
        }
    )

######## CELERY TASKS ########
@celery.task(name="index_hourly_play_counts", bind=True)
def index_hourly_play_counts(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = index_hourly_play_counts.db
    redis = index_hourly_play_counts.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("index_hourly_play_counts_lock", timeout=60 * 10)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(f"index_hourly_play_counts.py | Updating {HOURLY_PLAY_COUNTS_TABLE_NAME}")

            start_time = time.time()

            with db.scoped_session() as session:
                _index_hourly_play_counts(session)

            logger.info(
                f"index_hourly_play_counts.py | Finished updating \
                {HOURLY_PLAY_COUNTS_TABLE_NAME} in: {time.time()-start_time} sec"
            )
        else:
            logger.info(
                "index_hourly_play_counts.py | Failed to acquire update_hourly_play_counts"
            )
    except Exception as e:
        logger.error(
            "index_hourly_play_counts.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
