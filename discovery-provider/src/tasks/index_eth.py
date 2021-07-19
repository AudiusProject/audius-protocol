import time
import logging
# from typing import Optional
# from eth_typing import URI
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.eth_indexing.event_scanner import EventScanner
from src.utils.helpers import load_eth_abi_values
from src.utils.redis_constants import index_eth_last_completion_redis_key
from src.tasks.cache_user_balance import get_token_address

logger = logging.getLogger(__name__)

CHAIN_REORG_SAFETY_BLOCKS = 10

# provider_url: Optional[URI] = shared_config["web3"]["eth_provider_url"]
# provider = HTTPProvider(provider_url)

provider = HTTPProvider(shared_config["web3"]["eth_provider_url"])  # type: ignore

# Remove the default JSON-RPC retry middleware
# as it correctly cannot handle eth_getLogs block range
# throttle down.
provider.middlewares.clear()  # type: ignore

web3 = Web3(provider)

# Prepare stub ERC-20 contract object
eth_abi_values = load_eth_abi_values()
AUDIO_TOKEN_CONTRACT = web3.eth.contract(abi=eth_abi_values["AudiusToken"]["abi"])

AUDIO_CHECKSUM_ADDRESS = get_token_address(web3, shared_config)

# This implementation follows the example outlined in the link below
# https://web3py.readthedocs.io/en/stable/examples.html#advanced-example-fetching-all-token-transfer-events
def index_eth_transfer_events(db, redis):
    scanner = EventScanner(
        db=db,
        redis=redis,
        web3=web3,
        contract=AUDIO_TOKEN_CONTRACT,
        event_type=AUDIO_TOKEN_CONTRACT.events.Transfer,
        filters={"address": AUDIO_CHECKSUM_ADDRESS},
    )
    scanner.restore()

    # Assume we might have scanned the blocks all the way to the last Ethereum block
    # that mined a few seconds before the previous scan run ended.
    # Because there might have been a minor Ethereum chain reorganisations
    # since the last scan ended, we need to discard
    # the last few blocks from the previous scan results.
    # Scan from [last block scanned] - [latest ethereum block]
    # (with a potentially offset from the tail to attempt to avoid blocks not mined yet)
    since_block = scanner.get_last_scanned_block() - CHAIN_REORG_SAFETY_BLOCKS

    # Note that our chain reorg safety blocks cannot go negative
    start_block = max(since_block, 0)
    end_block = scanner.get_suggested_scan_end_block()
    if start_block > end_block:
        logger.info(
            f"Start block ({start_block}) cannot be greater then end block ({end_block})"
        )
        return

    logger.info(f"Scanning events from blocks {start_block} - {end_block}")
    start = time.time()

    # Run the scan
    result, total_chunks_scanned = scanner.scan(start_block, end_block)

    logger.info(
        "Reached end block for eth transfer events... saving events to database"
    )
    scanner.save(end_block)
    duration = time.time() - start
    logger.info(
        f"Scanned total {len(result)} Transfer events, in {duration} seconds, \
            total {total_chunks_scanned} chunk scans performed"
    )


@celery.task(name="index_eth", bind=True)
def index_eth(self):
    # Index AUDIO Transfer events to update user balances
    db = index_eth.db
    redis = index_eth.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("index_eth_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock
        have_lock = update_lock.acquire(blocking=True)
        if have_lock:
            logger.info(f"index_eth.py | {self.request.id} | Acquired index_eth_lock")

            index_eth_transfer_events(db, redis)

            end_time = time.time()
            redis.set(index_eth_last_completion_redis_key, int(end_time))
            logger.info(
                f"index_eth.py | {self.request.id} | Processing complete within session"
            )
        else:
            logger.error(
                f"index_eth.py | {self.request.id} | \
                    Failed to acquire index_eth_lock"
            )
    except Exception as e:
        logger.error("Fatal error in main loop of index_eth: %s", e, exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
