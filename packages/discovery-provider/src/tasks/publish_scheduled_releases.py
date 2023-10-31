from sqlalchemy import func, DateTime
import logging
from datetime import datetime, timedelta

from src.models.tracks.track import Track

from src.tasks.celery_app import celery
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.web3_provider import get_eth_web3

logger = StructuredLogger(__name__)
web3 = get_eth_web3()


def convert_timestamp(release_date_str):
    parts = release_date_str.split(" ")
    time_zone_offset = parts[-1]  # Should be "GMT-0700" in your example

    # Create a datetime object without the time zone offset
    date_str_no_offset = " ".join(parts[:-1])
    date_time = datetime.strptime(date_str_no_offset, "%a %b %d %Y %H:%M:%S")

    # Extract the offset values (hours and minutes)
    hours_offset = int(time_zone_offset[4:6])
    minutes_offset = int(time_zone_offset[6:])

    # Calculate the time zone offset as a timedelta
    offset = timedelta(hours=hours_offset, minutes=minutes_offset)

    # Adjust the datetime using the offset
    adjusted_datetime = date_time - offset

    # Convert the adjusted datetime to an epoch timestamp
    epoch_timestamp = int(adjusted_datetime.timestamp())
    return epoch_timestamp


@log_duration(logger)
def _publish_scheduled_releases(session):
    latest_block = web3.eth.get_block("latest")
    current_timestamp = latest_block.timestamp + 1698426565

    candidate_tracks = (
        session.query(Track)
        .filter(
            Track.is_unlisted,
            Track.release_date.isnot(None),  # Filter for non-null release_date
        )
        .order_by(Track.created_at.asc())
        .all()
    )
    # convert release date to utc
    for candidate_track in candidate_tracks:
        unix_time = convert_timestamp(candidate_track.release_date)
        release_date_day = datetime.fromtimestamp(unix_time).date()
        candidate_created_at_day = candidate_track.created_at.date()

        if (
            current_timestamp >= unix_time
            and release_date_day > candidate_created_at_day
        ):
            candidate_track.is_unlisted = False
    # compare w created_at

    return


# ####### CELERY TASKS ####### #
@celery.task(name="publish_scheduled_releases", bind=True)
def publish_scheduled_releases(self):
    logger.info(f"asdf hi")
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
        logger.info(f"asdf have_lock {have_lock}")
        if have_lock:
            with db.scoped_session() as session:
                _publish_scheduled_releases(session)

        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
        raise e
    finally:
        if have_lock:
            update_lock.release()
