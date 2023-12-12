from datetime import datetime

from src.models.tracks.track import Track
from src.tasks.celery_app import celery
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.web3_provider import get_eth_web3

logger = StructuredLogger(__name__)
web3 = get_eth_web3()
publish_scheduled_releases_cursor_key = "publish_scheduled_releases_cursor"
batch_size = 1000


@log_duration(logger)
def _publish_scheduled_releases(session, redis):
    latest_block = web3.eth.get_block("latest")
    current_timestamp = latest_block.timestamp
    redis_value = redis.get(publish_scheduled_releases_cursor_key)
    previous_cursor = (
        datetime.fromtimestamp(int(float(redis_value))) if redis_value else datetime.min
    )

    candidate_tracks = (
        session.query(Track)
        .filter(
            Track.is_unlisted,
            Track.release_date.isnot(None),  # Filter for non-null release_date
            Track.created_at >= previous_cursor,
        )
        .order_by(Track.created_at.asc())
        .limit(batch_size)
        .all()
    )
    # convert release date to utc
    for candidate_track in candidate_tracks:
        try:
            release_date_day = candidate_track.release_date
        except Exception:
            continue
        candidate_created_at_day = candidate_track.created_at.date()
        if (
            current_timestamp >= release_date_day.timestamp()
            and release_date_day > candidate_created_at_day
        ):
            candidate_track.is_unlisted = False

    if candidate_tracks:
        redis.set(
            publish_scheduled_releases_cursor_key,
            candidate_tracks[-1].created_at.timestamp(),
        )
    return


# ####### CELERY TASKS ####### #
@celery.task(name="publish_scheduled_releases", bind=True)
def publish_scheduled_releases(self):
    redis = publish_scheduled_releases.redis
    db = publish_scheduled_releases.db

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(
        "publish_scheduled_releases_lock", blocking_timeout=25, timeout=600
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _publish_scheduled_releases(session, redis)

        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
        raise e
    finally:
        if have_lock:
            update_lock.release()
