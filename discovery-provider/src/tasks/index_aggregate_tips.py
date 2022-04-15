import logging
from time import time
from typing import Union

from redis import Redis
from sqlalchemy import func, text
from sqlalchemy.orm.session import Session
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
"""

AGGREGATE_USER_TIPS_QUERY_TRUNCATE_INSERT = f"""
BEGIN
TRUNCATE TABLE aggregate_user_tips;
{AGGREGATE_USER_TIPS_QUERY};
COMMIT
"""


AGGREGATE_USER_TIPS_QUERY_UPDATE = f"""
{AGGREGATE_USER_TIPS_QUERY}
ON CONFLICT (sender_user_id, receiver_user_id)
DO UPDATE
    SET
        amount = EXCLUDED.amount + aggregate_user_tips.amount
"""


def _update_aggregate_tips(session: Session, redis: Redis):
    # Get last processed tip id
    last_user_tip_id = redis.get(most_recent_aggregated_user_tip_redis_key)
    last_user_tip_id = int(last_user_tip_id) if last_user_tip_id is not None else 0
    max_user_tip_id_result = session.query(func.max(UserTip.user_tip_id)).one_or_none()
    max_user_tip_id: Union[int, None] = (
        max_user_tip_id_result[0] if max_user_tip_id_result is not None else None
    )
    logger.info(f"index_aggregate_tips.py | {last_user_tip_id} {max_user_tip_id}")
    if last_user_tip_id == 0 and max_user_tip_id is not None:
        # Starting from scratch
        logger.warn(
            f"index_aggregate_tips.py | Redis missing last_user_tip_id, rebuilding {AGGREGATE_TIPS} | ({last_user_tip_id}, {max_user_tip_id}]"
        )
        session.execute(
            text(AGGREGATE_USER_TIPS_QUERY),
            {"start_user_tip_id": last_user_tip_id, "end_user_tip_id": max_user_tip_id},
        )
        # update checkpoint
        redis.set(most_recent_aggregated_user_tip_redis_key, max_user_tip_id)
    elif max_user_tip_id is not None and max_user_tip_id > last_user_tip_id:
        # Updating counts
        logger.info(
            f"index_aggregate_tips.py | Updating {AGGREGATE_TIPS} | ({last_user_tip_id}, {max_user_tip_id}]"
        )
        session.execute(
            text(AGGREGATE_USER_TIPS_QUERY_UPDATE),
            {"start_user_tip_id": last_user_tip_id, "end_user_tip_id": max_user_tip_id},
        )
        # update checkpoint
        redis.set(most_recent_aggregated_user_tip_redis_key, max_user_tip_id)
    else:
        logger.info(
            "index_aggregate_tips.py | Skipping aggregation update because there are no new tips"
        )
        return False
    return True


# ####### CELERY TASKS ####### #
@celery.task(name="index_aggregate_tips", bind=True)
def update_aggregate_tips(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db: SessionManager = update_aggregate_tips.db
    redis: Redis = update_aggregate_tips.redis

    update_lock = redis.lock(AGGREGATE_TIPS_REDIS_LOCK, timeout=60 * 10)
    logger.info("index_aggregate_tips.py | starting task")
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            start_time = time()
            with db.scoped_session() as session:
                did_update = _update_aggregate_tips(session, redis)
                if did_update:
                    logger.info(
                        f"index_aggregate_tips.py | Finished updating {AGGREGATE_TIPS} in: {time()-start_time} sec"
                    )
        else:
            logger.info(
                f"index_aggregate_tips.py | Failed to acquire {AGGREGATE_TIPS_REDIS_LOCK}"
            )

    except Exception as e:
        logger.error(
            "index_aggregate_tips.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
