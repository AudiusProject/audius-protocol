
import logging
from datetime import datetime, timedelta
from src.models import UserBalance

logger = logging.getLogger(__name__)

# How stale of a balance we will tolerate before refreshing.
# Beacuse we only refresh for the currently signed in user,
# (as opposed to any fetched user),
# we set this to be fairly agressive.
BALANCE_REFRESH_CUTOFF_SEC = 10 * 60

REDIS_PREFIX = "USER_BALANCE_REFRESH"

def does_user_balance_need_refresh(user_balance):
    '''Returns whether a given user_balance needs update'''

    # If we've never updated it, it needs refresh
    if user_balance.updated_at == user_balance.created_at:
        return True

    cutoff_date = datetime.now() - timedelta(seconds=BALANCE_REFRESH_CUTOFF_SEC)
    return user_balance.updated_at < cutoff_date

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

    # Enqueue new balances to Redis refresh queue
    enqueue_balance_refresh(redis, list(needs_balance_set))

    return result
