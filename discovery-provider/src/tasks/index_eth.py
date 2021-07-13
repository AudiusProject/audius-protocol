import time
import logging
from web3 import Web3
from web3.providers.rpc import HTTPProvider

# We use tqdm library to render a nice progress bar in the console
# https://pypi.org/project/tqdm/
from tqdm import tqdm

from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.eth_indexing.event_scanner import EventScanner
from src.eth_indexing.event_scanner_db_state import EventScannerDBState
from src.utils.helpers import load_eth_abi_values
from src.tasks.cache_user_balance import get_token_address

logger = logging.getLogger(__name__)

# todo
# determine which events we care about (all audio token events?)
# load abi programmatically
# use env var for audio token address
# implement database event scanner state
# discuss chain reorg safety blocks number/constant

"""
fetch all events of a certain types
    what events do we care about:
        - ...
        - ...
handle minor eth chain reorganisations in (near) real-time data

disable the default `http_retry_request_middleware` on your provider for Web3
"""

CHAIN_REORG_SAFETY_BLOCKS = 10

provider = HTTPProvider(shared_config["web3"]["eth_provider_url"])

# Remove the default JSON-RPC retry middleware
# as it correctly cannot handle eth_getLogs block range
# throttle down.
provider.middlewares.clear()  # type: ignore

web3 = Web3(provider)

# Prepare stub ERC-20 contract object
# abi = json.loads(ABI)
eth_abi_values = load_eth_abi_values()
ERC20 = web3.eth.contract(abi=eth_abi_values["AudiusToken"]["abi"])

AUDIO_CHECKSUM_ADDRESS = get_token_address(web3, shared_config)


def index_eth_transfer_events(db, redis):
    # Restore/create our persistent state
    state = EventScannerDBState(db, redis)
    state.restore()

    scanner = EventScanner(
        web3=web3,
        contract=ERC20,
        state=state,
        event_type=ERC20.events.Transfer,
        filters={"address": AUDIO_CHECKSUM_ADDRESS},
    )

    # Assume we might have scanned the blocks all the way to the last Ethereum block
    # that mined a few seconds before the previous scan run ended.
    # Because there might have been a minor Ethereum chain reorganisations
    # since the last scan ended, we need to discard
    # the last few blocks from the previous scan results.
    # Scan from [last block scanned] - [latest ethereum block]
    # (with a potentially offset from the tail to attempt to avoid blocks not mined yet)
    since_block = state.get_last_scanned_block() - CHAIN_REORG_SAFETY_BLOCKS
    scanner.delete_potentially_forked_block_data(since_block)

    # Note that our chain reorg safety blocks cannot go negative
    start_block = max(since_block, 0)
    end_block = scanner.get_suggested_scan_end_block()
    blocks_to_scan = end_block - start_block

    print(f"Scanning events from blocks {start_block} - {end_block}")

    # Render a progress bar in the console
    start = time.time()
    with tqdm(total=blocks_to_scan) as progress_bar:

        def _update_progress(
            current, current_block_timestamp, chunk_size, events_count
        ):
            if current_block_timestamp:
                formatted_time = current_block_timestamp.strftime("%d-%m-%Y")
            else:
                formatted_time = "no block time available"
            progress_bar.set_description(
                f"Current block: {current} ({formatted_time}), blocks in a scan batch: {chunk_size} , \
                    events processed in a batch {events_count}"
            )
            progress_bar.update(chunk_size)

        # Run the scan
        result, total_chunks_scanned = scanner.scan(
            start_block, end_block, progress_callback=_update_progress
        )

    logger.info(
        "Reached end block for eth transfer events... saving events to database"
    )
    state.save()

    duration = time.time() - start
    print(
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
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(f"index_eth.py | {self.request.id} | Acquired index_eth_lock")
            index_eth_transfer_events(db, redis)
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
