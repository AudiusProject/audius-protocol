import datetime
import logging
import time
from typing import List

from sqlalchemy import desc, func

from src.models.social.hourly_play_counts import HourlyPlayCount
from src.models.social.play import Play
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import save_duration_metric
from src.utils.update_indexing_checkpoints import (
    get_last_indexed_checkpoint,
    save_indexed_checkpoint,
)

logger = logging.getLogger(__name__)

HOURLY_PLAY_COUNTS_TABLE_NAME = "hourly_play_counts"

UPSERT_HOURLY_PLAY_COUNTS_QUERY = """
    INSERT INTO hourly_play_counts (hourly_timestamp, play_count)
    VALUES(:hourly_timestamp, :play_count)
    ON CONFLICT (hourly_timestamp)
    DO UPDATE SET play_count = hourly_play_counts.play_count + EXCLUDED.play_count;
    """


def _index_hourly_play_counts(session):
    # get checkpoints
    prev_id_checkpoint = get_last_indexed_checkpoint(
        session, HOURLY_PLAY_COUNTS_TABLE_NAME
    )

    new_id_checkpoint = (session.query(func.max(Play.id))).scalar()

    if not new_id_checkpoint or new_id_checkpoint == prev_id_checkpoint:
        logger.info(
            "index_hourly_play_counts.py | Skip update because there are no new plays"
        )
        return

    # get play counts in hourly buckets
    hourly_play_counts: List[HourlyPlayCount] = (
        session.query(
            func.date_trunc("hour", Play.created_at).label("hourly_timestamp"),
            func.count(Play.id).label("play_count"),
        )
        .filter(Play.id > prev_id_checkpoint)
        .filter(Play.id <= new_id_checkpoint)
        .group_by(func.date_trunc("hour", Play.created_at))
        .order_by(desc("hourly_timestamp"))
        .all()
    )

    # upsert hourly play count
    # on first population, this will execute an insert for each hour
    # subsequent updates should include 1 or 2 upserts
    for hourly_play_count in hourly_play_counts:
        session.execute(
            UPSERT_HOURLY_PLAY_COUNTS_QUERY,
            {
                "hourly_timestamp": hourly_play_count.hourly_timestamp,
                "play_count": hourly_play_count.play_count,
            },
        )

    # update with new checkpoint
    save_indexed_checkpoint(session, HOURLY_PLAY_COUNTS_TABLE_NAME, new_id_checkpoint)


# ####### CELERY TASKS ####### #
@celery.task(name="index_hourly_play_counts", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_hourly_play_counts(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db = index_hourly_play_counts.db
    interval = datetime.timedelta(seconds=30)
    start_time = time.time()
    errored = False
    try:
        logger.info(
            f"index_hourly_play_counts.py | Updating {HOURLY_PLAY_COUNTS_TABLE_NAME}"
        )

        start_time = time.time()

        with db.scoped_session() as session:
            _index_hourly_play_counts(session)

        logger.info(
            f"index_hourly_play_counts.py | Finished updating \
                {HOURLY_PLAY_COUNTS_TABLE_NAME} in: {time.time()-start_time} sec"
        )
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
