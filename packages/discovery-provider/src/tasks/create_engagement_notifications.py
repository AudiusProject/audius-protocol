from datetime import datetime, timedelta

from sqlalchemy import String, and_, func

from src.models.notifications.notification import Notification
from src.models.rewards.challenge import Challenge
from src.models.rewards.challenge_disbursement import ChallengeDisbursement
from src.models.rewards.user_challenge import UserChallenge
from src.tasks.celery_app import celery
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)
BATCH_SIZE = 500
CLAIMABLE_REWARD = "claimable_reward"
START_DATETIME = datetime(2024, 6, 6)


def get_claimable_reward_notification_group_id(user_id, challenge_id, specifier):
    return (
        f"{CLAIMABLE_REWARD}:{user_id}:challenge:{challenge_id}:specifier:{specifier}"
    )


@log_duration(logger)
def _create_engagement_notifications(session):
    week_cooldown_interval = timedelta(weeks=1)

    new_notifications = []

    user_challenges_cooldown_completed = (
        session.query(UserChallenge)
        .outerjoin(
            ChallengeDisbursement,
            and_(
                UserChallenge.challenge_id == ChallengeDisbursement.challenge_id,
                UserChallenge.specifier == ChallengeDisbursement.specifier,
            ),
        )
        .join(Challenge, Challenge.id == UserChallenge.challenge_id)
        .outerjoin(
            Notification,
            and_(
                Notification.specifier == UserChallenge.specifier,
                Notification.group_id
                == func.concat(
                    CLAIMABLE_REWARD,
                    ":",
                    func.cast(UserChallenge.user_id, String),
                    ":challenge:",
                    func.cast(UserChallenge.challenge_id, String),
                    ":specifier:",
                    func.cast(UserChallenge.specifier, String),
                ),
            ),
        )
        .filter(
            UserChallenge.is_complete,
            UserChallenge.completed_at >= START_DATETIME,
            UserChallenge.completed_at < datetime.now() - week_cooldown_interval,
            Challenge.cooldown_days == 7,
            ChallengeDisbursement.specifier.is_(None),  # no disbursement yet
            Notification.id.is_(None),  # no notification yet
        )
        .limit(BATCH_SIZE)
        .all()
    )
    for user_challenge in user_challenges_cooldown_completed:
        time_threshold = user_challenge.completed_at - timedelta(hours=1)
        # Query to check if there's already a claimable reward notification for this user
        existing_notification = (
            session.query(Notification)
            .filter(
                Notification.user_ids.any(
                    user_challenge.user_id
                ),  # Assumes 'user_ids' can handle multiple IDs and is searchable this way
                Notification.timestamp >= time_threshold,
                Notification.type == CLAIMABLE_REWARD,
            )
            .first()
        )
        if not existing_notification:
            new_notification = Notification(
                specifier=str(user_challenge.specifier),
                group_id=get_claimable_reward_notification_group_id(
                    user_challenge.user_id,
                    user_challenge.challenge_id,
                    user_challenge.specifier,
                ),
                blocknumber=user_challenge.completed_blocknumber,
                user_ids=[user_challenge.user_id],
                type=CLAIMABLE_REWARD,
                data={
                    "specifier": user_challenge.specifier,
                    "challenge_id": user_challenge.challenge_id,
                    "amount": user_challenge.amount,
                },
                timestamp=user_challenge.completed_at,
            )
            new_notifications.append(new_notification)
        else:
            logger.info(f"Debouncing notification for {user_challenge.user_id}")
    logger.info(f"Inserting {len(new_notifications)} claimable reward notifications")
    session.add_all(new_notifications)
    session.commit()


# ####### CELERY TASKS ####### #
@celery.task(name="create_engagement_notifications", bind=True)
def create_engagement_notifications(self):
    redis = create_engagement_notifications.redis
    db = create_engagement_notifications.db

    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock(
        "create_engagement_notifications_lock", blocking_timeout=25, timeout=600
    )
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _create_engagement_notifications(session)

        else:
            logger.info("Failed to acquire lock")
    except Exception as e:
        logger.error(f"ERROR caching node info {e}")
    finally:
        if have_lock:
            update_lock.release()
