import concurrent.futures
import datetime
import logging
import time

from typing import Union, Tuple

import base58
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event import ChallengeEvent

from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models import Play
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.redis_cache import pickle_and_set
from src.utils.redis_constants import latest_sol_play_tx_key

TRACK_LISTEN_PROGRAM = shared_config["solana"]["track_listen_count_address"]
SIGNER_GROUP = shared_config["solana"]["signer_group_address"]
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"

# Maximum number of batches to process at once
TX_SIGNATURES_MAX_BATCHES = 20

# Last N entries present in tx_signatures array during processing
TX_SIGNATURES_RESIZE_LENGTH = 10

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


def parse_instruction_data(data) -> Tuple[Union[int, None], int, Union[str, None], int]:
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
            "Failed to parse user_id from {!r}".format(
                decoded[user_id_start:user_id_end]
            ),
        )
        logger.error(
            log,
            exc_info=True,
        )

    track_id_length = int.from_bytes(decoded[user_id_end : user_id_end + 4], "little")
    track_id_start, track_id_end = user_id_end + 4, user_id_end + 4 + track_id_length
    track_id = int(decoded[track_id_start:track_id_end])

    source_length = int.from_bytes(decoded[track_id_end : track_id_end + 4], "little")
    source_start, source_end = track_id_end + 4, track_id_end + 4 + source_length

    # Source is not expected to be null, but may be
    source = None
    try:
        source = str(decoded[source_start:source_end], "utf-8")
    except ValueError:
        log = (
            "Failed to parse source from {!r}".format(decoded[source_start:source_end]),
        )
        logger.error(
            log,
            exc_info=True,
        )

    timestamp = int.from_bytes(decoded[source_end : source_end + 8], "little")

    return user_id, track_id, source, timestamp


# Retry 5x until a tx 'result' is found with valid contents
# If not found, move forward
def get_sol_tx_info(solana_client, tx_sig, retries=5):
    while retries > 0:
        try:
            tx_info = solana_client.get_confirmed_transaction(tx_sig)
            if tx_info["result"] is not None:
                return tx_info
        except Exception as e:
            logger.error(
                f"index_solana_plays.py | Error fetching tx {tx_sig}, {e}",
                exc_info=True,
            )
        retries -= 1
        logger.error(f"index_solana_plays.py | Retrying tx fetch: {tx_sig}")
    raise Exception(f"index_solana_plays.py | Failed to fetch {tx_sig}")


# Cache the latest value in redis
def cache_latest_tx_redis(solana_client, redis, tx):
    try:
        tx_sig = tx["signature"]
        tx_slot = tx["slot"]
        pickle_and_set(
            redis, latest_sol_play_tx_key, {"signature": tx_sig, "slot": tx_slot}
        )
    except Exception as e:
        logger.error(
            f"index_solana_plays.py | Failed to cache latest transaction {tx}, {e}"
        )
        raise e


# Check for both SECP and SignerGroup
# Ensures that a signature recovery was performed within the expected SignerGroup
def is_valid_tx(account_keys):
    if SECP_PROGRAM in account_keys and SIGNER_GROUP in account_keys:
        return True
    logger.error(
        f"index_solana_plays.py | Failed to find {SECP_PROGRAM} or {SIGNER_GROUP} in {account_keys}"
    )
    return False


def parse_sol_play_transaction(session: Session, solana_client, tx_sig):
    try:
        tx_info = get_sol_tx_info(solana_client, tx_sig)
        logger.info(f"index_solana_plays.py | Got transaction: {tx_sig} | {tx_info}")
        meta = tx_info["result"]["meta"]
        error = meta["err"]

        challenge_bus = index_solana_plays.challenge_event_bus

        if error:
            logger.info(
                f"index_solana_plays.py | Skipping error transaction from chain {tx_info}"
            )
            return
        if is_valid_tx(tx_info["result"]["transaction"]["message"]["accountKeys"]):
            audius_program_index = tx_info["result"]["transaction"]["message"][
                "accountKeys"
            ].index(TRACK_LISTEN_PROGRAM)
            for instruction in tx_info["result"]["transaction"]["message"][
                "instructions"
            ]:
                if instruction["programIdIndex"] == audius_program_index:
                    tx_slot = tx_info["result"]["slot"]
                    user_id, track_id, source, timestamp = parse_instruction_data(
                        instruction["data"]
                    )
                    created_at = datetime.datetime.utcfromtimestamp(timestamp)

                    logger.info(
                        "index_solana_plays.py | "
                        f"user_id: {user_id} "
                        f"track_id: {track_id} "
                        f"source: {source} "
                        f"created_at: {created_at} "
                        f"slot: {tx_slot} "
                        f"sig: {tx_sig}"
                    )

                    session.add(
                        Play(
                            user_id=user_id,
                            play_item_id=track_id,
                            created_at=created_at,
                            source=source,
                            slot=tx_slot,
                            signature=tx_sig,
                        )
                    )

                    if user_id is not None:
                        challenge_bus.dispatch(
                            ChallengeEvent.track_listen,
                            tx_slot,
                            user_id,
                            {"created_at": created_at.timestamp()},
                        )
        else:
            logger.info(
                f"index_solana_plays.py | tx={tx_sig} Failed to find SECP_PROGRAM"
            )
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

    logger.info(f"index_solana_plays.py | returning {latest_slot} for highest slot")
    return latest_slot


