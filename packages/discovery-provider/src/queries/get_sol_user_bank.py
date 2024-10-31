import logging
from datetime import datetime
from typing import Dict, Optional, TypedDict

from redis import Redis
from sqlalchemy import desc

from src.models.users.user_bank import UserBankTx
from src.tasks.index_user_bank import cache_latest_sol_user_bank_db_tx
from src.utils import helpers
from src.utils.cache_solana_program import CachedProgramTxInfo, get_cached_sol_tx
from src.utils.db_session import get_db_read_replica
from src.utils.redis_constants import (
    latest_sol_user_bank_db_tx_key,
    latest_sol_user_bank_program_tx_key,
)

logger = logging.getLogger(__name__)


# Get last user_bank sol tx
def get_latest_sol_user_bank() -> Optional[Dict]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        user_bank_tx = session.query(UserBankTx).order_by(desc(UserBankTx.slot)).first()
        if user_bank_tx:
            return helpers.model_to_dictionary(user_bank_tx)
    return None


# Retrieve the latest stored value in database for sol plays
# Cached during processing
def get_latest_cached_sol_user_bank_db(redis: Redis) -> Optional[CachedProgramTxInfo]:
    latest_sol_user_bank_db = get_cached_sol_tx(redis, latest_sol_user_bank_db_tx_key)
    if not latest_sol_user_bank_db:
        # If nothing found in cache, pull from db
        user_bank = get_latest_sol_user_bank()
        if user_bank:
            latest_sol_user_bank_db = {
                "signature": user_bank["signature"],
                "slot": user_bank["slot"],
                "timestamp": int(user_bank["created_at"].timestamp()),
            }
            # If found, re-cache value to avoid repeated DB hits
            if latest_sol_user_bank_db:
                cache_latest_sol_user_bank_db_tx(redis, latest_sol_user_bank_db)

    return latest_sol_user_bank_db


def get_latest_cached_sol_user_bank_program_tx(redis) -> CachedProgramTxInfo:
    # Latest user_bank tx from chain
    latest_sol_user_bank_program_tx = get_cached_sol_tx(
        redis, latest_sol_user_bank_program_tx_key
    )
    return latest_sol_user_bank_program_tx


def get_sol_user_bank_health_info(redis: Redis, current_time_utc: datetime):
    db_cache = get_latest_cached_sol_user_bank_db(redis)
    tx_cache = get_latest_cached_sol_user_bank_program_tx(redis)
    return get_sol_tx_health_info(
        current_time_utc,
        (
            datetime.utcfromtimestamp(db_cache["timestamp"])
            if db_cache
            else current_time_utc
        ),
        db_cache,
        tx_cache,
    )


class SolTxHealthTxInfo(TypedDict):
    chain_tx: Optional[CachedProgramTxInfo]
    db_tx: Optional[CachedProgramTxInfo]


class SolTxHealthInfo(TypedDict):
    slot_diff: int
    tx_info: SolTxHealthTxInfo
    time_diff: float


def get_sol_tx_health_info(
    current_time_utc: datetime,
    last_indexed: Optional[datetime],
    db_cache: Optional[CachedProgramTxInfo],
    tx_cache: Optional[CachedProgramTxInfo],
) -> SolTxHealthInfo:
    time_diff = -1.0
    slot_diff = -1

    if db_cache and tx_cache:
        slot_diff = tx_cache["slot"] - db_cache["slot"]
    time_diff = (
        (current_time_utc - last_indexed).total_seconds()
        if last_indexed is not None
        else current_time_utc.timestamp()
    )

    return_val: SolTxHealthInfo = {
        "slot_diff": slot_diff,
        "tx_info": {
            "chain_tx": tx_cache,
            "db_tx": db_cache,
        },
        "time_diff": time_diff,
    }
    return return_val
