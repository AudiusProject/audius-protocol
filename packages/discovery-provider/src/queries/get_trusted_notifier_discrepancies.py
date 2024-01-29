import json
from datetime import datetime, timedelta, timezone

from redis import Redis
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import text

from src.models.delisting.delist_status_cursor import DelistEntity, DelistStatusCursor
from src.models.delisting.track_delist_status import TrackDelistStatus
from src.models.delisting.user_delist_status import UserDelistStatus
from src.utils import db_session, redis_connection
from src.utils.redis_constants import (
    TRACK_DELIST_DISCREPANCIES_KEY,
    TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
    TRACK_DELIST_STATUS_CURSOR_CHECK_KEY,
    TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
    USER_DELIST_DISCREPANCIES_KEY,
    USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
    USER_DELIST_STATUS_CURSOR_CHECK_KEY,
    USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def check_user_delist_status_cursor(session: Session, redis: Redis):
    try:
        if redis is None:
            raise Exception("Invalid arguments for get_cursors")
        user_cursor_check_timestamp = redis.get(
            USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY
        )
        if user_cursor_check_timestamp:
            latest_check = datetime.utcfromtimestamp(
                float(user_cursor_check_timestamp.decode())
            ).replace(tzinfo=timezone.utc)
            # Only run query every 12h
            if latest_check > datetime.now(timezone.utc) - timedelta(hours=12):
                user_delist_cursor_check = redis.get(
                    USER_DELIST_STATUS_CURSOR_CHECK_KEY
                )
                if user_delist_cursor_check is not None:
                    user_delist_cursor_check = user_delist_cursor_check.decode()
                if user_delist_cursor_check != "ok":
                    # If not ok, re-run query every 1 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=1):
                        return user_delist_cursor_check
                else:
                    return user_delist_cursor_check

        latest_user_delist_cursor = (
            session.query(DelistStatusCursor.created_at)
            .filter(DelistStatusCursor.entity == DelistEntity.USERS)
            .first()
        )
        latest_user_delist_status_timestamp = (
            session.query(UserDelistStatus.created_at)
            .order_by(desc(UserDelistStatus.created_at))
            .first()
        )
        ok = "ok"
        if latest_user_delist_cursor != latest_user_delist_status_timestamp:
            ok = "not ok"
        redis.set(
            USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
            datetime.now(timezone.utc).timestamp(),
        )
        redis.set(USER_DELIST_STATUS_CURSOR_CHECK_KEY, ok)
        return ok
    except Exception as e:
        logger.error(
            "get_trusted_notifier_discrepancies.py | issue with user delist cursor check %s",
            exc_info=e,
        )
        pass


def check_track_delist_status_cursor(session: Session, redis: Redis):
    try:
        if redis is None:
            raise Exception("Invalid arguments for get_cursors")
        track_cursor_check_timestamp = redis.get(
            TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY
        )
        if track_cursor_check_timestamp:
            latest_check = datetime.utcfromtimestamp(
                float(track_cursor_check_timestamp.decode())
            ).replace(tzinfo=timezone.utc)
            # Only run query every 12h
            if latest_check > datetime.now(timezone.utc) - timedelta(hours=12):
                track_delist_cursor_check = redis.get(
                    TRACK_DELIST_STATUS_CURSOR_CHECK_KEY
                )
                if track_delist_cursor_check is not None:
                    track_delist_cursor_check = track_delist_cursor_check.decode()
                if track_delist_cursor_check != "ok":
                    # If not ok, re-run query every 1 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=1):
                        return track_delist_cursor_check
                else:
                    return track_delist_cursor_check

        latest_track_delist_cursor = (
            session.query(DelistStatusCursor.created_at)
            .filter(DelistStatusCursor.entity == DelistEntity.TRACKS)
            .first()
        )
        latest_track_delist_status_timestamp = (
            session.query(TrackDelistStatus.created_at)
            .order_by(desc(TrackDelistStatus.created_at))
            .first()
        )
        ok = "ok"
        if latest_track_delist_cursor != latest_track_delist_status_timestamp:
            ok = "not ok"
        redis.set(
            TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY,
            datetime.now(timezone.utc).timestamp(),
        )
        redis.set(TRACK_DELIST_STATUS_CURSOR_CHECK_KEY, ok)
        return ok
    except Exception as e:
        logger.error(
            "get_trusted_notifier_discrepancies.py | issue with track delist cursor check %s",
            exc_info=e,
        )
        pass


def get_user_delist_discrepancies(session: Session, redis: Redis):
    try:
        if redis is None:
            raise Exception("Invalid arguments for get_user_delist_discrepancies")
        user_delist_discrepancies_timestamp = redis.get(
            USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY
        )
        if user_delist_discrepancies_timestamp:
            latest_check = datetime.utcfromtimestamp(
                float(user_delist_discrepancies_timestamp.decode())
            ).replace(tzinfo=timezone.utc)
            # Only run query every 12h
            if latest_check > datetime.now(timezone.utc) - timedelta(hours=12):
                user_delist_discrepancies = redis.get(USER_DELIST_DISCREPANCIES_KEY)
                if user_delist_discrepancies is not None:
                    user_delist_discrepancies = user_delist_discrepancies.decode()
                if user_delist_discrepancies != "[]":
                    # If discrepancies, re-run query every 1 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=1):
                        return user_delist_discrepancies
                else:
                    return user_delist_discrepancies

        sql = text(
            """
            with user_delists as (
            select distinct on (user_id)
                user_id,
                delisted,
                created_at
                from user_delist_statuses
                order by user_id, created_at desc
            )
            select
                users.user_id,
                users.is_available,
                user_delists.delisted,
                user_delists.created_at as delist_created_at
            from users
            join user_delists on users.user_id = user_delists.user_id
            where users.is_current and users.is_available = user_delists.delisted;
            """
        )
        result = session.execute(sql).fetchall()
        user_delist_discrepancies = json.dumps(
            [dict(row) for row in result], default=str
        )
        if user_delist_discrepancies != "[]":
            logger.info(
                f"get_trusted_notifier_discrepancies.py | found user delist discrepancies: {user_delist_discrepancies}"
            )
        redis.set(
            USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
            datetime.now(timezone.utc).timestamp(),
        )
        redis.set(USER_DELIST_DISCREPANCIES_KEY, user_delist_discrepancies)
        return user_delist_discrepancies
    except Exception as e:
        logger.error(
            "get_trusted_notifier_discrepancies.py | issue with user delist discrepancies %s",
            exc_info=e,
        )
        pass


def get_track_delist_discrepancies(session: Session, redis: Redis):
    try:
        if redis is None:
            raise Exception("Invalid arguments for get_track_delist_discrepancies")
        track_delist_discrepancies_timestamp = redis.get(
            TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY
        )
        if track_delist_discrepancies_timestamp:
            latest_check = datetime.utcfromtimestamp(
                float(track_delist_discrepancies_timestamp.decode())
            ).replace(tzinfo=timezone.utc)
            # Only run query every 12h
            if latest_check > datetime.now(timezone.utc) - timedelta(hours=12):
                track_delist_discrepancies = redis.get(TRACK_DELIST_DISCREPANCIES_KEY)
                if track_delist_discrepancies is not None:
                    track_delist_discrepancies = track_delist_discrepancies.decode()
                if track_delist_discrepancies != "[]":
                    # If discrepancies, re-run query every 1 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=1):
                        return track_delist_discrepancies
                else:
                    return track_delist_discrepancies

        sql = text(
            """
            with track_delists as (
            select distinct on (track_id)
                track_id,
                delisted,
                created_at
                from track_delist_statuses
                order by track_id, created_at desc
            )
            select
                tracks.track_id,
                tracks.is_available,
                track_delists.delisted,
                track_delists.created_at as delist_created_at
            from tracks
            join track_delists on tracks.track_id = track_delists.track_id
            where tracks.is_current and tracks.is_available = track_delists.delisted;
            """
        )
        result = session.execute(sql).fetchall()
        track_delist_discrepancies = json.dumps(
            [dict(row) for row in result], default=str
        )
        if track_delist_discrepancies != "[]":
            logger.info(
                f"get_trusted_notifier_discrepancies.py | found track delist discrepancies: {track_delist_discrepancies}"
            )
        redis.set(
            TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
            datetime.now(timezone.utc).timestamp(),
        )
        redis.set(TRACK_DELIST_DISCREPANCIES_KEY, track_delist_discrepancies)
        return track_delist_discrepancies
    except Exception as e:
        logger.error(
            "get_trusted_notifier_discrepancies.py | issue with track delist discrepancies %s",
            exc_info=e,
        )
        pass


def get_trusted_notifier_discrepancies():
    """
    Gets trusted notifier discrepancies for the service

    Returns a tuple of health results and a boolean indicating an error
    """
    redis = redis_connection.get_redis()
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_delist_status_cursor_ok = check_user_delist_status_cursor(session, redis)
        track_delist_status_cursor_ok = check_track_delist_status_cursor(session, redis)
        user_delist_discrepancies = get_user_delist_discrepancies(session, redis)
        track_delist_discrepancies = get_track_delist_discrepancies(session, redis)
        health_results = {
            "user_delist_status_cursor_caught_up": user_delist_status_cursor_ok,
            "track_delist_status_cursor_caught_up": track_delist_status_cursor_ok,
            "user_delist_discrepancies": user_delist_discrepancies,
            "track_delist_discrepancies": track_delist_discrepancies,
        }
        is_unhealthy = (
            user_delist_status_cursor_ok != "ok"
            or track_delist_status_cursor_ok != "ok"
            or user_delist_discrepancies != "[]"
            or track_delist_discrepancies != "[]"
        )
        return health_results, is_unhealthy


def get_delist_statuses_ok():
    _, is_unhealthy = get_trusted_notifier_discrepancies()
    return not is_unhealthy
