import concurrent.futures
import json
import logging
import time
from datetime import datetime
from typing import Dict, Tuple, TypedDict, Union, cast

import base58
from redis import Redis
from solders.pubkey import Pubkey
from solders.rpc.responses import (
    GetTransactionResp,
    RpcConfirmedTransactionStatusWithSignature,
)
from solders.transaction import Transaction
from sqlalchemy import desc

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.social.play import Play
from src.solana.constants import FETCH_TX_SIGNATURES_BATCH_SIZE
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.celery_app import celery
from src.utils.cache_solana_program import (
    CachedProgramTxInfo,
    cache_sol_db_tx,
    fetch_and_cache_latest_program_tx_redis,
)
from src.utils.config import shared_config
from src.utils.helpers import split_list
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_cache import get_solana_transaction_key
from src.utils.redis_constants import (
    latest_sol_play_db_tx_key,
    latest_sol_play_program_tx_key,
    latest_sol_plays_slot_key,
)

environment = shared_config["discprov"]["env"]

TRACK_LISTEN_PROGRAM = shared_config["solana"]["track_listen_count_address"]
SIGNER_GROUP = shared_config["solana"]["signer_group_address"]
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"

REDIS_TX_CACHE_QUEUE_PREFIX = "plays-tx-cache-queue"

# Number of signatures that are fetched from RPC and written at once
# For example, in a batch of 1000 only 100 will be fetched and written in parallel
# Intended to relieve RPC and DB pressure
TX_SIGNATURES_PROCESSING_SIZE = 100
INITIAL_FETCH_SIZE = 30

logger = logging.getLogger(__name__)

"""
Parse signed data message from each transaction submitted to
Audius TrackListenCount program

Formatted in the following struct:

pub struct TrackData {
    /// user ID
    pub user_id: String,
    /// track ID
    pub track_id: String,
    /// track source
    pub source: String,
    /// timestamp as nonce
    pub timestamp: UnixTimestamp,
}
"""


def parse_instruction_data(
    data,
) -> Tuple[Union[int, None], int, Union[str, None], Union[Dict, None], int]:
    decoded = base58.b58decode(data)[1:]

    user_id_length = int.from_bytes(decoded[0:4], "little")
    user_id_start, user_id_end = 4, 4 + user_id_length

    # Clients send a GUID for anonymous user ID listens, which will be recorded as userId=None
    user_id = None
    try:
        user_id = int(decoded[user_id_start:user_id_end])
    except ValueError:
        # Deal with some python logging annoyances by pulling this out
        log = (
            "Recording anonymous listen {!r}".format(
                decoded[user_id_start:user_id_end]
            ),
        )
        logger.debug(
            log,
            exc_info=False,
        )

    track_id_length = int.from_bytes(decoded[user_id_end : user_id_end + 4], "little")
    track_id_start, track_id_end = user_id_end + 4, user_id_end + 4 + track_id_length
    track_id = int(decoded[track_id_start:track_id_end])

    source_length = int.from_bytes(decoded[track_id_end : track_id_end + 4], "little")
    source_start, source_end = track_id_end + 4, track_id_end + 4 + source_length

    # Source is not expected to be null, but may be
    # First try to parse source as json
    source = None
    location = {}
    try:
        decoded_source = decoded[source_start:source_end]
        sourceDict = json.loads(decoded_source)
        source = sourceDict["source"]

        location = sourceDict["location"]
    except Exception:
        logger.debug("index_solana_plays.py | Failed to parse json source")

    if not source:
        # Fallback to parse source as normal string
        try:
            source = str(decoded_source, "utf-8")
        except ValueError:
            log = (
                "Failed to parse source from {!r}".format(
                    decoded[source_start:source_end]
                ),
            )
            logger.error(
                log,
                exc_info=True,
            )

    timestamp = int.from_bytes(decoded[source_end : source_end + 8], "little")

    return user_id, track_id, source, location, timestamp


