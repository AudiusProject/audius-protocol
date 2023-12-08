import json
from datetime import datetime, timezone
from typing import Dict, List, Set
from urllib.parse import quote

from redis import Redis
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import text

from src.models.delisting.delist_status_cursor import DelistEntity, DelistStatusCursor
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries.get_trusted_notifier_discrepancies import (
    get_track_delist_discrepancies,
    get_user_delist_discrepancies,
)
from src.tasks.celery_app import celery
from src.utils.auth_helpers import signed_get
from src.utils.config import shared_config
from src.utils.prometheus_metric import save_duration_metric
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)

UPDATE_DELIST_STATUSES_LOCK = "update_delist_statuses_lock"
DEFAULT_LOCK_TIMEOUT_SECONDS = 30 * 60  # 30 minutes
DELIST_BATCH_SIZE = 5000
DATETIME_FORMAT_STRING = "%Y-%m-%d %H:%M:%S.%f+00"
ALTERNATE_DATETIME_FORMAT_STRING = "%Y-%m-%d %H:%M:%S+00"


def query_users_by_user_ids(session: Session, user_ids: Set[int]) -> List[User]:
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


def query_tracks_by_track_ids(session: Session, track_ids: Set[int]) -> List[Track]:
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


def update_user_is_available_statuses(
    session: Session, users: List[Dict], current_block_timestamp: int
):
    """Update users table to reflect delist statuses"""
    # If there are duplicate user ids with different delist values in users,
    # only the most recent value is persisted because users is sorted by asc createdAt
    user_delist_map = {}
    for user in users:
        user_id = user["userId"]
        delisted = user["delisted"]

        try:
            delist_timestamp = datetime.strptime(
                user["createdAt"], DATETIME_FORMAT_STRING
            ).timestamp()
        except ValueError:
            delist_timestamp = datetime.strptime(
                user["createdAt"], ALTERNATE_DATETIME_FORMAT_STRING
            ).timestamp()

        user_delist_map[user_id] = {
            "delisted": delisted,
            "delist_timestamp": delist_timestamp,
        }

    user_ids = set(user_delist_map.keys())
    users_to_update = query_users_by_user_ids(session, user_ids)
    user_ids_to_update = set(map(lambda user: user.user_id, users_to_update))

    if len(user_delist_map) != len(user_ids_to_update):
        # Halt processing until indexing is caught up and all users are created in db
        missing_user_ids = user_ids - user_ids_to_update
        # However, do not wait for missing users for which the delist was created before
        # the current_block_timestamp. Since user created at < delist created at, if
        # delist created at < current block timestamp, we know we've indexed past the point
        # the CREATE USER was written to chain and we won't index the CREATE USER again
        # going forward. If the user is missing on this node at this point, it'll never
        # be created. This is to keep delisting unblocked despite data inconsistencies.

        def wait_for_user_to_be_indexed(user_id):
            return (
                user_delist_map[user_id]["delist_timestamp"] > current_block_timestamp
            )

        missing_user_ids_to_wait_for = set(
            filter(
                wait_for_user_to_be_indexed,
                missing_user_ids,
            )
        )
        if len(missing_user_ids_to_wait_for) > 0:
            logger.info(
                f"update_delist_statuses.py | waiting for missing user ids to be indexed: {missing_user_ids_to_wait_for}, current_block_timestamp: {current_block_timestamp}"
            )
            return False, []

        logger.info(
            f"update_delist_statuses.py | ignoring delists for missing user ids: {missing_user_ids}, current_block_timestamp: {current_block_timestamp}"
        )

    for user_to_update in users_to_update:
        delisted = user_delist_map[user_to_update.user_id]["delisted"]
        if delisted:
            # Deactivate active users that have been delisted
            if user_to_update.is_available:
                user_to_update.is_available = False
                user_to_update.is_deactivated = True
        else:
            # Re-activate deactivated users that have been un-delisted
            if not user_to_update.is_available:
                user_to_update.is_available = True
                user_to_update.is_deactivated = False

    users_updated = list(
        map(
            lambda user: {"user_id": user.user_id, "blocknumber": user.blocknumber},
            users_to_update,
        )
    )
    return True, users_updated


