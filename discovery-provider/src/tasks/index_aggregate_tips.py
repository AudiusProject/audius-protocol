import logging

from redis import Redis
from sqlalchemy import func
from sqlalchemy.orm.session import Session
from src.models import UserTip
from src.tasks.aggregates import init_task_and_acquire_lock, update_aggregate_table
from src.tasks.celery_app import celery
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

# names of the aggregate tables to update
AGGREGATE_TIPS = "aggregate_user_tips"


UPDATE_AGGREGATE_USER_TIPS_QUERY = """
BEGIN
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
            user_tip_id > :prev_user_tip_id AND
            user_tip_id <= :current_user_tip_id
    GROUP BY
            sender_user_id
            , receiver_user_id
    ON CONFLICT (sender_user_id, receiver_user_id)
    DO UPDATE
        SET amount = EXCLUDED.amount + aggregate_user_tips.amount
INSERT INTO persistent_store (key, value)
    VALUES ('last_user_tip_id', '{"last_user_tip_id": :end_user_tip_id }')
    ON CONFLICT (key)
    DO UPDATE
        SET value = EXCLUDED.value
COMMIT
"""


def _update_aggregate_tips(session: Session):

    max_user_tip_id_result = session.query(func.max(UserTip.user_tip_id)).one_or_none()
    max_user_tip_id = (
        int(max_user_tip_id_result[0]) if max_user_tip_id_result is not None else 0
    )
    update_aggregate_table(
        logger,
        session,
        AGGREGATE_TIPS,
        UPDATE_AGGREGATE_USER_TIPS_QUERY,
        "user_tip_id",
        max_user_tip_id,
    )


# ####### CELERY TASKS ####### #
@celery.task(name="index_aggregate_tips", bind=True)
def update_aggregate_tips(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    db: SessionManager = update_aggregate_tips.db
    redis: Redis = update_aggregate_tips.redis

    init_task_and_acquire_lock(
        logger, db, redis, AGGREGATE_TIPS, _update_aggregate_tips
    )
