
import logging
from datetime import datetime, timedelta
from src.models import UserBalance

logger = logging.getLogger(__name__)

# How stale of current_user balance we will tolerate before refreshing.
BALANCE_REFRESH_SEC_CURRENT_USER = 5 * 60

# How stale of a non-zero user balance we tolerate before refrshing
BALANCE_REFRESH_SEC_NONEMPTY_USER = 30 * 60

# How stale of a zero user balance we tolerate before refrshing
BALANCE_REFRESH_SEC_EMPTY_USER = 12 * 60 * 60

REDIS_PREFIX = "USER_BALANCE_REFRESH"

def does_user_balance_need_refresh(user_balance, is_current_user = True):
    '''Returns whether a given user_balance needs update.
    Very heuristic-y:
        - If we're the current_user, update on the shortest interval
        - If we're not the current user but we have some balance, update on medium interval
        - If we're not the current user and we have no balance, update on slowest interval
    '''

    if user_balance.updated_at == user_balance.created_at:
        return True

    threshold = None
    if is_current_user:
        threshold = BALANCE_REFRESH_SEC_CURRENT_USER
    elif int(user_balance.balance) > 0:
        threshold = BALANCE_REFRESH_SEC_NONEMPTY_USER
    else:
        threshold = BALANCE_REFRESH_SEC_EMPTY_USER

    delta = timedelta(seconds=threshold)
    needs_refresh = user_balance.updated_at < (datetime.now() - delta)
    return needs_refresh

def enqueue_balance_refresh(redis, user_ids):
    # unsafe to call redis.sadd w/ empty array
    if not user_ids:
        return
    redis.sadd(REDIS_PREFIX, *user_ids)

def get_balances(session, redis, user_ids):
    """Gets user balances.
       Returns mapping { user_id: balance }
       Enqueues in Redis user balances requiring refresh.
    """

    # Find user balances
    query = ((
        session.query(UserBalance)
    ).filter(
        UserBalance.user_id.in_(user_ids)
    ).all())

    # Construct result dict from query result
    result = {user_balance.user_id: user_balance.balance for user_balance in query}

    # Find user_ids that don't yet have a balance
    user_ids_set = set(user_ids)
    fetched_user_ids_set = {x.user_id for x in query}
    needs_balance_set = user_ids_set - fetched_user_ids_set

    # Add new balances to result set
    no_balance_dict = {user_id: 0 for user_id in needs_balance_set}
    result.update(no_balance_dict)

    # Add new balances to DB
    new_user_balances = [UserBalance(user_id=x, balance=0) for x in needs_balance_set]
    session.add_all(new_user_balances)

    # Get old balances that need refresh
    needs_refresh = [user_balance.user_id for user_balance in query if does_user_balance_need_refresh(user_balance, False)]

    # Enqueue new balances to Redis refresh queue
    enqueue_balance_refresh(redis, list(needs_balance_set) + needs_refresh)

    return result
