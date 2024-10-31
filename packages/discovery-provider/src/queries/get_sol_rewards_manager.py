from datetime import datetime
from typing import Dict, Optional

from redis import Redis
from sqlalchemy import desc

from src.models.rewards.reward_manager import RewardManagerTransaction
from src.queries.get_sol_user_bank import get_sol_tx_health_info
from src.tasks.index_rewards_manager import cache_latest_sol_rewards_manager_db_tx
from src.utils import helpers
from src.utils.cache_solana_program import CachedProgramTxInfo, get_cached_sol_tx
from src.utils.db_session import get_db_read_replica
from src.utils.redis_constants import (
    latest_sol_rewards_manager_db_tx_key,
    latest_sol_rewards_manager_program_tx_key,
)


# Get last sol rewards manager transaction in the db
def get_latest_sol_rewards_manager() -> Optional[Dict]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        rewards_manager_tx = (
            session.query(RewardManagerTransaction)
            .order_by(desc(RewardManagerTransaction.slot))
            .first()
        )
        if rewards_manager_tx:
            return helpers.model_to_dictionary(rewards_manager_tx)
    return None


# Retrieve the latest stored value in database for rewards manager
# Cached during processing
def get_latest_cached_sol_rewards_manager_db(
    redis: Redis,
) -> Optional[CachedProgramTxInfo]:
    latest_sol_rewards_manager_db = get_cached_sol_tx(
        redis, latest_sol_rewards_manager_db_tx_key
    )
    if not latest_sol_rewards_manager_db:
        # If nothing found in cache, pull from db
        rewards_manager_tx = get_latest_sol_rewards_manager()
        if rewards_manager_tx:
            latest_sol_rewards_manager = {
                "signature": rewards_manager_tx["signature"],
                "slot": rewards_manager_tx["slot"],
                "timestamp": int(rewards_manager_tx["created_at"].timestamp()),
            }
            # If found, re-cache value to avoid repeated DB hits
            cache_latest_sol_rewards_manager_db_tx(redis, latest_sol_rewards_manager)

    return latest_sol_rewards_manager_db


def get_latest_cached_sol_rewards_manager_program_tx(redis) -> CachedProgramTxInfo:
    # Latest rewards_manager tx from chain
    latest_sol_rewards_manager_program_tx = get_cached_sol_tx(
        redis, latest_sol_rewards_manager_program_tx_key
    )
    return latest_sol_rewards_manager_program_tx


def get_sol_rewards_manager_health_info(redis: Redis, current_time_utc: datetime):
    db_cache = get_latest_cached_sol_rewards_manager_db(redis)
    tx_cache = get_latest_cached_sol_rewards_manager_program_tx(redis)
    return get_sol_tx_health_info(current_time_utc, None, db_cache, tx_cache)
