import datetime
import time
import logging
from typing import Tuple, Iterable, Union, Type, TypedDict, Any
from sqlalchemy import or_

from web3 import Web3
from web3.contract import Contract, ContractEvent
from web3.exceptions import BlockNotFound
from web3.types import BlockIdentifier

# Currently this method is not exposed over official web3 API,
# but we need it to construct eth_get_logs parameters
from web3._utils.filters import construct_event_filter_params
from web3._utils.events import get_event_data
from eth_abi.codec import ABICodec

from src.models.models import AssociatedWallet, EthBlock, User
from src.queries.get_balances import enqueue_immediate_balance_refresh


logger = logging.getLogger(__name__)

eth_indexing_last_scanned_block_key = "eth_indexing_last_scanned_block"

# How many times we try to re-attempt a failed JSON-RPC call
MAX_REQUEST_RETRIES = 30
# Delay between failed requests to let JSON-RPC server to recover
REQUEST_RETRY_SECONDS = 3
# Minimum number of blocks to scan for our JSON-RPC throttling parameters
MIN_SCAN_CHUNK_SIZE = 10
# How many maximum blocks at the time we request from JSON-RPC
# and we are unlikely to exceed the response size limit of the JSON-RPC server
MAX_CHUNK_SCAN_SIZE = 10000
# Factor how was we increase chunk size if no results found
CHUNK_SIZE_INCREASE = 2
# initial number of blocks to scan, this number will increase/decrease as a function of whether transfer events have been found within the range of blocks scanned
START_CHUNK_SIZE = 20
# how many blocks from tail of chain we want to scan to
ETH_BLOCK_TAIL_OFFSET = 1
# the block number to start with if first time scanning
# this should be the first block during and after which $AUDIO transfer events started occurring
MIN_SCAN_START_BLOCK = 11103292


class TransferEvent(TypedDict):
    logIndex: int
    transactionHash: Any
    blockNumber: int
    args: Any


