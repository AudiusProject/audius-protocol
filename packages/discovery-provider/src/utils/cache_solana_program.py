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
def cache_sol_db_tx(redis: Redis, cache_key: str, latest_tx: CachedProgramTxInfo):
    """Caches the given Solana transaction from the respective Solana indexer table into the specified Redis key"""

    try:
        redis.set(cache_key, json.dumps(latest_tx))
    except Exception as e:
        logger.error(
            f"cache_solana_program.py | Failed to cache key {cache_key} latest processed transaction {latest_tx}, {e}"
        )
        raise e


def get_cached_sol_tx(redis: Redis, cache_key: str):
    """Retieves a cached Solana transaction from Redis"""

    value = redis.get(cache_key)
    latest_sol_db: Optional[CachedProgramTxInfo] = json.loads(value) if value else None
    return latest_sol_db


def fetch_and_cache_latest_program_tx_redis(
    solana_client_manager: SolanaClientManager,
    redis: Redis,
    program: str,
    cache_key: str,
):
    """Fetches the latest Solana transaction for the given program and saves it into Redis cache.

    This should be called by each Solana indexer outside of lock acquisition so that even a lock held for a long time doesn't block it.
    """

    transactions_history = solana_client_manager.get_signatures_for_address(
        program, before=None, limit=1
    )
    transactions_array = transactions_history.value
    if transactions_array:
        # Cache latest transaction from chain
        cache_sol_chain_tx(redis, program, cache_key, transactions_array[0])


# Cache the latest chain tx value in redis
# Represents most recently seen value from the sol program
def cache_sol_chain_tx(
    redis: Redis,
    program: str,
    cache_key: str,
    tx: RpcConfirmedTransactionStatusWithSignature,
):
    """Caches the given Solana transaction returned by an RPC into Redis at the specified key"""

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