def update_track_is_available_statuses(
    session: Session, tracks: List[Dict], current_block_timestamp: int
):
    """Update tracks table to reflect delist statuses"""
    # If there are duplicate track ids with different delist values in tracks,
    # only the most recent value is persisted because tracks is sorted by asc createdAt
    track_delist_map = {}
    for track in tracks:
        track_id = track["trackId"]
        delisted = track["delisted"]

        try:
            delist_timestamp = datetime.strptime(
                track["createdAt"], DATETIME_FORMAT_STRING
            ).timestamp()
        except ValueError:
            delist_timestamp = datetime.strptime(
                track["createdAt"], ALTERNATE_DATETIME_FORMAT_STRING
            ).timestamp()

        track_delist_map[track_id] = {
            "delisted": delisted,
            "delist_timestamp": delist_timestamp,
        }

    track_ids = set(track_delist_map.keys())
    tracks_to_update = query_tracks_by_track_ids(session, track_ids)
    track_ids_to_update = set(map(lambda track: track.track_id, tracks_to_update))

    if len(track_delist_map) != len(track_ids_to_update):
        # Halt processing until indexing is caught up and all tracks are created in db
        missing_track_ids = track_ids - track_ids_to_update
        # However, do not wait for missing tracks for which the delist was created before
        # the current_block_timestamp. Since track created at < delist created at, if
        # delist created at < current block timestamp, we know we've indexed past the point
        # the CREATE TRACK was written to chain and we won't index the CREATE TRACK again
        # going forward. If the track is missing on this node at this point, it'll never
        # be created. This is to keep delisting unblocked despite data inconsistencies.

        def wait_for_track_to_be_indexed(track_id):
            return (
                track_delist_map[track_id]["delist_timestamp"] > current_block_timestamp
            )

        missing_track_ids_to_wait_for = set(
            filter(
                wait_for_track_to_be_indexed,
                missing_track_ids,
            )
        )
        if len(missing_track_ids_to_wait_for) > 0:
            logger.info(
                f"update_delist_statuses.py | waiting for missing track ids to be indexed: {missing_track_ids_to_wait_for}, current block timestamp: {current_block_timestamp}"
            )
            return False, []

        logger.info(
            f"update_delist_statuses.py | ignoring delists for missing track ids: {missing_track_ids}, current_block_timestamp: {current_block_timestamp}"
        )

    for track_to_update in tracks_to_update:
        delisted = track_delist_map[track_to_update.track_id]["delisted"]
        if delisted:
            # Delist available tracks that have been delisted
            if track_to_update.is_available:
                track_to_update.is_available = False
                track_to_update.is_delete = True
        else:
            # Relist unavailable tracks that have been relisted
            if not track_to_update.is_available:
                track_to_update.is_available = True
                track_to_update.is_delete = False
    tracks_updated = list(
        map(
            lambda track: {
                "track_id": track.track_id,
                "blocknumber": track.blocknumber,
            },
            tracks_to_update,
        )
    )
    return True, tracks_updated


