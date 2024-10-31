from datetime import datetime
from typing import Dict, Optional

from redis import Redis
from sqlalchemy import desc

from src.models.users.payment_router import PaymentRouterTx
from src.queries.get_sol_user_bank import get_sol_tx_health_info
from src.utils import helpers
from src.utils.cache_solana_program import (
    CachedProgramTxInfo,
    cache_sol_db_tx,
    get_cached_sol_tx,
)
from src.utils.db_session import get_db_read_replica
from src.utils.redis_constants import (
    latest_sol_payment_router_db_tx_key,
    latest_sol_payment_router_program_tx_key,
)


def get_latest_sol_payment_router() -> Optional[Dict]:
    """Gets the latest indexed Payment Router transaction in the DB"""
    db = get_db_read_replica()
    with db.scoped_session() as session:
        rewards_manager_tx = (
            session.query(PaymentRouterTx).order_by(desc(PaymentRouterTx.slot)).first()
        )
        if rewards_manager_tx:
            return helpers.model_to_dictionary(rewards_manager_tx)
    return None


def get_latest_indexed_tx_sol_payment_router(
    redis: Redis,
) -> Optional[CachedProgramTxInfo]:
    """Retrieve the latest indexed transaction

    Cached during processing to reduce DB load
    """
    latest_sol_payment_router_db = get_cached_sol_tx(
        redis, latest_sol_payment_router_db_tx_key
    )
    if not latest_sol_payment_router_db:
        # If nothing found in cache, pull from db
        payment_router_tx = get_latest_sol_payment_router()
        if payment_router_tx:
            latest_sol_payment_router_db = {
                "signature": payment_router_tx["signature"],
                "slot": payment_router_tx["slot"],
                "timestamp": int(payment_router_tx["created_at"].timestamp()),
            }
            # If found, re-cache value to avoid repeated DB hits
            cache_sol_db_tx(
                redis, latest_sol_payment_router_db_tx_key, latest_sol_payment_router_db
            )

    return latest_sol_payment_router_db


def get_latest_chain_tx_sol_payment_router(redis) -> CachedProgramTxInfo:
    latest_sol_rewards_manager_program_tx = get_cached_sol_tx(
        redis, latest_sol_payment_router_program_tx_key
    )
    return latest_sol_rewards_manager_program_tx


def get_sol_payment_router_health_info(redis: Redis, current_time_utc: datetime):
    db_cache = get_latest_indexed_tx_sol_payment_router(redis)
    tx_cache = get_latest_chain_tx_sol_payment_router(redis)
    last_indexed = redis.get("sol_payment_router:last_index_completion")
    last_indexed = (
        datetime.utcfromtimestamp(float(last_indexed))
        if last_indexed is not None
        else None
    )
    return get_sol_tx_health_info(current_time_utc, last_indexed, db_cache, tx_cache)
