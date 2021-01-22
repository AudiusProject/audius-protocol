
import logging
from datetime import datetime, timedelta
from src.models import UserBalance

logger = logging.getLogger(__name__)

# how stale of a balance we will tolerate before refreshing
BALANCE_REFRESH_CUTOFF_SEC = 60 * 60

REDIS_PREFIX = "USER_BALANCE_REFRESH"

def does_user_balance_need_refresh(user_balance):
    '''Returns whether a given user_balance needs update'''

    # If we've never updated it, it needs refresh
    if user_balance.updated_at == user_balance.created_at:
        return True

    cutoff_date = datetime.now() - timedelta(seconds=BALANCE_REFRESH_CUTOFF_SEC)
    return user_balance.updated_at < cutoff_date

def get_balances(session, redis, user_ids):
    """Gets user balances.
       Returns mapping { user_id: balance }
       Enqueues in Redis user balances requiring refresh.
    """
    result = {}

    # Find user balances
    query = ((
        session.query(UserBalance)
    ).filter(
        UserBalance.user_id.in_(user_ids)
    ).all())

    # Add existing balances into result set
    for user_balance in query:
        result[user_balance.user_id] = user_balance.balance

    # split into two groups:
    # - users that need balance refreshed
    # - users that don't yet have a balance

    needs_refresh = list(filter(does_user_balance_need_refresh, query))

    # Find user_ids that don't yet have a balance
    user_ids_set = set(user_ids)
    fetched_user_ids_set = {x.user_id for x in query}
    needs_balance_set = user_ids_set - fetched_user_ids_set
    new_user_balances = [UserBalance(user_id=x, balance=0) for x in needs_balance_set]
    # Add new balances to DB
    session.add_all(new_user_balances)
    # Add new balances to result set
    for user_id in needs_balance_set:
        result[user_id] = "0"


    # Add needs refresh balances + new balances to Redis queue
    needs_balance_ids = [user.user_id for user in needs_refresh] + list(needs_balance_set)
    if needs_balance_ids:
        logger.info(f"Setting in Redis:{needs_balance_ids}")
        redis.sadd(REDIS_PREFIX, *needs_balance_ids)

    return result
