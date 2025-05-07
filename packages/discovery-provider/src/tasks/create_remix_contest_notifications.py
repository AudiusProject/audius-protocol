from src.tasks.celery_app import celery
from src.tasks.remix_contest_notifications.fan_remix_contest_ended import (
    create_fan_remix_contest_ended_notifications,
)
from src.tasks.remix_contest_notifications.fan_remix_contest_ending_soon import (
    create_fan_remix_contest_ending_soon_notifications,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


@celery.task(name="create_remix_contest_notifications", bind=True)
def create_remix_contest_notifications(self):
    redis = create_remix_contest_notifications.redis
    db = create_remix_contest_notifications.db

    have_lock = False
    update_lock = redis.lock(
        "remix_contest_notifications_lock",
        blocking_timeout=25,
        timeout=600,
    )
    try:
        have_lock = update_lock.acquire(blocking=True)
        if have_lock:
            with db.scoped_session() as session:
                logger.info("Running fan remix contest ended notifications")
                create_fan_remix_contest_ended_notifications(session)
                logger.info("Running fan remix contest ending soon notifications")
                create_fan_remix_contest_ending_soon_notifications(session)
        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"Error running remix contest notifications: {e}")
    finally:
        if have_lock:
            update_lock.release()