# Query a tx signature and confirm its existence
def get_tx_in_db(session, tx_sig):
    exists = False
    tx_sig_db_count = (session.query(Play).filter(Play.signature == tx_sig)).count()
    exists = tx_sig_db_count > 0
    logger.info(f"index_solana_plays.py | {tx_sig} exists={exists}")
    return exists


# pylint: disable=W0105
"""
Processing of plays through the Solana TrackListenCount program is handled differently
than the original indexing layer

Below we monitor the on chain 'programId' which is passed as a config - this will
be deployed exactly once to Solana in conjunction with the AudiusEthRegistry

Each transaction here is signed by a trusted ethereum address authorized within the audius
protocol.

Monitoring the address is performed by leveraging the `get_confirmed_signature_for_address2`
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

transactions_history = get_confirmed_signature_for_address_2(before=None) =
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
transactions_history = get_confirmed_signature_for_address_2(before=None) =
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


def process_solana_plays(solana_client, redis):
    try:
        base58.b58decode(TRACK_LISTEN_PROGRAM)
    except ValueError:
        logger.info(
            f"index_solana_plays.py"
            f"Invalid TrackListenCount program ({TRACK_LISTEN_PROGRAM}) configured, exiting."
        )
        return

    db = index_solana_plays.db

    # Highest currently processed slot in the DB
    latest_processed_slot = get_latest_slot(db)
    logger.info(f"index_solana_plays.py | latest used slot: {latest_processed_slot}")

    # Loop exit condition
    intersection_found = False

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    # Current batch of transactions
    transaction_signature_batch = []

    last_tx_signature = None

    # Current batch
    page_count = 0

    # Traverse recent records until an intersection is found with existing Plays table
    while not intersection_found:
        transactions_history = solana_client.get_confirmed_signature_for_address2(
            TRACK_LISTEN_PROGRAM, before=last_tx_signature, limit=100
        )
        transactions_array = transactions_history["result"]
        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            intersection_found = True
            logger.info(
                f"index_solana_plays.py | No transactions found before {last_tx_signature}"
            )
        else:
            # Cache latest transaction from chain
            if page_count == 0:
                cache_latest_tx_redis(solana_client, redis, transactions_array[0])
            with db.scoped_session() as read_session:
                for tx in transactions_array:
                    tx_sig = tx["signature"]
                    tx_slot = tx["slot"]
                    logger.info(
                        f"index_solana_plays.py | Processing tx, sig={tx_sig} slot={tx_slot}"
                    )
                    if tx["slot"] > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif tx["slot"] <= latest_processed_slot:
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_solana_plays.py | Latest slot re-traversal\
    slot={tx_slot}, sig={tx_sig},\
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
                last_tx = transactions_array[-1]
                last_tx_signature = last_tx["signature"]
                # Append batch of processed signatures
                if transaction_signature_batch:
                    transaction_signatures.append(transaction_signature_batch)

                # Ensure processing does not grow unbounded
                if len(transaction_signatures) > TX_SIGNATURES_MAX_BATCHES:
                    logger.info(
                        f"index_solana_plays.py | slicing tx_sigs from {len(transaction_signatures)} entries"
                    )
                    transaction_signatures = transaction_signatures[
                        -TX_SIGNATURES_RESIZE_LENGTH:
                    ]
                    logger.info(
                        f"index_solana_plays.py | sliced tx_sigs to {len(transaction_signatures)} entries"
                    )

                # Reset batch state
                transaction_signature_batch = []

        logger.info(
            f"index_solana_plays.py | intersection_found={intersection_found},\
            last_tx_signature={last_tx_signature},\
            page_count={page_count}"
        )
        page_count = page_count + 1

    logger.info(
        f"index_solana_plays.py | {transaction_signatures}, {len(transaction_signatures)} entries"
    )

    transaction_signatures.reverse()

    logger.info(f"index_solana_plays.py | {transaction_signatures}")

    num_txs_processed = 0

    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_solana_plays.py | processing {tx_sig_batch}")
        batch_start_time = time.time()
        # Process each batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            with db.scoped_session() as session:
                parse_sol_tx_futures = {
                    executor.submit(
                        parse_sol_play_transaction, session, solana_client, tx_sig
                    ): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                    try:
                        # No return value expected here so we just ensure all futures are resolved
                        future.result()
                        num_txs_processed += 1
                    except Exception as exc:
                        logger.error(f"index_solana_plays.py | {exc}")
                        raise exc

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_solana_plays.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )


######## CELERY TASKS ########
@celery.task(name="index_solana_plays", bind=True)
def index_solana_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = index_solana_plays.redis
    solana_client = index_solana_plays.solana_client
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock("solana_plays_lock", blocking_timeout=25, timeout=14400)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_solana_plays.py | Acquired lock")
            challenge_bus: ChallengeEventBus = index_solana_plays.challenge_event_bus
            with challenge_bus.use_scoped_dispatch_queue():
                process_solana_plays(solana_client, redis)
        else:
            logger.info("index_solana_plays.py | Failed to acquire lock")
    except Exception as e:
        logger.error("index_solana_plays.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
