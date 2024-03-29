import json
import logging
from typing import Optional, TypedDict

from redis import Redis
from solders.rpc.responses import RpcConfirmedTransactionStatusWithSignature

from src.solana.solana_client_manager import SolanaClientManager

logger = logging.getLogger(__name__)


class CachedProgramTxInfo(TypedDict):
    # Signature of latest transaction that has been processed
    signature: str
    # Slot corresponding to tx signature
    slot: int
    # Block time of latest transaction on chain
    timestamp: int


# Cache the latest value committed to DB in redis
# Used for quick retrieval in health check
def cache_latest_sol_db_tx(
    redis: Redis, cache_key: str, latest_tx: CachedProgramTxInfo
):
    try:
        redis.set(cache_key, json.dumps(latest_tx))
    except Exception as e:
        logger.error(
            f"cache_solana_program.py | Failed to cache key {cache_key} latest processed transaction {latest_tx}, {e}"
        )
        raise e


def get_latest_sol_db_tx(redis: Redis, cache_key: str):
    value = redis.get(cache_key)
    latest_sol_db: Optional[CachedProgramTxInfo] = json.loads(value) if value else None
    return latest_sol_db


# Function that ensures we always cache the latest known transaction in redis
# Performed outside of lock acquisition
# Ensures a lock held for a long time (usually during catchup scenarios)
#   does not prevent a refresh of latest known transaction
def fetch_and_cache_latest_program_tx_redis(
    solana_client_manager: SolanaClientManager,
    redis: Redis,
    program: str,
    cache_key: str,
):
    transactions_history = solana_client_manager.get_signatures_for_address(
        program, before=None, limit=1
    )
    transactions_array = transactions_history.value
    if transactions_array:
        # Cache latest transaction from chain
        cache_latest_sol_play_program_tx(
            redis, program, cache_key, transactions_array[0]
        )


# Cache the latest chain tx value in redis
# Represents most recently seen value from the sol program
def cache_latest_sol_play_program_tx(
    redis: Redis,
    program: str,
    cache_key: str,
    tx: RpcConfirmedTransactionStatusWithSignature,
):
    try:
        sig = tx.signature
        slot = tx.slot
        timestamp = tx.block_time
        redis.set(
            cache_key,
            json.dumps({"signature": str(sig), "slot": slot, "timestamp": timestamp}),
        )
    except Exception as e:
        logger.error(
            f"cache_solana_program.py |Failed to cache sol program {program} latest transaction {tx}, {e}"
        )
        raise e


def get_cache_latest_sol_program_tx(redis: Redis, cache_key: str):
    value = redis.get(cache_key)
    latest_sol_db: Optional[CachedProgramTxInfo] = json.loads(value) if value else None
    return latest_sol_db