class PlayInfo(TypedDict):
    user_id: int
    play_item_id: int
    created_at: datetime
    updated_at: datetime
    source: str
    city: str
    region: str
    country: str
    slot: int
    signature: str


# Cache the latest value committed to DB in redis
# Used for quick retrieval in health check


def cache_latest_sol_play_db_tx(redis: Redis, latest_tx: CachedProgramTxInfo):
    cache_sol_db_tx(redis, latest_sol_play_db_tx_key, latest_tx)


# Check for both SECP and SignerGroup
# Ensures that a signature recovery was performed within the expected SignerGroup


def is_valid_tx(account_keys):
    if (
        Pubkey.from_string(SECP_PROGRAM) in account_keys
        and Pubkey.from_string(SIGNER_GROUP) in account_keys
    ):
        return True
    logger.error(
        f"index_solana_plays.py | Failed to find {SECP_PROGRAM} or {SIGNER_GROUP} in {account_keys}"
    )
    return False


def get_sol_tx_info(
    solana_client_manager: SolanaClientManager, tx_sig: str, redis: Redis
):
    existing_tx = redis.get(get_solana_transaction_key(tx_sig))
    if existing_tx is not None and existing_tx != "":
        logger.debug(f"index_solana_plays.py | Cache hit: {tx_sig}")
        tx_info = GetTransactionResp.from_json(existing_tx.decode("utf-8"))
        return tx_info
    logger.debug(f"index_solana_plays.py | Cache miss: {tx_sig}")
    tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
    return tx_info


def parse_sol_play_transaction(
    solana_client_manager: SolanaClientManager, tx_sig: str, redis: Redis
):
    try:
        fetch_start_time = time.time()
        tx_info = get_sol_tx_info(solana_client_manager, tx_sig, redis)
        fetch_completion_time = time.time()
        fetch_time = fetch_completion_time - fetch_start_time
        logger.debug(
            f"index_solana_plays.py | Got transaction: {tx_sig} in {fetch_time}"
        )
        if not tx_info or not tx_info.value:
            return None
        transaction = tx_info.value.transaction
        if not transaction:
            return None
        meta = transaction.meta
        if not meta:
            return None
        error = meta.err

        if error:
            logger.debug(
                f"index_solana_plays.py | Skipping error transaction from chain {tx_info}"
            )
            return None

        tx_message = cast(Transaction, transaction.transaction).message
        account_keys = tx_message.account_keys
        if is_valid_tx(account_keys):
            audius_program_index = account_keys.index(
                Pubkey.from_string(TRACK_LISTEN_PROGRAM)
            )
            for instruction in tx_message.instructions:
                if instruction.program_id_index == audius_program_index:
                    slot = tx_info.value.slot
                    (
                        user_id,
                        track_id,
                        source,
                        location,
                        timestamp,
                    ) = parse_instruction_data(instruction.data)
                    created_at = datetime.utcfromtimestamp(timestamp)

                    logger.debug(
                        "index_solana_plays.py | "
                        f"user_id: {user_id} "
                        f"track_id: {track_id} "
                        f"source: {source} "
                        f"location: {location} "
                        f"created_at: {created_at} "
                        f"slot: {slot} "
                        f"sig: {tx_sig}"
                    )

                    # return the data necessary to create a Play and add to challenge bus
                    return (
                        user_id,
                        track_id,
                        created_at,
                        source,
                        location,
                        slot,
                        tx_sig,
                    )

            return None

        logger.debug(f"index_solana_plays.py | tx={tx_sig} Failed to find SECP_PROGRAM")
        return None
    except Exception as e:
        logger.error(
            f"index_solana_plays.py | Error processing {tx_sig}, {e}", exc_info=True
        )
        raise e


