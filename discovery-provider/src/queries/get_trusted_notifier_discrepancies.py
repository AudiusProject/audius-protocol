import json
import logging
from sqlalchemy.sql import text
from datetime import datetime, timedelta, timezone
from redis import Redis
from src.utils import (
    db_session,
    helpers,
    redis_connection,
)
from src.utils.redis_constants import (
    TRACK_DELIST_DISCREPANCIES_KEY,
    TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
    USER_DELIST_DISCREPANCIES_KEY,
    USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
)


def get_user_delist_discrepancies(redis: Redis):
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
                user_delist_discrepancies = redis.get(USER_DELIST_DISCREPANCIES_KEY).decode()
                if user_delist_discrepancies != "[]":
                    # If discrepancies, re-run query every 5 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=5):
                        return user_delist_discrepancies
                else:
                    return user_delist_discrepancies

        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
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
            redis.set(
                USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
                datetime.now(timezone.utc).timestamp(),
            )
            redis.set(USER_DELIST_DISCREPANCIES_KEY, user_delist_discrepancies)
            return user_delist_discrepancies
    except Exception as e:
        logging.error("issue with user delist discrepancies %s", exc_info=e)
        pass


def get_track_delist_discrepancies(redis: Redis):
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
                track_delist_discrepancies = redis.get(TRACK_DELIST_DISCREPANCIES_KEY).decode()
                if track_delist_discrepancies != "[]":
                    # If discrepancies, re-run query every 5 min to quickly suppress errors
                    # once resolved
                    if latest_check > datetime.now(timezone.utc) - timedelta(minutes=5):
                        return track_delist_discrepancies
                else:
                    return track_delist_discrepancies

        db = db_session.get_db_read_replica()
        with db.scoped_session() as session:
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
            redis.set(
                TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY,
                datetime.now(timezone.utc).timestamp(),
            )
            redis.set(TRACK_DELIST_DISCREPANCIES_KEY, track_delist_discrepancies)
            return track_delist_discrepancies
    except Exception as e:
        logging.error("issue with track delist discrepancies %s", exc_info=e)
        pass


def get_trusted_notifier_discrepancies():
    """
    Gets trusted notifier discrepancies for the service

    Returns a tuple of health results and a boolean indicating an error
    """
    redis = redis_connection.get_redis()
    user_delist_discrepancies = get_user_delist_discrepancies(redis)
    track_delist_discrepancies = get_track_delist_discrepancies(redis)
    health_results = {
        "user_delist_discrepancies": user_delist_discrepancies,
        "track_delist_discrepancies": track_delist_discrepancies,
    }
    is_unhealthy = user_delist_discrepancies != "[]" or track_delist_discrepancies != "[]"
    return health_results, is_unhealthy
