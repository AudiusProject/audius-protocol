from typing import Dict, List
from urllib.parse import quote

from sqlalchemy.orm.session import Session
from sqlalchemy.sql import text
from src.models.delisting.delist_status_cursor import DelistEntity, DelistStatusCursor
from src.models.tracks.track import Track
from src.models.users.user import User
from src.tasks.celery_app import celery
from src.utils.auth_helpers import signed_get
from src.utils.config import shared_config
from src.utils.prometheus_metric import save_duration_metric
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)

UPDATE_DELIST_STATUSES_LOCK = "update_delist_statuses_lock"
DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60  # 30 minutes
DELIST_BATCH_SIZE = 5000
DN_QUERY_BATCH_SIZE = 1000


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


def query_tracks_by_track_ids(session: Session, track_ids: List[int]) -> List[Track]:
    """Returns a list of Track objects that has a track id in `track_ids`"""
    tracks = (
        session.query(Track)
        .filter(
            Track.is_current == True,
            Track.track_id.in_(track_ids),
        )
        .all()
    )

    return tracks


def update_user_is_available_statuses(session, users):
    """Update users table to reflect delist statuses"""
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
        for i in range(0, len(user_ids), DN_QUERY_BATCH_SIZE):
            user_ids_batch = user_ids[i : i + DN_QUERY_BATCH_SIZE]
            try:
                users_to_update = query_users_by_user_ids(session, user_ids_batch)
                for user in users_to_update:
                    if deactivate:
                        # Deactivate active users that have been delisted
                        if user.is_available:
                            user.is_available = False
                            user.is_deactivated = True
                    else:
                        # Re-activate deactivated users that have been un-delisted
                        if not user.is_available:
                            user.is_available = True
                            user.is_deactivated = False
            except Exception as e:
                logger.warn(
                    f"update_delist_statuses.py | Could not process user id batch {user_ids_batch}: {e}\nContinuing..."
                )


def update_track_is_available_statuses(session, tracks):
    """Update tracks table to reflect delist statuses"""
    delisted_track_ids = []
    relisted_track_ids = []
    for track in tracks:
        track_id = track["trackId"]
        delisted = track["delisted"]
        if delisted:
            delisted_track_ids.append(track_id)
        else:
            relisted_track_ids.append(track_id)

    for track_ids, deactivate in (
        (delisted_track_ids, True),
        (relisted_track_ids, False),
    ):
        for i in range(0, len(track_ids), DN_QUERY_BATCH_SIZE):
            track_ids_batch = track_ids[i : i + DN_QUERY_BATCH_SIZE]
            try:
                tracks_to_update = query_tracks_by_track_ids(session, track_ids_batch)
                for track in tracks_to_update:
                    if deactivate:
                        # Deactivate active tracks that have been delisted
                        if track.is_available:
                            track.is_available = False
                            track.is_delete = True
                    else:
                        # Re-activate deactivated tracks that have been un-delisted
                        if not track.is_available:
                            track.is_available = True
                            track.is_delete = False
            except Exception as e:
                logger.warn(
                    f"update_delist_statuses.py | Could not process track id batch {track_ids_batch}: {e}\nContinuing..."
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
        },
    )


def insert_track_delist_statuses(session, tracks):
    sql = text(
        """
        INSERT INTO track_delist_statuses
        (created_at, track_id, owner_id, track_cid, delisted, reason)
        SELECT *
        FROM (
            SELECT
              unnest(:created_at) AS created_at,
              unnest(:track_id) AS track_id,
              unnest(:owner_id) AS owner_id,
              unnest(:track_cid) AS track_cid,
              unnest(:delisted) AS delisted,
              unnest((:reason)::delist_track_reason[]) AS reason
        ) AS data;
        """
    )
    session.execute(
        sql,
        {
            "created_at": list(map(lambda track: track["createdAt"], tracks)),
            "track_id": list(map(lambda track: track["trackId"], tracks)),
            "owner_id": list(map(lambda track: track["ownerId"], tracks)),
            "track_cid": list(map(lambda track: track["trackCid"], tracks)),
            "delisted": list(map(lambda track: track["delisted"], tracks)),
            "reason": list(map(lambda track: track["reason"], tracks)),
        },
    )


def update_delist_status_cursor(session, cursor, endpoint, entity):
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
            "cursor": cursor,
            "endpoint": endpoint,
            "entity": entity,
        },
    )


def process_user_delist_statuses(session, resp, endpoint):
    users = resp["result"]["users"]
    if len(users) > 0:
        insert_user_delist_statuses(session, users)
        update_user_is_available_statuses(session, users)
        cursor_after = users[-1]["createdAt"]
        update_delist_status_cursor(session, cursor_after, endpoint, DelistEntity.USERS)


def process_track_delist_statuses(session, resp, endpoint):
    tracks = resp["result"]["tracks"]
    if len(tracks) > 0:
        insert_track_delist_statuses(session, tracks)
        update_track_is_available_statuses(session, tracks)
        cursor_after = tracks[-1]["createdAt"]
        update_delist_status_cursor(
            session, cursor_after, endpoint, DelistEntity.TRACKS
        )


def process_delist_statuses(session: Session, trusted_notifier_manager: Dict):
    endpoint = trusted_notifier_manager["endpoint"]

    for entity in (DelistEntity.USERS, DelistEntity.TRACKS):
        poll_more_endpoint = (
            f"{endpoint}/statuses/{entity.lower()}?batchSize={DELIST_BATCH_SIZE}"
        )
        cursor_before = (
            session.query(DelistStatusCursor.created_at)
            .filter(
                DelistStatusCursor.host == endpoint
                and DelistStatusCursor.entity == entity
            )
            .first()
        )
        if cursor_before:
            # Convert the datetime object to the RFC3339Nano format
            formatted_cursor_before = quote(
                cursor_before[0].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            )
            poll_more_endpoint += f"&cursor={formatted_cursor_before}"

        resp = signed_get(poll_more_endpoint, shared_config["delegate"]["private_key"])
        resp.raise_for_status()

        if entity == DelistEntity.USERS:
            process_user_delist_statuses(session, resp.json(), endpoint)
        elif entity == DelistEntity.TRACKS:
            process_track_delist_statuses(session, resp.json(), endpoint)

        logger.info(
            f"update_delist_statuses.py | finished polling delist statuses for {entity}"
        )


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
        logger.error(
            "update_delist_statuses.py | failed to get trusted notifier from chain. not polling delist statuses"
        )
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
                process_delist_statuses(session, trusted_notifier_manager)
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
