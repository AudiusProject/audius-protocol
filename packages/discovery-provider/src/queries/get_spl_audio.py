import logging
from datetime import datetime
from typing import Dict, Optional

from redis import Redis

from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.queries.get_sol_user_bank import SolTxHealthInfo
from src.tasks.index_spl_token import cache_latest_spl_audio_db_tx
from src.utils import helpers
from src.utils.cache_solana_program import CachedProgramTxInfo, get_cached_sol_tx
from src.utils.db_session import get_db_read_replica
from src.utils.redis_constants import (
    latest_sol_spl_token_db_key,
    latest_sol_spl_token_program_tx_key,
)

logger = logging.getLogger(__name__)


# Get last user_bank sol tx
def get_latest_spl_audio() -> Optional[Dict]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        token_tx = session.query(SPLTokenTransaction).first()
        if token_tx:
            return helpers.model_to_dictionary(token_tx)
    return None


# Retrieve the latest stored value in database for spl audio indexing
# Cached during processing
def get_latest_cached_spl_audio_db(redis: Redis) -> Optional[CachedProgramTxInfo]:
    latest_spl_audio_db = get_cached_sol_tx(redis, latest_sol_spl_token_db_key)
    if not latest_spl_audio_db:
        # If nothing found in cache, pull from db
        token_tx = get_latest_spl_audio()
        if token_tx:
            latest_spl_audio_db = {
                "signature": token_tx["signature"],
                "slot": token_tx["last_scanned_slot"],
                "timestamp": int(token_tx["created_at"].timestamp()),
            }
            # If found, re-cache value to avoid repeated DB hits
            if latest_spl_audio_db:
                cache_latest_spl_audio_db_tx(redis, latest_spl_audio_db)

    return latest_spl_audio_db


def get_latest_cached_spl_audio_program_tx(redis) -> CachedProgramTxInfo:
    # Latest spl audio tx from chain
    latest_spl_audio_program_tx = get_cached_sol_tx(
        redis, latest_sol_spl_token_program_tx_key
    )
    return latest_spl_audio_program_tx


def get_spl_audio_health_info(redis: Redis, current_time_utc: datetime):
    db_cache = get_latest_cached_spl_audio_db(redis)
    tx_cache = get_latest_cached_spl_audio_program_tx(redis)
    return get_sol_tx_health_info(current_time_utc, db_cache, tx_cache)


# Retrieve spl audio health object
def get_sol_tx_health_info(
    current_time_utc: datetime,
    db_cache: Optional[CachedProgramTxInfo],
    tx_cache: Optional[CachedProgramTxInfo],
) -> SolTxHealthInfo:
    time_diff = -1.0
    slot_diff = -1

    if db_cache and tx_cache:
        slot_diff = tx_cache["slot"] - db_cache["slot"]
        last_created_at_time = datetime.utcfromtimestamp(db_cache["timestamp"])
        time_diff = (current_time_utc - last_created_at_time).total_seconds()

    return_val: SolTxHealthInfo = {
        "slot_diff": slot_diff,
        "tx_info": {
            "chain_tx": tx_cache,
            "db_tx": db_cache,
        },
        "time_diff": time_diff,
    }
    return return_val