class EventScanner:
    """Scan blockchain for events and try not to abuse JSON-RPC API too much.

    Can be used for real-time scans, as it detects minor chain reorganisation and rescans.
    Unlike the easy web3.contract.Contract, this scanner can scan events from multiple contracts at once.
    For example, you can get all transfers from all tokens in the same scan.

    You *should* disable the default `http_retry_request_middleware` on your provider for Web3,
    because it cannot correctly throttle and decrease the `eth_get_logs` block number range.
    """

    def __init__(
        self,
        db,
        redis,
        web3: Web3,
        contract: Type[Contract],
        event_type: Type[ContractEvent],
        filters: dict,
    ):
        """
        :param db: database handle
        :param redis: redis handle
        :param web3: Web3 instantiated with provider url
        :param contract: Contract
        :param state: state manager to keep tracks of last scanned block and persisting events to db
        :param event_type: web3 Event we scan
        :param filters: Filters passed to get_logs e.g. { "address": <token-address> }
        """

        self.logger = logger
        self.db = db
        self.redis = redis
        self.contract = contract
        self.web3 = web3
        self.event_type = event_type
        self.filters = filters
        self.last_scanned_block = MIN_SCAN_START_BLOCK
        self.latest_chain_block = self.web3.eth.blockNumber

    def restore(self):
        """Restore the last scan state from redis.
        If value not found in redis, restore from database."""
        restored = self.redis.get(eth_indexing_last_scanned_block_key)
        if not restored:
            with self.db.scoped_session() as session:
                result = session.query(EthBlock.last_scanned_block).first()
                restored = result[0] if result else restored
        self.last_scanned_block = int(restored) if restored else MIN_SCAN_START_BLOCK
        logger.info(
            f"event_scanner.py | Restored last scanned block ({self.last_scanned_block})"
        )

    def save(self, block_number: int):
        """Save at the end of each chunk of blocks, so we can resume in the case of a crash or CTRL+C
        Next time the scanner is started we will resume from this block
        """
        self.last_scanned_block = block_number
        logger.info(
            f"event_scanner.py | Saving last scanned block ({self.last_scanned_block}) to redis"
        )
        self.redis.set(
            eth_indexing_last_scanned_block_key,
            str(self.last_scanned_block),
        )
        with self.db.scoped_session() as session:
            record = session.query(EthBlock).first()
            if record:
                record.last_scanned_block = self.last_scanned_block
            else:
                record = EthBlock(last_scanned_block=self.last_scanned_block)
            session.add(record)

    def get_block_timestamp(self, block_num) -> Union[datetime.datetime, None]:
        """Get Ethereum block timestamp"""
        try:
            block_info = self.web3.eth.getBlock(block_num)
        except BlockNotFound:
            # Block was not mined yet,
            # minor chain reorganisation?
            return None
        last_time = block_info["timestamp"]
        return datetime.datetime.utcfromtimestamp(last_time)

    def get_suggested_scan_end_block(self):
        """Get the last mined block on Ethereum chain we are following."""

        # Do not scan all the way to the final block, as this
        # block might not be mined yet
        return self.latest_chain_block - ETH_BLOCK_TAIL_OFFSET

    def get_last_scanned_block(self) -> int:
        """The number of the last block we have stored."""
        return self.last_scanned_block

    def process_event(
        self, block_timestamp: datetime.datetime, event: TransferEvent
    ) -> str:
        """Record a ERC-20 transfer in our database."""
        # Events are keyed by their transaction hash and log index
        # One transaction may contain multiple events
        # and each one of those gets their own log index

        log_index = event["logIndex"]  # Log index within the block
        # transaction_index = event.transactionIndex  # Transaction index within the block
        txhash = event["transactionHash"].hex()  # Transaction hash
        block_number = event["blockNumber"]

        # Convert ERC-20 Transfer event to our internal format
        args = event["args"]
        transfer = {
            "from": args["from"],
            "to": args["to"],
            "value": args["value"],
            "timestamp": block_timestamp,
        }

        # add user ids from the transfer event into the balance refresh queue
        transfer_event_wallets = [transfer["from"].lower(), transfer["to"].lower()]
        with self.db.scoped_session() as session:
            result = (
                session.query(User.user_id)
                .outerjoin(AssociatedWallet, User.user_id == AssociatedWallet.user_id)
                .filter(User.is_current == True)
                .filter(AssociatedWallet.is_current == True)
                .filter(AssociatedWallet.is_delete == False)
                .filter(
                    or_(
                        User.wallet.in_(transfer_event_wallets),
                        AssociatedWallet.wallet.in_(transfer_event_wallets),
                    )
                )
                .all()
            )
            user_ids = [user_id for [user_id] in result]
            logger.info(
                f"event_scanner.py | Enqueueing user ids {user_ids} to immediate balance refresh queue"
            )
            enqueue_immediate_balance_refresh(self.redis, user_ids)

        # Return a pointer that allows us to look up this event later if needed
        return f"{block_number}-{txhash}-{log_index}"

    def scan_chunk(self, start_block, end_block) -> Tuple[int, list]:
        """Read and process events between to block numbers.

        Dynamically decrease the size of the chunk in case the JSON-RPC server pukes out.

        :return: tuple(actual end block number, when this block was mined, processed events)
        """

        block_timestamps = {}
        get_block_timestamp = self.get_block_timestamp

        # Cache block timestamps to reduce some RPC overhead
        # Real solution might include smarter models around block
        def get_block_mined_timestamp(block_num):
            if block_num not in block_timestamps:
                block_timestamps[block_num] = get_block_timestamp(block_num)
            return block_timestamps[block_num]

        all_processed = []

        # Callable that takes care of the underlying web3 call
        def _fetch_events(from_block, to_block):
            return _fetch_events_for_all_contracts(
                self.web3,
                self.event_type,
                self.filters,
                from_block=from_block,
                to_block=to_block,
            )

        # Do `n` retries on `eth_get_logs`,
        # throttle down block range if needed
        end_block, events = _retry_web3_call(
            _fetch_events, start_block=start_block, end_block=end_block
        )

        for evt in events:
            idx = evt[
                "logIndex"
            ]  # Integer of the log index position in the block, null when its pending

            # We cannot avoid minor chain reorganisations, but
            # at least we must avoid blocks that are not mined yet
            assert idx is not None, "Somehow tried to scan a pending block"

            block_number = evt["blockNumber"]

            # Get UTC time when this event happened (block mined timestamp)
            # from our in-memory cache
            block_timestamp = get_block_mined_timestamp(block_number)

            logger.debug(
                f'event_scanner.py | Processing event {evt["event"]}, block:{evt["blockNumber"]}'
            )
            processed = self.process_event(block_timestamp, evt)
            all_processed.append(processed)

        return end_block, all_processed

    def estimate_next_chunk_size(self, current_chuck_size: int, event_found_count: int):
        """Try to figure out optimal chunk size

        Our scanner might need to scan the whole blockchain for all events

        * We want to minimize API calls over empty blocks
        * We want to make sure that one scan chunk does not try to process too many entries once, as we try to control commit buffer size and potentially asynchronous busy loop
        * Do not overload node serving JSON-RPC API by asking data for too many events at a time

        Currently Ethereum JSON-API does not have an API to tell when a first event occured in a blockchain
        and our heuristics try to accelerate block fetching (chunk size) until we see the first event.

        These heurestics exponentially increase the scan chunk size depending on if we are seeing events or not.
        When any transfers are encountered, we are back to scanning only a few blocks at a time.
        It does not make sense to do a full chain scan starting from block 1, doing one JSON-RPC call per 20 blocks.
        """

        if event_found_count > 0:
            # When we encounter first events, reset the chunk size window
            current_chuck_size = MIN_SCAN_CHUNK_SIZE
        else:
            current_chuck_size *= CHUNK_SIZE_INCREASE

        current_chuck_size = max(MIN_SCAN_CHUNK_SIZE, current_chuck_size)
        current_chuck_size = min(MAX_CHUNK_SCAN_SIZE, current_chuck_size)
        return int(current_chuck_size)

    def scan(
        self,
        start_block,
        end_block,
        start_chunk_size=START_CHUNK_SIZE,
    ) -> Tuple[list, int]:
        """Perform a token events scan.

        :param start_block: The first block included in the scan
        :param end_block: The last block included in the scan
        :param start_chunk_size: How many blocks we try to fetch over JSON-RPC on the first attempt

        :return: [All processed events, number of chunks used]
        """

        current_block = start_block

        # Scan in chunks, commit between
        chunk_size = start_chunk_size
        last_scan_duration = last_logs_found = 0
        total_chunks_scanned = 0

        # All processed entries we got on this scan cycle
        all_processed = []

        while current_block <= end_block:

            # Print some diagnostics to logs to try to fiddle with real world JSON-RPC API performance
            estimated_end_block = min(
                current_block + chunk_size, self.get_suggested_scan_end_block()
            )
            logger.debug(
                "event_scanner.py | Scanning token transfers for blocks: %d - %d, chunk size %d, last chunk scan took %f, last logs found %d",
                current_block,
                estimated_end_block,
                chunk_size,
                last_scan_duration,
                last_logs_found,
            )

            start = time.time()
            actual_end_block, new_entries = self.scan_chunk(
                current_block, estimated_end_block
            )

            # Where does our current chunk scan ends - are we out of chain yet?
            current_end = actual_end_block

            last_scan_duration = int(time.time() - start)
            all_processed += new_entries

            # Try to guess how many blocks to fetch over `eth_get_logs` API next time
            chunk_size = self.estimate_next_chunk_size(chunk_size, len(new_entries))

            # Set where the next chunk starts
            current_block = current_end + 1
            total_chunks_scanned += 1
            self.save(min(current_end, self.get_suggested_scan_end_block()))

        return all_processed, total_chunks_scanned