def insert_user_delist_statuses(session: Session, users: List[Dict]):
    sql = text(
        """
        INSERT INTO user_delist_statuses (created_at, user_id, delisted, reason)
        SELECT *
        FROM (
            SELECT
              unnest((:created_at)::timestamptz[]) AS created_at,
              unnest(:user_id) AS user_id,
              unnest(:delisted) AS delisted,
              unnest((:reason)::delist_user_reason[]) AS reason
        ) AS data
        ON CONFLICT DO NOTHING;
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


def insert_track_delist_statuses(session: Session, tracks: List[Dict]):
    sql = text(
        """
        INSERT INTO track_delist_statuses
        (created_at, track_id, owner_id, track_cid, delisted, reason)
        SELECT *
        FROM (
            SELECT
              unnest((:created_at)::timestamptz[]) AS created_at,
              unnest(:track_id) AS track_id,
              unnest(:owner_id) AS owner_id,
              unnest(:track_cid) AS track_cid,
              unnest(:delisted) AS delisted,
              unnest((:reason)::delist_track_reason[]) AS reason
        ) AS data
        ON CONFLICT DO NOTHING;
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


def update_delist_status_cursor(
    session: Session, cursor: str, endpoint: str, entity: str
):
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


def process_user_delist_statuses(
    session: Session, resp: Dict, endpoint: str, current_block_timestamp: int
):
    # Expect users in resp to be sorted by createdAt asc
    users = resp["result"]["users"]
    if len(users) > 0:
        insert_user_delist_statuses(session, users)
        try:
            success, users_updated = update_user_is_available_statuses(
                session, users, current_block_timestamp
            )
            if success:
                cursor_after = users[-1]["createdAt"]
                update_delist_status_cursor(
                    session, cursor_after, endpoint, DelistEntity.USERS
                )
                logger.info(
                    f"update_delist_statuses.py | processed {len(users_updated)} user delist statuses: {users_updated}"
                )
        except Exception as e:
            logger.error(
                f"update_delist_statuses.py | exception while processing user delists: {e}"
            )


def process_track_delist_statuses(
    session: Session, resp: Dict, endpoint: str, current_block_timestamp: int
):
    # Expect tracks in resp to be sorted by createdAt asc
    tracks = resp["result"]["tracks"]
    if len(tracks) > 0:
        insert_track_delist_statuses(session, tracks)
        try:
            success, tracks_updated = update_track_is_available_statuses(
                session, tracks, current_block_timestamp
            )
            if success:
                cursor_after = tracks[-1]["createdAt"]
                update_delist_status_cursor(
                    session, cursor_after, endpoint, DelistEntity.TRACKS
                )
                logger.info(
                    f"update_delist_statuses.py | processed {len(tracks_updated)} track delist statuses: {tracks_updated}"
                )
        except Exception as e:
            logger.error(
                f"update_delist_statuses.py | exception while processing track delists: {e}"
            )


def process_delist_statuses(
    session: Session, trusted_notifier_endpoint: str, current_block_timestamp: int
):
    for entity in (DelistEntity.USERS, DelistEntity.TRACKS):
        poll_more_endpoint = f"{trusted_notifier_endpoint}statuses/{entity.lower()}?batchSize={DELIST_BATCH_SIZE}"
        cursor_before = (
            session.query(DelistStatusCursor.created_at)
            .filter(
                DelistStatusCursor.host == trusted_notifier_endpoint,
                DelistStatusCursor.entity == entity,
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
            process_user_delist_statuses(
                session, resp.json(), trusted_notifier_endpoint, current_block_timestamp
            )
        elif entity == DelistEntity.TRACKS:
            process_track_delist_statuses(
                session, resp.json(), trusted_notifier_endpoint, current_block_timestamp
            )


def get_trusted_notifier_endpoint(trusted_notifier_manager: Dict):
    endpoint = trusted_notifier_manager["endpoint"]
    if endpoint and endpoint[-1] != "/":
        endpoint += "/"
    return endpoint


def correct_delist_discrepancies(session: Session, redis: Redis):
    # Correct any cases where the indexer has overridden a delist
    # because of the race condition between the async delister and
    # indexer tasks.
    track_delist_discrepancies_str = get_track_delist_discrepancies(session, redis)
    if track_delist_discrepancies_str != "[]":
        logger.info(
            f"update_delist_statuses.py | correct_delist_discrepancies | Identified track delist discrepancies to correct: {track_delist_discrepancies_str}"
        )
        track_delist_discrepancies = json.loads(track_delist_discrepancies_str)

        for row in track_delist_discrepancies:
            track_id = row["track_id"]
            delisted = row["delisted"]
            tracks_to_update = query_tracks_by_track_ids(session, set([track_id]))
            for track_to_update in tracks_to_update:
                if delisted:
                    # Delist available tracks that have been delisted
                    logger.info(
                        f"update_delist_statuses.py | correct_delist_discrepancies | Delisting track {track_id}"
                    )
                    if track_to_update.is_available:
                        track_to_update.is_available = False
                        track_to_update.is_delete = True
                else:
                    # Relist unavailable tracks that have been relisted
                    logger.info(
                        f"update_delist_statuses.py | correct_delist_discrepancies | Re-listing track {track_id}"
                    )
                    if not track_to_update.is_available:
                        track_to_update.is_available = True
                        track_to_update.is_delete = False
        logger.info(
            "update_delist_statuses.py | correct_delist_discrepancies | Track delist discrepancies corrected"
        )

    user_delist_discrepancies_str = get_user_delist_discrepancies(session, redis)
    if user_delist_discrepancies_str != "[]":
        logger.info(
            f"update_delist_statuses.py | correct_delist_discrepancies | Identified user delist discrepancies to correct: {user_delist_discrepancies_str}"
        )
        user_delist_discrepancies = json.loads(user_delist_discrepancies_str)
        for row in user_delist_discrepancies:
            user_id = row["user_id"]
            delisted = row["delisted"]
            users_to_update = query_users_by_user_ids(session, set([user_id]))
            for user_to_update in users_to_update:
                if delisted:
                    logger.info(
                        f"update_delist_statuses.py | correct_delist_discrepancies | Deactivating user {user_id}"
                    )
                    # Deactivate active users that have been delisted
                    if user_to_update.is_available:
                        user_to_update.is_available = False
                        user_to_update.is_deactivated = True
                else:
                    # Re-activate deactivated users that have been relisted
                    logger.info(
                        f"update_delist_statuses.py | correct_delist_discrepancies | Re-activating user {user_id}"
                    )
                    if not user_to_update.is_available:
                        user_to_update.is_available = True
                        user_to_update.is_deactivated = False
        logger.info(
            "update_delist_statuses.py | correct_delist_discrepancies | User delist discrepancies corrected"
        )


# ####### CELERY TASKS ####### #


@celery.task(name="revert_delist_status_cursors", bind=True)
@save_duration_metric(metric_group="celery_task")
@log_duration(logger)
def revert_delist_status_cursors(self, reverted_cursor_timestamp: float):
    """Sets the cursors in delist_status_cursor back upon a block reversion"""
    db = revert_delist_status_cursors.db
    redis = revert_delist_status_cursors.redis
    trusted_notifier_manager = update_delist_statuses.trusted_notifier_manager
    if not trusted_notifier_manager:
        logger.error(
            "update_delist_statuses.py | failed to get trusted notifier from chain. not reverting delist status cursors"
        )
        return
    endpoint = get_trusted_notifier_endpoint(trusted_notifier_manager)

    have_lock = False
    # Same lock as the update delist task to ensure the reverted cursor doesn't get overwritten
    update_lock = redis.lock(
        UPDATE_DELIST_STATUSES_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )
    have_lock = update_lock.acquire(blocking_timeout=25)
    if have_lock:
        try:
            with db.scoped_session() as session:
                reverted_cursor = datetime.utcfromtimestamp(
                    reverted_cursor_timestamp
                ).replace(tzinfo=timezone.utc)
                update_sql = text(
                    """
                    UPDATE delist_status_cursor
                    SET created_at = :cursor
                    WHERE entity = :entity AND host = :host;
                    """
                )
                users_cursor = (
                    session.query(DelistStatusCursor.created_at)
                    .filter(
                        DelistStatusCursor.entity == DelistEntity.USERS,
                        DelistStatusCursor.host == endpoint,
                    )
                    .first()
                )
                if users_cursor and users_cursor[0] > reverted_cursor:
                    session.execute(
                        update_sql,
                        {
                            "cursor": reverted_cursor,
                            "entity": DelistEntity.USERS,
                            "host": endpoint,
                        },
                    )
                    logger.info(
                        f"update_delist_statuses.py | revert_delist_status_cursors | Reverted {DelistEntity.USERS} delist cursors to {reverted_cursor}"
                    )
                tracks_cursor = (
                    session.query(DelistStatusCursor.created_at)
                    .filter(
                        DelistStatusCursor.entity == DelistEntity.TRACKS,
                        DelistStatusCursor.host == endpoint,
                    )
                    .first()
                )
                if tracks_cursor and tracks_cursor[0] > reverted_cursor:
                    session.execute(
                        update_sql,
                        {
                            "cursor": reverted_cursor,
                            "entity": DelistEntity.TRACKS,
                            "host": endpoint,
                        },
                    )
                    logger.info(
                        f"update_delist_statuses.py | revert_delist_status_cursors | Reverted {DelistEntity.TRACKS} delist cursors to {reverted_cursor}"
                    )

        except Exception as e:
            logger.error(
                "update_delist_statuses.py | revert_delist_status_cursors | Fatal error in main loop",
                exc_info=True,
            )
            raise e
        finally:
            if have_lock:
                update_lock.release()
    else:
        logger.warning(
            "update_delist_statuses.py | revert_delist_status_cursors | Lock not acquired",
            exc_info=True,
        )


@celery.task(name="update_delist_statuses", bind=True)
@save_duration_metric(metric_group="celery_task")
@log_duration(logger)
def update_delist_statuses(self, current_block_timestamp: int) -> None:
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
                trusted_notifier_endpoint = get_trusted_notifier_endpoint(
                    trusted_notifier_manager
                )
                process_delist_statuses(
                    session, trusted_notifier_endpoint, current_block_timestamp
                )
            with db.scoped_session() as session:
                # Address edge case from the race condition between
                # the async indexer and delister tasks by checking every
                # delist and identifying and correcting discrepancies
                # in the tracks/users tables.
                correct_delist_discrepancies(session, redis)
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
