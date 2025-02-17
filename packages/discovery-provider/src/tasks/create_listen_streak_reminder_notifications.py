from datetime import datetime, timedelta

from sqlalchemy import String, and_, cast, func

from src.models.notifications.notification import Notification
from src.models.rewards.listen_streak_challenge import ChallengeListenStreak
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)
env = shared_config["discprov"]["env"]

LISTEN_STREAK_REMINDER = "listen_streak_reminder"
HOURS_PER_DAY = 24
LISTEN_STREAK_BUFFER = 6
LAST_LISTEN_HOURS_AGO = HOURS_PER_DAY - LISTEN_STREAK_BUFFER


def get_listen_streak_notification_group_id(user_id, date):
    return f"{LISTEN_STREAK_REMINDER}:{user_id}:{date}"


@log_duration(logger)
def _create_listen_streak_reminder_notifications(session):
    now = datetime.now()
    window_end = now - timedelta(hours=LAST_LISTEN_HOURS_AGO)
    window_start = now - timedelta(hours=LAST_LISTEN_HOURS_AGO + 1)
    if env == "stage" or env == "dev":
        window_end = now - timedelta(minutes=1)
        window_start = now - timedelta(minutes=2)

    # Find listen streaks that need reminder notifications
    listen_streaks = (
        session.query(ChallengeListenStreak)
        .outerjoin(
            Notification,
            and_(
                Notification.user_ids.any(ChallengeListenStreak.user_id),
                Notification.group_id
                == func.concat(
                    LISTEN_STREAK_REMINDER,
                    ":",
                    cast(ChallengeListenStreak.user_id, String),
                    ":",
                    func.to_char(ChallengeListenStreak.last_listen_date, "YYYY-MM-DD"),
                ),
                Notification.timestamp >= window_start,
            ),
        )
        .filter(
            ChallengeListenStreak.last_listen_date.between(window_start, window_end),
            Notification.id.is_(None),  # No notification sent yet in this window
        )
        .all()
    )

    new_notifications = []
    for streak in listen_streaks:
        new_notification = Notification(
            specifier=str(streak.user_id),
            group_id=get_listen_streak_notification_group_id(
                streak.user_id,
                streak.last_listen_date.date(),
            ),
            blocknumber=None,  # Not blockchain related
            user_ids=[streak.user_id],
            type=LISTEN_STREAK_REMINDER,
            data={
                "streak": streak.listen_streak,
            },
            timestamp=datetime.now(),
        )
        new_notifications.append(new_notification)

    logger.debug(f"Inserting {len(new_notifications)} listen streak reminder notifications")
    session.add_all(new_notifications)
    session.commit()


# ####### CELERY TASKS ####### #
@celery.task(name="create_listen_streak_reminder_notifications", bind=True)
def create_listen_streak_reminder_notifications(self):
    redis = create_listen_streak_reminder_notifications.redis
    db = create_listen_streak_reminder_notifications.db

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(
        "create_listen_streak_reminder_notifications_lock", blocking_timeout=25, timeout=600
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _create_listen_streak_reminder_notifications(session)
        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"Error creating listen streak reminder notifications: {e}")
    finally:
        if have_lock:
            update_lock.release()
