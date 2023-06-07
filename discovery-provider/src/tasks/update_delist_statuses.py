import logging
from urllib.parse import quote
from datetime import datetime
from sqlalchemy.sql import text
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import (
    save_duration_metric,
)
from typing import Any, List, Tuple, TypedDict, Dict, Union
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.eth_contracts_helpers import fetch_trusted_notifier_info
from web3 import Web3
from redis import Redis
from src.utils.config import shared_config
from sqlalchemy.orm.session import Session
from src.utils.auth_helpers import signed_get
from src.models.users.user import User
from src.models.users.delist_status_cursor import DelistStatusCursor, DelistEntity

logger = StructuredLogger(__name__)

UPDATE_DELIST_STATUSES_LOCK = "update_delist_statuses_lock"
DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60  # 30 minutes
DELIST_BATCH_SIZE = 5000
USER_QUERY_BATCH_SIZE = 1000


def query_users_by_user_ids(session: Session, user_ids: List[int]) -> List[User]:
    """Returns a list of User objects that has a user id in `user_ids`"""
    users = (
        session.query(User)
        .filter(
            User.is_current == True,
            User.user_id.in_(user_ids),
        )
        .all()
    )

    return users


def update_user_is_available_statuses(session, users):
    """Update in Users table to reflect delist statuses"""
    delisted_user_ids = []
    relisted_user_ids = []
    for user in users:
        user_id = user["userId"]
        delisted = user["delisted"]
        if delisted:
            delisted_user_ids.append(user_id)
        else:
            relisted_user_ids.append(user_id)

    for user_ids, deactivate in ((delisted_user_ids, True), (relisted_user_ids, False)):
        for i in range(0, len(user_ids), USER_QUERY_BATCH_SIZE):
            user_ids_batch = user_ids[i : i + USER_QUERY_BATCH_SIZE]
            try:
                users_to_update = query_users_by_user_ids(session, user_ids_batch)
                for user in users_to_update:
                    if deactivate:
                        # Deactivate active users that have been delisted
                        if user.is_available:
                            # Flip 'is_deactivated' flag to True
                            user.is_available = False
                            user.is_deactivated = True
                    else:
                        # Re-activate deactivated users that have been un-delisted
                        if not user.is_available:
                            # Flip 'is_deactivated' flag to False
                            user.is_available = True
                            user.is_deactivated = False
            except Exception as e:
                logger.warn(
                    f"update_delist_statuses.py | Could not process batch {user_ids_batch}: {e}\nContinuing..."
                )


def insert_user_delist_statuses(session, users):
    sql = text(
        """
        INSERT INTO user_delist_statuses (created_at, user_id, delisted, reason)
        SELECT *
        FROM (
            SELECT
              unnest(:created_at) AS created_at,
              unnest(:user_id) AS user_id,
              unnest(:delisted) AS delisted,
              unnest((:reason)::delist_user_reason[]) AS reason
        ) AS data;
        """
    )
    session.execute(
        sql,
        {
            "created_at": list(map(lambda user: user["createdAt"], users)),
            "user_id": list(map(lambda user: user["userId"], users)),
            "delisted": list(map(lambda user: user["delisted"], users)),
            "reason": list(map(lambda user: user["reason"], users)),
        }
    )


def process_user_delist_statuses(session, resp, endpoint):
    users = resp["result"]["users"]
    if len(users) > 0:
        insert_user_delist_statuses(session, users)
        update_user_is_available_statuses(session, users)
        cursor_after = users[-1]["createdAt"]
        sql = text(
            """
            INSERT INTO delist_status_cursor
            (created_at, host, entity)
            VALUES (:cursor, :endpoint, :entity)
            ON CONFLICT (host, entity)
            DO UPDATE SET created_at = EXCLUDED.created_at;
            """
        )
        session.execute(
            sql,
            {
                "cursor": cursor_after,
                "endpoint": endpoint,
                "entity": DelistEntity.USERS
            }
        )


def process_delist_statuses(session: Session, trusted_notifier_manager: Dict):
    endpoint = trusted_notifier_manager["endpoint"]
    # Only process user delist statuses
    entity = DelistEntity.USERS

    poll_more_endpoint = f"{endpoint}/statuses/{entity.lower()}?batchSize={DELIST_BATCH_SIZE}"
    cursor_before = session.query(DelistStatusCursor.created_at).filter(DelistStatusCursor.host == endpoint and DelistStatusCursor.entity == entity).first()
    if cursor_before:
        # Convert the cursor string to a datetime object
        timestamp = datetime.strptime(cursor_before, "%Y-%m-%d %H:%M:%S%z")
        # Convert the datetime object to the RFC3339Nano format
        formatted_cursor_before = quote(timestamp.strftime("%Y-%m-%dT%H:%M:%S.%f%z"))
        poll_more_endpoint += f"&cursor={formatted_cursor_before}"

    resp = signed_get(poll_more_endpoint, shared_config["delegate"]["private_key"])
    resp.raise_for_status()

    process_user_delist_statuses(session, resp.json(), endpoint)
    logger.info(f"update_delist_statuses.py | finished polling delist statuses for {entity}")


# ####### CELERY TASKS ####### #
@celery.task(name="update_delist_statuses", bind=True)
@save_duration_metric(metric_group="celery_task")
@log_duration(logger)
def update_delist_statuses(self) -> None:
    """Recurring task that polls trusted notifier for delist statuses"""

    db = update_delist_statuses.db
    redis = update_delist_statuses.redis
    trusted_notifier_manager = update_delist_statuses.trusted_notifier_manager
    if not trusted_notifier_manager:
        logger.error("update_delist_statuses.py | failed to get trusted notifier from chain. not polling delist statuses")
        return
    if trusted_notifier_manager["endpoint"] == "default.trustednotifier":
        logger.info("update_delist_statuses.py | not polling delist statuses")
        return

    have_lock = False
    update_lock = redis.lock(
        UPDATE_DELIST_STATUSES_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    have_lock = update_lock.acquire(blocking=False)
    if have_lock:
        try:
            with db.scoped_session() as session:
                process_delist_statuses(
                    session, trusted_notifier_manager
                )
                session.commit()
            session.close()

        except Exception as e:
            logger.error(
                "update_delist_statuses.py | Fatal error in main loop", exc_info=True
            )
            raise e
        finally:
            if have_lock:
                update_lock.release()
    else:
        logger.warning(
            "update_delist_statuses.py | Lock not acquired",
            exc_info=True,
        )