# Query the highest traversed solana slot
def get_latest_slot(db):
    latest_slot = None
    with db.scoped_session() as session:
        highest_slot_query = (
            session.query(Play)
            .filter(Play.slot != None)
            .filter(Play.signature != None)
            .order_by(desc(Play.slot))
        ).first()
        # Can be None prior to first write operations
        if highest_slot_query is not None:
            latest_slot = highest_slot_query.slot

    # If no slots have yet been recorded, assume all are valid
    if latest_slot is None:
        latest_slot = 0

    logger.debug(f"index_solana_plays.py | returning {latest_slot} for highest slot")
    return latest_slot


# Query a tx signature and confirm its existence
def get_tx_in_db(session, tx_sig):
    exists = False
    tx_sig_db_count = (session.query(Play).filter(Play.signature == tx_sig)).count()
    exists = tx_sig_db_count > 0
    logger.debug(f"index_solana_plays.py | {tx_sig} exists={exists}")
    return exists


# pylint: disable=W0105
"""
Processing of plays through the Solana TrackListenCount program is handled differently
than the original indexing layer

Below we monitor the on chain 'programId' which is passed as a config - this will
be deployed exactly once to Solana in conjunction with the AudiusEthRegistry

Each transaction here is signed by a trusted ethereum address authorized within the audius
protocol.

Monitoring the address is performed by leveraging the `get_signatures_for_address`
function, which accepts 'limit' and 'before' parameters which are key to the logic below.
This function returns tx signatures processed by the programId in confirmation order,
with the most recently confirmed returned first.

For example, if there are 1000 transactions and we request with a limit of 1000, the returned
array will have the following format:
[1000th, 999th, ..., 3rd, 2nd, 1]

This indexing logic leverages the above to monitor the 'slots' for each transaction, based on
the highest value currently stored in the discovery database and comparing that with the slots
of the latest returned transactions until an intersection is explicitly found between the two.

In the startup case, where there are no DB records present an intersection is considered 'found'
when there are no records remaining - indicating that we have reached the end of the transaction
history for this particular programId.

For example, given the following state:

latest_processed_slot = 200 <- latest slot stored in database

last_tx_signature = None <- None by design, as we must start querying the most recent chain
transactions

transactions_history = get_signatures_for_address(before=None) =
[
    sig300, slot=230,
    sig299, slot=230
    sig298, slot=229
    ...
    sig250, slot=210
]
Since no intersection has been found, the above is loaded as a single 'batch' into an array of
tx_signature batches that now has the following state:

tx_batches = [batch_300_to_250]

Now, last_tx_signature = sig250
transactions_history = get_signatures_for_address(before=None) =
[
    sig250, slot=210
    sig249, slot=209
    sig248, slot=209
    ...
    sig202, slot=201
    sig201, slot=200 <-- slot intersection
]

Here, we continue storing each transaction in a new 'batch' array until a tx with a
slot equal to the latest_processed_slot is found - in this case, 200.

Additionally, once an equivalent slot is found we explicitly validate that sig201 is present in
the local DB - if not, processing continues until an explicit signature + slot intersection is
found or no history is remaining

At this point, tx_batches = [batch_300_to_250, batch_250_to_200]

tx_batches is reversed in order to apply the oldest transactions first - as follows:

tx_batches = [batch_250_to_200, batch_300_to_250]

Each batch is then processed in parallel and committed to the local database.

It is important to note that we also limit the maximum size of tx_batches to ensure that this array
does not grow unbounded over time and new discovery providers are able to safely recover all information.
This is performed by simply slicing the tx_batches array and discarding the newest transactions until an intersection
is found - these limiting parameters are defined as TX_SIGNATURES_MAX_BATCHES, TX_SIGNATURES_RESIZE_LENGTH
"""


