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
            slot > :prev_slot AND
            slot <= :current_slot
    GROUP BY
            sender_user_id
            , receiver_user_id
    ON CONFLICT (sender_user_id, receiver_user_id)
    DO UPDATE
        SET amount = EXCLUDED.amount + aggregate_user_tips.amount
"""


def _update_aggregate_tips(session: Session):

    max_slot_result = session.query(func.max(UserTip.slot)).one()
    max_slot = int(max_slot_result[0]) if max_slot_result[0] is not None else 0
    update_aggregate_table(
        logger,
        session,
        AGGREGATE_TIPS,
        UPDATE_AGGREGATE_USER_TIPS_QUERY,
        "slot",
        max_slot,
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
