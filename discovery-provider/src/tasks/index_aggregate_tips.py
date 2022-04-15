import logging

from redis import Redis
from sqlalchemy import func, text
from sqlalchemy.orm.session import Session
from src.models.aggregate_user_tips import AggregateUserTips
from src.models.user_tip import UserTip
from src.tasks.celery_app import celery
from src.utils.redis_constants import most_recent_aggregated_user_tip_redis_key
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

# names of the aggregate tables to update
AGGREGATE_TIPS = "aggregate_user_tips"

# Redis Lock
AGGREGATE_TIPS_REDIS_LOCK = "update_aggregate_table:aggregate_user_tips"

# Redis last user tip ID
AGGREGATE_TIPS_LAST_USER_TIP_ID_KEY = "aggregate_user_tips:last_user_tip_id"

AGGREGATE_USER_TIPS_QUERY = """
INSERT INTO aggregate_user_tips (
        sender_user_id
        , receiver_user_id
        , amount
    )
    SELECT 
            sender_user_id
            , receiver_user_id
            , SUM(amount) as amount
    FROM user_tips
    WHERE
            user_tip_id > :start_user_tip_id AND
            user_tip_id <= :end_user_tip_id
    GROUP BY
            sender_user_id
            , receiver_user_id
ON CONFLICT (sender_user_id, receiver_user_id)
DO UPDATE
    SET
        amount = EXCLUDED.amount + aggregate_user_tips.amount
"""


def _update_aggregate_tips(session: Session, redis: Redis):
    # Get last processed tip id
    last_user_tip_id = redis.get(most_recent_aggregated_user_tip_redis_key)
    max_user_tip_id = session.query(func.max(UserTip.user_tip_id)).one_or_none()
    if max_user_tip_id and max_user_tip_id > last_user_tip_id:
        logger.info(
            f"index_aggregate_tips.py | Updating {AGGREGATE_TIPS} | ({last_user_tip_id}, {max_user_tip_id}]"
        )
        session.execute(
            text(AGGREGATE_USER_TIPS_QUERY),
            {"start_user_tip_id": last_user_tip_id, "end_user_tip_id": max_user_tip_id},
        )
        # update checkpoint
        redis.set(most_recent_aggregated_user_tip_redis_key, max_user_tip_id)
    else:
        logger.info(
            "index_aggregate_tips.py | Skipping aggregation update because there are no new tips"
        )


# ####### CELERY TASKS ####### #
@celery.task(name="update_aggregate_tips", bind=True)
def update_aggregate_tips(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db: SessionManager = update_aggregate_tips.db
    redis: Redis = update_aggregate_tips.redis

    update_lock = redis.lock(AGGREGATE_TIPS_REDIS_LOCK, timeout=60 * 10)

    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            with db.scoped_session() as session:
                _update_aggregate_tips(session, redis)

    except Exception as e:
        logger.error(
            "index_aggregate_tips.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