def parse_sol_tx_batch(
    db, solana_client_manager, redis, tx_sig_batch_records, retries=10
):
    """
    Parse a batch of solana transactions in parallel by calling parse_sol_play_transaction
    with a ThreaPoolExecutor

    This function also has a recursive retry upto a certain limit in case a future doesn't complete
    within the alloted time. It clears the futures thread queue and the batch is retried
    """
    batch_start_time = time.time()
    challenge_bus_events = []
    plays = []

    # Last record in this batch to be cached
    # Important to note that the batch records are in time DESC order
    last_tx_in_batch = tx_sig_batch_records[0]
    challenge_bus = index_solana_plays.challenge_event_bus

    # Process each batch in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        parse_sol_tx_futures = {
            executor.submit(
                parse_sol_play_transaction, solana_client_manager, tx_sig, redis
            ): tx_sig
            for tx_sig in tx_sig_batch_records
        }
        try:
            for future in concurrent.futures.as_completed(
                parse_sol_tx_futures, timeout=45
            ):
                # Returns the properties for a Play object to be created in the db
                # can be None so check the value exists
                result = future.result()
                if result:
                    (
                        user_id,
                        track_id,
                        created_at,
                        source,
                        location,
                        slot,
                        tx_sig,
                    ) = result

                    # Append plays to a list that will be written if all plays are successfully retrieved
                    # from the rpc pool
                    play: PlayInfo = {
                        "user_id": user_id,
                        "play_item_id": track_id,
                        "created_at": created_at,
                        "updated_at": datetime.now(),
                        "source": source,
                        "city": location.get("city"),
                        "region": location.get("region"),
                        "country": location.get("country"),
                        "slot": slot,
                        "signature": tx_sig,
                    }
                    plays.append(play)
                    # Only enqueue a challenge event if it's *not*
                    # an anonymous listen
                    if user_id is not None:
                        challenge_bus_events.append(
                            {
                                "slot": slot,
                                "user_id": user_id,
                                "created_at": created_at.timestamp(),
                            }
                        )

        except Exception as exc:
            logger.error(
                f"index_solana_plays.py | Error parsing sol play transaction: {exc}"
            )
            # timeout in a ThreadPoolExecutor doesn't actually stop execution of the underlying thread
            # in order to do that we need to actually clear the queue which we do here to force this
            # task to stop execution
            executor._threads.clear()
            concurrent.futures.thread._threads_queues.clear()

            # if we have retries left, recursively call this function again
            if retries > 0:
                return parse_sol_tx_batch(
                    db, solana_client_manager, redis, tx_sig_batch_records, retries - 1
                )

            # if no more retries, raise
            raise exc

        # if the thread pool executor completes successfully without raising an exception
        # the data is successfully fetched so we can add it to the db session and dispatch
        # events to challenge bus

    # In the case where an entire batch is comprised of errors, wipe the cache to avoid a future find intersection loop
    # For example, if the transactions between the latest cached value and database tail are entirely errors, no Play record will be inserted.
    # This means every subsequent run will continue to no-op on error transactions and the cache will never be updated
    if tx_sig_batch_records and not plays:
        logger.debug("index_solana_plays.py | Clearing redis cache")
        redis.delete(REDIS_TX_CACHE_QUEUE_PREFIX)

    # Cache the latest play from this batch
    # This reflects the ordering from chain
    for play in plays:
        if play.get("signature") == last_tx_in_batch:
            most_recent_db_play = {
                "signature": play.get("signature"),
                "slot": play.get("slot"),
                "timestamp": int(play.get("created_at").timestamp()),
            }
            cache_latest_sol_play_db_tx(redis, most_recent_db_play)
            break

    db_save_start = time.time()
    logger.debug(
        f"index_solana_plays.py | DB | Saving test to DB, fetched batch tx details in {db_save_start - batch_start_time}"
    )

    if plays:
        with db.scoped_session() as session:
            logger.debug(
                f"index_solana_plays.py | DB | Acquired session in {time.time() - db_save_start}"
            )
            session_execute_start = time.time()
            # Save in bulk
            session.execute(Play.__table__.insert().values(plays))
            logger.debug(
                f"index_solana_plays.py | DB | Session execute completed in {time.time() - session_execute_start}"
            )

        logger.debug(
            f"index_solana_plays.py | DB | Saved to DB in {time.time() - db_save_start}"
        )

        logger.debug("index_solana_plays.py | Dispatching listen events")
        listen_dispatch_start = time.time()
        for event in challenge_bus_events:
            challenge_bus.dispatch(
                ChallengeEvent.track_listen,
                event.get("slot"),
                datetime.fromtimestamp(event.get("created_at")),
                event.get("user_id"),
                {"created_at": event.get("created_at")},
            )
        listen_dispatch_end = time.time()
        listen_dispatch_diff = listen_dispatch_end - listen_dispatch_start
        logger.debug(
            f"index_solana_plays.py | Dispatched listen events in {listen_dispatch_diff}"
        )

    batch_end_time = time.time()
    batch_duration = batch_end_time - batch_start_time
    logger.debug(
        f"index_solana_plays.py | processed batch {len(tx_sig_batch_records)} txs in {batch_duration}s"
    )
    return None


