import logging  # pylint: disable=C0302
from datetime import datetime

from dateutil import parser
from src.models.users.user import User
from src.utils import helpers, redis_connection
from src.utils.redis_cache import (
    get_all_json_cached_key,
    get_user_id_cache_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)

# Cache unpopulated users for 5 min
ttl_sec = 5 * 60

user_datetime_fields = []
for column in User.__table__.c:
    if column.type.python_type == datetime:
        user_datetime_fields.append(column.name)


def get_cached_users(user_ids):
    redis_user_id_keys = list(map(get_user_id_cache_key, user_ids))
    redis = redis_connection.get_redis()
    users = get_all_json_cached_key(redis, redis_user_id_keys)
    for user in users:
        if user:
            for field in user_datetime_fields:
                if user[field]:
                    user[field] = parser.parse(user[field])
    return users


def set_users_in_cache(users):
    redis = redis_connection.get_redis()
    for user in users:
        key = get_user_id_cache_key(user["user_id"])
        set_json_cached_key(redis, key, user, ttl_sec)


def get_unpopulated_users(session, user_ids):
    """
    Fetches users by checking the redis cache first then
    going to DB and writes to cache if not present

    Args:
        session: DB session
        user_ids: array A list of user ids

    Returns:
        Array of users
    """
    cached_users_results = get_cached_users(user_ids)
    has_all_users_cached = cached_users_results.count(None) == 0
    if has_all_users_cached:
        return cached_users_results

    cached_users = {}
    for cached_user in cached_users_results:
        if cached_user:
            cached_users[cached_user["user_id"]] = cached_user

    user_ids_to_fetch = filter(lambda user_id: user_id not in cached_users, user_ids)

    users = (
        session.query(User)
        .filter(User.is_current == True, User.wallet != None, User.handle != None)
        .filter(User.user_id.in_(user_ids_to_fetch))
        .all()
    )
    users = helpers.query_result_to_list(users)
    queried_users = {user["user_id"]: user for user in users}

    set_users_in_cache(users)

    users_response = []
    for user_id in user_ids:
        if user_id in cached_users:
            users_response.append(cached_users[user_id])
        elif user_id in queried_users:
            users_response.append(queried_users[user_id])

    return users_response
