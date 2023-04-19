import logging
from datetime import datetime, timezone
from typing import Any, List, Tuple, TypedDict, Union

import requests
from redis import Redis
from sqlalchemy.orm.session import Session
from src.models.users.user import User
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    save_duration_metric,
)
from src.utils.redis_constants import (
    ALL_UNAVAILABLE_USERS_REDIS_KEY,
    UPDATE_USER_IS_AVAILABLE_FINISH_REDIS_KEY,
    UPDATE_USER_IS_AVAILABLE_START_REDIS_KEY,
)
from src.utils.session_manager import SessionManager
from web3 import Web3

logger = logging.getLogger(__name__)

UPDATE_USER_IS_AVAILABLE_LOCK = "update_user_is_available_lock"

BATCH_SIZE = 1000
DEFAULT_LOCK_TIMEOUT_SECONDS = 30  # 30 seconds
REQUESTS_TIMEOUT_SECONDS = 300  # 5 minutes


class ContentNodeInfo(TypedDict):
    endpoint: str
    spID: int


def _get_redis_set_members_as_list(redis: Redis, key: str) -> List[int]:
    """Converts a redis set to an integer list"""
    values = redis.smembers(key)
    return [int(value.decode()) for value in values]


def fetch_unavailable_user_ids_in_network(
    session: Session, redis: Redis, eth_web3: Web3, eth_abi_values: Any
) -> None:
    """Fetches the unavailable user ids in the Content Node network"""
    content_nodes = query_registered_content_node_info(eth_web3, redis, eth_abi_values)

    # Clear redis for existing data
    redis.delete(ALL_UNAVAILABLE_USERS_REDIS_KEY)

    for node in content_nodes:
        # Keep mapping of spId to set of unavailable users
        unavailable_user_ids = fetch_unavailable_user_ids(node["endpoint"], session)
        spID_unavailable_users_key = get_unavailable_users_redis_key(node["spID"])

        # Clear redis for existing data
        redis.delete(spID_unavailable_users_key)

        for i in range(0, len(unavailable_user_ids), BATCH_SIZE):
            unavailable_user_ids_batch = unavailable_user_ids[i : i + BATCH_SIZE]
            redis.sadd(spID_unavailable_users_key, *unavailable_user_ids_batch)

            # Aggregate a set of unavailable users
            redis.sadd(ALL_UNAVAILABLE_USERS_REDIS_KEY, *unavailable_user_ids_batch)


def update_users_is_available_status(db: SessionManager, redis: Redis) -> None:
    """Check user availability on all unavailable users and update in Users table"""
    all_unavailable_user_ids = _get_redis_set_members_as_list(
        redis, ALL_UNAVAILABLE_USERS_REDIS_KEY
    )

    user_id_to_is_available_status = {}
    for i in range(0, len(all_unavailable_user_ids), BATCH_SIZE):
        unavailable_user_ids_batch = all_unavailable_user_ids[i : i + BATCH_SIZE]
        try:
            with db.scoped_session() as session:
                user_ids_to_replica_set = query_replica_set_by_user_id(
                    session, unavailable_user_ids_batch
                )

                for entry in user_ids_to_replica_set:
                    user_id = entry[0]

                    # Some users are do not have primary_ids or secondary_ids
                    # If these values are not null, check if user is available
                    # Else, default to user as available
                    if (
                        entry[1] is not None  # primary_id
                        and entry[2][0] is not None  # secondary_id 1
                        and entry[2][1] is not None  # secondary_id 2
                    ):
                        spID_replica_set = [entry[1], *entry[2]]
                        is_available = check_user_is_available(
                            redis=redis,
                            user_id=user_id,
                            spID_replica_set=spID_replica_set,
                        )
                    else:
                        is_available = True

                    user_id_to_is_available_status[user_id] = is_available

                # Update users with is_available status
                users = query_users_by_user_ids(session, unavailable_user_ids_batch)
                for user in users:
                    is_available = user_id_to_is_available_status[user.user_id]

                    # If user is not available, also flip 'is_deactivated' flag to True
                    if not is_available:
                        user.is_available = False
                        user.is_deactivated = True
        except Exception as e:
            logger.warn(
                f"update_user_is_available.py | Could not process batch {unavailable_user_ids_batch}: {e}\nContinuing..."
            )

    currently_unavailable_users = query_unavailable_users(session)
    for unavailable_users in currently_unavailable_users:
        is_available = (
            user_id_to_is_available_status[unavailable_users.user_id]
            if unavailable_users.user_id in user_id_to_is_available_status
            else True
        )
        if is_available:
            unavailable_users.is_available = True
            unavailable_users.is_deactivated = False