def _retry_web3_call(  # type: ignore
    func,
    start_block,
    end_block,
    retries=MAX_REQUEST_RETRIES,
    delay=REQUEST_RETRY_SECONDS,
) -> Tuple[int, list]:  # type: ignore
    """A custom retry loop to throttle down block range.

    If our JSON-RPC server cannot serve all incoming `eth_get_logs` in a single request,
    we retry and throttle down block range for every retry.

    For example, Go Ethereum does not indicate what is an acceptable response size.
    It just fails on the server-side with a "context was cancelled" warning.

    :param func: A callable that triggers Ethereum JSON-RPC, as func(start_block, end_block)
    :param start_block: The initial start block of the block range
    :param end_block: The initial start block of the block range
    :param retries: How many times we retry
    :param delay: Time to sleep between retries
    """
    for i in range(retries):
        try:
            return end_block, func(start_block, end_block)
        except Exception as e:
            # Assume this is HTTPConnectionPool(host='localhost', port=8545): Read timed out. (read timeout=10)
            # from Go Ethereum. This translates to the error "context was cancelled" on the server side:
            # https://github.com/ethereum/go-ethereum/issues/20426
            if i < retries - 1:
                # Give some more verbose info than the default middleware
                logger.warning(
                    "event_scanner.py | Retrying events for block range %d - %d (%d) failed with %s, retrying in %s seconds",
                    start_block,
                    end_block,
                    end_block - start_block,
                    e,
                    delay,
                )
                # Decrease the `eth_get_blocks` range
                end_block = start_block + ((end_block - start_block) // 2)
                # Let the JSON-RPC to recover e.g. from restart
                time.sleep(delay)
                continue
            else:
                logger.warning("event_scanner.py | Out of retries")
                raise


def _fetch_events_for_all_contracts(
    web3,
    event_type,
    argument_filters: dict,
    from_block: BlockIdentifier,
    to_block: BlockIdentifier,
) -> Iterable:
    """Get events using eth_get_logs API.

    This method is detached from any contract instance.

    This is a stateless method, as opposed to createFilter.
    It can be safely called against nodes which do not provide `eth_newFilter` API, like Infura.
    """

    if from_block is None:
        raise TypeError("Missing mandatory keyword argument to get_logs: fromBlock")

    # Currently no way to poke this using a public Web3.py API.
    # This will return raw underlying ABI JSON object for the event
    abi = event_type._get_event_abi()

    # Depending on the Solidity version used to compile
    # the contract that uses the ABI,
    # it might have Solidity ABI encoding v1 or v2.
    # We just assume the default that you set on Web3 object here.
    # More information here https://eth-abi.readthedocs.io/en/latest/index.html
    codec: ABICodec = web3.codec

    # Here we need to poke a bit into Web3 internals, as this
    # functionality is not exposed by default.
    # Construct JSON-RPC raw filter presentation based on human readable Python descriptions
    # Namely, convert event names to their keccak signatures
    # More information here:
    # https://github.com/ethereum/web3.py/blob/e176ce0793dafdd0573acc8d4b76425b6eb604ca/web3/_utils/filters.py#L71
    _, event_filter_params = construct_event_filter_params(
        abi,
        codec,
        address=argument_filters.get("address"),
        argument_filters=argument_filters,
        fromBlock=from_block,
        toBlock=to_block,
    )

    logger.debug(
        "event_scanner.py | Querying eth_get_logs with the following parameters: %s",
        event_filter_params,
    )

    # Call JSON-RPC API on your Ethereum node.
    # get_logs() returns raw AttributedDict entries
    logs = web3.eth.getLogs(event_filter_params)

    # Convert raw binary data to Python proxy objects as described by ABI
    all_events = []
    for log in logs:
        # Convert raw JSON-RPC log result to human readable event by using ABI data
        # More information how processLog works here
        # https://github.com/ethereum/web3.py/blob/fbaf1ad11b0c7fac09ba34baff2c256cffe0a148/web3/_utils/events.py#L200
        event = get_event_data(codec, abi, log)
        all_events.append(event)
    return all_events