# Push to head of array containing seen transactions
# Used to avoid re-traversal from chain tail when slot diff > certain number
def cache_traversed_tx(redis: Redis, tx: RpcConfirmedTransactionStatusWithSignature):
    redis.lpush(REDIS_TX_CACHE_QUEUE_PREFIX, tx.to_json())


# Fetch the cached transaction from redis queue
# Eliminates transactions one by one if they are < latest db slot
def fetch_traversed_tx_from_cache(redis: Redis, latest_db_slot: int):
    cached_offset_tx_found = False
    while not cached_offset_tx_found:
        last_cached_tx_raw = redis.lrange(REDIS_TX_CACHE_QUEUE_PREFIX, 0, 1)
        if last_cached_tx_raw:
            last_cached_tx = RpcConfirmedTransactionStatusWithSignature.from_json(
                last_cached_tx_raw[0].decode()
            )
            logger.debug(
                f"index_solana_plays.py | processing cached tx = {last_cached_tx}, latest_db_slot = {latest_db_slot}"
            )
            redis.ltrim(REDIS_TX_CACHE_QUEUE_PREFIX, 1, -1)
            # If a single element is remaining, clear the list to avoid dupe processing
            if redis.llen(REDIS_TX_CACHE_QUEUE_PREFIX) == 1:
                redis.delete(REDIS_TX_CACHE_QUEUE_PREFIX)
            # Return if a valid signature is found
            if last_cached_tx.slot > latest_db_slot:
                cached_offset_tx_found = True
                last_tx_signature = last_cached_tx.signature
                return last_tx_signature
        else:
            break
    return None