def fetch_unavailable_user_ids(node: str, session: Session) -> List[int]:
    """Fetches unavailable users from Content Node. Returns empty list if request fails"""
    unavailable_user_ids = []

    try:
        resp = requests.get(
            f"{node}/blacklist/users", timeout=REQUESTS_TIMEOUT_SECONDS
        ).json()
        unavailable_user_ids = list(set(resp["data"]["values"]))

    except Exception as e:
        logger.warn(
            f"update_user_is_available.py | Could not fetch unavailable users from {node}: {e}"
        )

    return unavailable_user_ids


def query_replica_set_by_user_id(
    session: Session, user_ids: List[int]
) -> Union[List[Tuple[int, int, List[int]]], List[Tuple[int, None, List[None]]]]:
    """
    Returns an array of tuples with the structure: [(user_id | primary_id | secondary_ids), ...]
    If `primary_id` and `secondary_ids` are undefined, will return as None
    """
    user_ids_and_replica_sets = (
        session.query(User.user_id, User.primary_id, User.secondary_ids)
        .filter(
            User.is_current == True,
            User.user_id.in_(user_ids),
        )
        .all()
    )

    return user_ids_and_replica_sets


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


def query_unavailable_users(session: Session) -> List[User]:
    """Returns a list of all users that have is_available = false"""
    users = (
        session.query(User)
        .filter(User.is_current == True, User.is_available == False)
        .all()
    )
    return users


def query_registered_content_node_info(
    eth_web3: Web3, redis: Redis, eth_abi_values: Any
) -> List[ContentNodeInfo]:
    """Returns a list of all registered Content Node endpoint and spID"""
    registered_content_nodes = list(
        fetch_all_registered_content_nodes(
            eth_web3, shared_config, redis, eth_abi_values, True
        )
    )

    def create_node_info_response(node):
        return {"endpoint": node[0], "spID": node[1]}

    return list(map(create_node_info_response, registered_content_nodes))


def check_user_is_available(
    redis: Redis, user_id: int, spID_replica_set: List[int]
) -> bool:
    """
    Checks if a user is available in the replica set. Needs to only be available
    on one replica set node to be marked as available.
        redis: redis instance
        user_id: the observed user id
        spID_replica_set: an array of the SP IDs that are associated with user
    """

    i = 0
    while i < len(spID_replica_set):
        spID_unavailable_users_key = get_unavailable_users_redis_key(
            spID_replica_set[i]
        )
        is_available_on_sp = not redis.sismember(spID_unavailable_users_key, user_id)

        if is_available_on_sp:
            return True

        i = i + 1

    return False


def get_unavailable_users_redis_key(spID: int) -> str:
    """Returns the redis key used to store the unavailable users on a sp"""
    return f"update_user_is_available:unavailable_users_{spID}"


# ####### CELERY TASKS ####### #
@celery.task(name="update_user_is_available", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_user_is_available(self) -> None:
    """Recurring task that updates whether users are available on the network"""

    db = update_user_is_available.db
    redis = update_user_is_available.redis
    eth_web3 = update_user_is_available.eth_web3
    eth_abi_values = update_user_is_available.eth_abi_values

    have_lock = False
    update_lock = redis.lock(
        UPDATE_USER_IS_AVAILABLE_LOCK,
        timeout=DEFAULT_LOCK_TIMEOUT_SECONDS,
    )

    have_lock = update_lock.acquire(blocking=False)
    if have_lock:
        metric = PrometheusMetric(
            PrometheusMetricNames.UPDATE_USER_IS_AVAILABLE_DURATION_SECONDS
        )
        try:
            # TODO: we can deprecate this manual redis timestamp tracker once we confirm
            # that prometheus works in tracking duration. Needs to be removed from
            # the health check too
            redis.set(
                UPDATE_USER_IS_AVAILABLE_START_REDIS_KEY,
                datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f %Z"),
            )

            with db.scoped_session() as session:
                fetch_unavailable_user_ids_in_network(
                    session, redis, eth_web3, eth_abi_values
                )

            update_users_is_available_status(db, redis)

            metric.save_time({"success": "true"})
        except Exception as e:
            metric.save_time({"success": "false"})
            logger.error(
                "update_user_is_available.py | Fatal error in main loop", exc_info=True
            )
            raise e
        finally:
            # TODO: see comment above about deprecation
            redis.set(
                UPDATE_USER_IS_AVAILABLE_FINISH_REDIS_KEY,
                datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f %Z"),
            )
            if have_lock:
                update_lock.release()
    else:
        logger.warning(
            "update_user_is_available.py | Lock not acquired",
            exc_info=True,
        )
