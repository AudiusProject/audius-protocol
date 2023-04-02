import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple

from redis import Redis
from src.models.indexing.block import Block
from src.tasks.celery_app import celery
from src.tasks.index_tastemaker_notifications import index_tastemaker_notifications
from src.tasks.index_trending_tracks import index_trending_tracks
from src.tasks.index_trending_underground import index_trending_underground
from src.utils.config import shared_config
from src.utils.helpers import get_adjusted_block
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager
from src.utils.web3_provider import get_web3
from web3 import Web3

logger = logging.getLogger(__name__)

# Time in seconds between trending updates
UPDATE_TRENDING_DURATION_DIFF_SEC = int(
    shared_config["discprov"]["trending_refresh_seconds"]
)


last_trending_timestamp = "last_trending_timestamp"


def get_last_trending_datetime(redis: Redis):
    dt = redis.get(last_trending_timestamp)
    if dt:
        return datetime.fromtimestamp(int(dt.decode()))
    return None


def floor_time(dt: datetime, interval_seconds: int):
    """
    Floor a datetime object to a time-span in seconds
    interval_seconds: Closest number of seconds to floor to

    For example, if floor_time is invoked with `interval_seconds` of 15,
    the provided datetime is rounded down to the nearest 15 minute interval.
    E.g. 10:48 rounds to 10:45, 11:02 rounds to 11:00, etc.
    """
    seconds = (dt.replace(tzinfo=None) - dt.min).seconds
    rounding = seconds // interval_seconds * interval_seconds
    return dt + timedelta(0, rounding - seconds, -dt.microsecond)


def find_min_block_above_timestamp(block_number: int, min_timestamp: datetime, web3):
    """
    finds the minimum block number above a timestamp
    This is needed to ensure consistency across discovery nodes on the timestamp/blocknumber
    of a notification for updates to trending track
    returns a tuple of the blocknumber and timestamp
    """
    curr_block_number = block_number
    block = get_adjusted_block(web3, block_number)
    while datetime.fromtimestamp(block["timestamp"]) > min_timestamp:
        prev_block = get_adjusted_block(web3, curr_block_number - 1)
        prev_timestamp = datetime.fromtimestamp(prev_block["timestamp"])
        if prev_timestamp >= min_timestamp:
            block = prev_block
            curr_block_number -= 1
        else:
            return block

    return block


def get_should_update_trending(
    db: SessionManager, web3: Web3, redis: Redis, interval_seconds: int
) -> Tuple[Optional[int], Optional[int]]:
    """
    Checks if the trending job should re-run based off the last trending run's timestamp and
    the most recently indexed block's timestamp.
    If the most recently indexed block (rounded down to the nearest interval) is `interval_seconds`
    ahead of the last trending job run, then the job should re-run.
    The function returns the an int, representing the timestamp, if the jobs should re-run, else None
    """
    with db.scoped_session() as session:
        current_db_block = (
            session.query(Block.number).filter(Block.is_current == True).first()
        )
        current_db_block_number = current_db_block[0]
        current_block = get_adjusted_block(web3, current_db_block_number)
        current_timestamp = current_block["timestamp"]
        current_datetime = datetime.fromtimestamp(current_timestamp)
        min_block_datetime = floor_time(current_datetime, interval_seconds)

        # Handle base case of not having run last trending
        last_trending_datetime = get_last_trending_datetime(redis)
        if not last_trending_datetime:
            # Base case where there is no previous trending calculation in redis
            min_block = find_min_block_above_timestamp(
                current_db_block_number, min_block_datetime, web3
            )
            return min_block, int(min_block_datetime.timestamp())

        # Handle base case of not having run last trending
        duration_since_last_index = current_datetime - last_trending_datetime
        if duration_since_last_index.total_seconds() >= interval_seconds:
            min_block = find_min_block_above_timestamp(
                current_db_block_number, min_block_datetime, web3
            )

            return min_block, int(min_block_datetime.timestamp())
    return None, None


# ####### CELERY TASKS ####### #
@celery.task(name="index_trending", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_trending_task(self):
    """Caches all trending combination of time-range and genre (including no genre)."""
    db = index_trending_task.db
    redis = index_trending_task.redis
    web3 = get_web3()
    have_lock = False
    timeout = 60 * 60 * 2
    update_lock = redis.lock("index_trending_lock", timeout=timeout)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            min_block, min_timestamp = get_should_update_trending(
                db, web3, redis, UPDATE_TRENDING_DURATION_DIFF_SEC
            )
            if min_block is not None and min_timestamp is not None:
                top_trending_tracks = index_trending_tracks(
                    self, db, redis, min_timestamp
                )
                index_tastemaker_notifications(top_trending_tracks)
                index_trending_underground(db, redis, min_timestamp)

            else:
                logger.info("index_trending.py | skip indexing: not min block")
        else:
            logger.info(
                f"index_trending.py | \
                skip indexing: without lock {have_lock}"
            )
    except Exception as e:
        logger.error("index_trending.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
