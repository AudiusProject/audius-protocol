import logging
from urllib.parse import quote
from datetime import datetime
from sqlalchemy.sql import text
from src.tasks.celery_app import celery
from src.utils.prometheus_metric import (
    save_duration_metric,
)
from typing import Any, Dict
from src.utils.structured_logger import StructuredLogger, log_duration
from src.utils.eth_contracts_helpers import fetch_trusted_notifier_info
from web3 import Web3
from redis import Redis
from src.utils.config import shared_config
from sqlalchemy.orm.session import Session
from src.utils.auth_helpers import signed_get

logger = StructuredLogger(__name__)

UPDATE_DELIST_STATUSES_LOCK = "update_delist_statuses_lock"
DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60  # 30 minutes
DELIST_BATCH_SIZE = 5000


def insert_user_delist_statuses(session, delisted_users):
    sql = text(
        """
        INSERT INTO user_delist_statuses ("createdAt", "userId", delisted", "reason")
        SELECT *
        FROM (
            SELECT
              unnest(:created_at) AS created_at,
              unnest(:user_id) AS user_id,
              unnest(:delisted) AS delisted,
              unnest(:reason) AS reason
        ) AS data;
        """
    )
    session.execute(
        sql,
        {
            "created_at": list(map(lambda user: user["createdAt"], delisted_users)),
            "user_id": list(map(lambda user: user["userId"], delisted_users)),
            "delisted": list(map(lambda user: user["delisted"], delisted_users)),
            "reason": list(map(lambda user: user["reason"], delisted_users)),
        }
    )


def process_user_delist_statuses(session, resp, endpoint):
    delisted_users = resp["result"]["users"]
    if len(delisted_users) > 0:
        insert_user_delist_statuses(session, delisted_users)
        cursor_after = delisted_users[-1]["createdAt"]
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
                "entity": "users"
            }
        )


def insert_track_delist_statuses(session, delisted_tracks):
    sql = text(
        """
        INSERT INTO track_delist_statuses ("createdAt", "trackId", "ownerId", "trackCid", "delisted", "reason")
        SELECT *
        FROM (
            SELECT
              unnest(:created_at) AS created_at,
              unnest(:track_id) AS track_id,
              unnest(:owner_id) AS owner_id,
              unnest(:track_cid) AS track_cid,
              unnest(:delisted) AS delisted,
              unnest(:reason) AS reason
        ) AS data;
        """
    )
    session.execute(
        sql,
        {
            "created_at": list(map(lambda track: track["createdAt"], delisted_tracks)),
            "track_id": list(map(lambda track: track["trackId"], delisted_tracks)),
            "owner_id": list(map(lambda track: track["ownerId"], delisted_tracks)),
            "track_cid": list(map(lambda track: track["trackCid"], delisted_tracks)),
            "delisted": list(map(lambda track: track["delisted"], delisted_tracks)),
            "reason": list(map(lambda track: track["reason"], delisted_tracks)),
        }
    )


def process_track_delist_statuses(session, resp, endpoint):
    delisted_tracks = resp["result"]["tracks"]
    if len(delisted_tracks) > 0:
        insert_track_delist_statuses(session, delisted_tracks)
        #TODO verify this isn't -?
        cursor_after = delisted_tracks[-1]["createdAt"]
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
                "entity": "tracks"
            }
        )


def process_delist_statuses(session: Session, trusted_notifier_manager: Dict):
    endpoint = trusted_notifier_manager["endpoint"]

    for entity in ("tracks", "users"):
        sql = text(
            """
            SELECT created_at
            FROM delist_status_cursor
            WHERE host = :host AND entity = :entity

            """
        )
        rows = session.execute(
            sql,
            {
                "host": endpoint,
                "entity": entity
            }
        )
        cursor_before = rows[0][0]
        # Convert the cursor string to a datetime object
        timestamp = datetime.strptime(cursor_before, "%Y-%m-%d %H:%M:%S%z")
        # Convert the datetime object to the RFC3339Nano format
        formatted_cursor_before = quote(timestamp.strftime("%Y-%m-%dT%H:%M:%S.%f%z"))
        poll_more_endpoint = f"{endpoint}/statuses/{entity}?cursor={formatted_cursor_before}&batchSize={DELIST_BATCH_SIZE}"

        resp = signed_get(poll_more_endpoint, shared_config["delegate"]["private_key"])
        resp.raise_for_status()

        if entity == "users":
            process_user_delist_statuses(session, resp.json(), endpoint)
        elif entity == "tracks":
            process_track_delist_statuses(session, resp.json(), endpoint)
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