def process_solana_plays(solana_client_manager: SolanaClientManager, redis: Redis):
    try:
        base58.b58decode(TRACK_LISTEN_PROGRAM)
    except ValueError:
        logger.debug(
            f"index_solana_plays.py"
            f"Invalid TrackListenCount program ({TRACK_LISTEN_PROGRAM}) configured, exiting."
        )
        return

    db = index_solana_plays.db

    # Highest currently processed slot in the DB
    latest_processed_slot = get_latest_slot(db)
    logger.debug(f"index_solana_plays.py | latest used slot: {latest_processed_slot}")

    # Utilize the cached tx to offset
    cached_offset_tx = fetch_traversed_tx_from_cache(redis, latest_processed_slot)

    # The 'before' value from where we start querying transactions
    last_tx_signature = cached_offset_tx

    # Loop exit condition
    intersection_found = False

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    # Current batch of transactions
    transaction_signature_batch = []

    # Current batch
    page_count = 0

    # The last transaction processed
    last_tx = None

    # The latest play slot to be processed
    latest_play_slot = None
    is_initial_fetch = True

    # Get the latests slot available globally before fetching txs to keep track of indexing progress
    try:
        latest_global_slot = solana_client_manager.get_slot()
    except:
        logger.error("index_solana_plays.py | Failed to get block height")

    # Traverse recent records until an intersection is found with existing Plays table
    while not intersection_found:
        fetch_size = (
            INITIAL_FETCH_SIZE if is_initial_fetch else FETCH_TX_SIGNATURES_BATCH_SIZE
        )
        logger.debug(
            f"index_solana_plays.py | Requesting {fetch_size} transactions before {last_tx_signature}"
        )
        transactions_history = solana_client_manager.get_signatures_for_address(
            TRACK_LISTEN_PROGRAM, before=last_tx_signature, limit=fetch_size
        )
        is_initial_fetch = False
        transactions_array = transactions_history.value
        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            intersection_found = True
            logger.debug(
                f"index_solana_plays.py | No transactions found before {last_tx_signature}"
            )
        else:
            with db.scoped_session() as read_session:
                for tx in transactions_array:
                    tx_sig = str(tx.signature)
                    slot = tx.slot

                    if tx.err is not None:
                        logger.debug(
                            f"index_user_bank.py | Skipping error transaction tx={tx_sig} err={tx.err}"
                        )
                        continue

                    if tx.slot > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif tx.slot <= latest_processed_slot:
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.debug(
                            f"index_solana_plays.py | Latest slot re-traversal\
                            slot={slot}, sig={tx_sig},\
                            latest_processed_slot(db)={latest_processed_slot}"
                        )
                        exists = get_tx_in_db(read_session, tx_sig)
                        if exists:
                            # Exit loop and set terminal condition since this tx has been found in DB
                            # Transactions are returned with most recently committed first, so we can assume
                            # subsequent transactions in this batch have already been processed
                            intersection_found = True
                            break
                        # Otherwise, ensure this transaction is still processed
                        transaction_signature_batch.append(tx_sig)
                # Restart processing at the end of this transaction signature batch

                # get latest play slot from the first fetch
                if transaction_signature_batch and not latest_play_slot:
                    latest_play_slot = transactions_array[0].slot

                last_tx = transactions_array[-1]
                last_tx_signature = last_tx.signature

                # Append to recently seen cache
                cache_traversed_tx(redis, last_tx)

                # Append batch of processed signatures
                if transaction_signature_batch:
                    transaction_signatures.append(transaction_signature_batch)

                # Reset batch state
                transaction_signature_batch = []

        logger.debug(
            f"index_solana_plays.py | intersection_found={intersection_found},\
            last_tx_signature={last_tx_signature},\
            page_count={page_count}"
        )
        page_count = page_count + 1

    transaction_signatures.reverse()

    for tx_sig_batch in transaction_signatures:
        for tx_sig_batch_records in split_list(
            tx_sig_batch, TX_SIGNATURES_PROCESSING_SIZE
        ):
            parse_sol_tx_batch(db, solana_client_manager, redis, tx_sig_batch_records)

    if latest_play_slot:
        logger.debug(
            f"index_solana_plays.py | Setting latest plays slot {latest_play_slot}"
        )
        redis.set(latest_sol_plays_slot_key, latest_play_slot)

    elif latest_global_slot is not None:
        logger.debug(
            f"index_solana_plays.py | Setting latest plays slot as the latest global slot {latest_global_slot}"
        )
        redis.set(latest_sol_plays_slot_key, latest_global_slot)


@celery.task(name="index_solana_plays", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_solana_plays(self):
    if environment == "dev":
        return

    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = index_solana_plays.redis
    solana_client_manager = index_solana_plays.solana_client_manager
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock("solana_plays_lock", blocking_timeout=25, timeout=14400)

    try:
        # Cache latest tx outside of lock
        fetch_and_cache_latest_program_tx_redis(
            solana_client_manager,
            redis,
            TRACK_LISTEN_PROGRAM,
            latest_sol_play_program_tx_key,
        )
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.debug("index_solana_plays.py | Acquired lock")
            challenge_bus: ChallengeEventBus = index_solana_plays.challenge_event_bus
            with challenge_bus.use_scoped_dispatch_queue():
                process_solana_plays(solana_client_manager, redis)
        else:
            logger.debug("index_solana_plays.py | Failed to acquire lock")
    except Exception as e:
        logger.error("index_solana_plays.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
