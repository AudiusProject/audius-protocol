import logging
from datetime import datetime, timedelta
from typing import List
from redis import Redis
from sqlalchemy.orm.session import Session
from src.models import UserBalance

logger = logging.getLogger(__name__)

# How stale of a zero user balance we tolerate before refreshing
BALANCE_REFRESH = 12 * 60 * 60

LAZY_REFRESH_REDIS_PREFIX = "USER_BALANCE_REFRESH_LAZY"
IMMEDIATE_REFRESH_REDIS_PREFIX = "USER_BALANCE_REFRESH_IMMEDIATE"


def does_user_balance_need_refresh(user_balance: UserBalance) -> bool:
    """Returns whether a given user_balance needs update.
    Very heuristic-y:
        - If we've never updated before (new balance entry), update now
        - If the balance has not been updated in BALANCE_REFRESH seconds
    """

    if user_balance.updated_at == user_balance.created_at:
        return True

    delta = timedelta(seconds=BALANCE_REFRESH)
    needs_refresh = user_balance.updated_at < (datetime.now() - delta)
    return needs_refresh


def enqueue_lazy_balance_refresh(redis: Redis, user_ids: List[int]):
    # unsafe to call redis.sadd w/ empty array
    if not user_ids:
        return
    redis.sadd(LAZY_REFRESH_REDIS_PREFIX, *user_ids)


def enqueue_immediate_balance_refresh(redis: Redis, user_ids: List[int]):
    # unsafe to call redis.sadd w/ empty array
    if not user_ids:
        return
    redis.sadd(IMMEDIATE_REFRESH_REDIS_PREFIX, *user_ids)


def get_balances(session: Session, redis: Redis, user_ids: List[int]):
    """Gets user balances.
    Returns mapping { user_id: balance }
    Enqueues in Redis user balances requiring refresh.
    """
    # Find user balances
    query: List[UserBalance] = (
        (session.query(UserBalance)).filter(UserBalance.user_id.in_(user_ids)).all()
    )

    # Construct result dict from query result
    result = {
        user_balance.user_id: {
            "owner_wallet_balance": user_balance.balance,
            "associated_wallets_balance": user_balance.associated_wallets_balance,
            "associated_spl_wallets_balance": user_balance.associated_spl_wallets_balance,
            "total_balance": str(
                int(user_balance.balance)
                + int(user_balance.associated_wallets_balance)
                + (int(user_balance.associated_spl_wallets_balance) * 10 ** 9)
            ),
        }
        for user_balance in query
    }

    # Find user_ids that don't yet have a balance
    user_ids_set = set(user_ids)
    fetched_user_ids_set = {x.user_id for x in query}
    needs_balance_set = user_ids_set - fetched_user_ids_set

    # Add new balances to result set
    no_balance_dict = {
        user_id: {
            "owner_wallet_balance": "0",
            "associated_wallets_balance": "0",
            "associated_spl_wallets_balance": "0",
            "total_balance": "0",
        }
        for user_id in needs_balance_set
    }
    result.update(no_balance_dict)

    # Get old balances that need refresh
    needs_refresh = [
        user_balance.user_id
        for user_balance in query
        if does_user_balance_need_refresh(user_balance)
    ]

    # Enqueue new balances to Redis refresh queue
    # 1. All users who need a new balance
    # 2. All users who need a balance refresh
    enqueue_lazy_balance_refresh(redis, list(needs_balance_set) + needs_refresh)

    return result
