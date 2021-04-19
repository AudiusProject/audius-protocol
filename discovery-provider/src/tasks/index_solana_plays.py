import concurrent.futures
import datetime
import logging
import time

import base58
from sqlalchemy import desc
from src.models import Play
from src.tasks.celery_app import celery
from src.utils.config import shared_config

# TODO: These are configs
TRACK_LISTEN_PROGRAM = shared_config["solana"]["program_address"]
SECP_PROGRAM = "KeccakSecp256k11111111111111111111111111111"
SLEEP_TIME = 1

SOL_PLAYS_REDIS_KEY = "sol_plays"

logger = logging.getLogger(__name__)


def parse_instruction_data(data):
    decoded = base58.b58decode(data)[1:]

    user_id_length = int.from_bytes(decoded[0:4], "little")
    user_id_start, user_id_end = 4, 4 + user_id_length
    user_id = int(decoded[user_id_start:user_id_end])

    track_id_length = int.from_bytes(decoded[user_id_end:user_id_end + 4],
                                     "little")
    track_id_start, track_id_end = user_id_end + 4, user_id_end + 4 + track_id_length
    track_id = int(decoded[track_id_start:track_id_end])

    source_length = int.from_bytes(decoded[track_id_end:track_id_end + 4],
                                   "little")
    source_start, source_end = track_id_end + 4, track_id_end + 4 + source_length
    source = str(decoded[source_start:source_end], 'utf-8')

    timestamp = int.from_bytes(decoded[source_end:source_end + 8], "little")

    return user_id, track_id, source, timestamp


def parse_sol_play_transaction(session, solana_client, tx_sig):
    # TODO: Parallelize this call to get_confirmed_transaction similar to blocks
    tx_info = solana_client.get_confirmed_transaction(tx_sig)
    if SECP_PROGRAM in tx_info["result"]["transaction"]["message"][
            "accountKeys"]:
        audius_program_index = tx_info["result"]["transaction"]["message"][
            "accountKeys"].index(TRACK_LISTEN_PROGRAM)
        for instruction in tx_info["result"]["transaction"]["message"][
                "instructions"]:
            if instruction["programIdIndex"] == audius_program_index:
                tx_slot = tx_info['result']['slot']
                user_id, track_id, source, timestamp = parse_instruction_data(
                    instruction["data"])
                created_at = datetime.datetime.utcfromtimestamp(timestamp)

                logger.info(
                    f"index_solana_plays.py | Got transaction: {tx_info}")
                logger.info("index_solana_plays.py | "
                            f"user_id: {user_id} "
                            f"track_id: {track_id} "
                            f"source: {source} "
                            f"created_at: {created_at} "
                            f"slot: {tx_slot} "
                            f"sig: {tx_sig}")

                session.add(
                    Play(user_id=user_id,
                         play_item_id=track_id,
                         created_at=created_at,
                         source=source,
                         slot=tx_slot,
                         signature=tx_sig))

# Query the highest traversed solana slot
def get_latest_slot(db):
    latest_slot = None
    with db.scoped_session() as session:
        highest_slot_query = (session.query(Play).filter(
            Play.slot is not None).order_by(desc(Play.slot))).first()
        # Can be None prior to first write operations
        if highest_slot_query is not None:
            latest_slot = highest_slot_query.slot

    # If no slots have yet been recorded, assume all are valid
    if latest_slot is None:
        latest_slot = 0

    logger.info(
        f"index_solana_plays.py | returning {latest_slot} for highest slot")
    return latest_slot

# Query a tx signature and confirm its existence
def get_tx_in_db(session, tx_sig):
    logger.info(f"index_solana_plays.py | checking db for {tx_sig}")
    exists = False
    tx_sig_db_count = (session.query(Play).filter(
        Play.signature == tx_sig)).count()
    exists = tx_sig_db_count > 0
    logger.info(f"index_solana_plays.py | {tx_sig} exists={exists}")
    return exists


def process_solana_plays(solana_client):
    if not TRACK_LISTEN_PROGRAM:
        logger.info("index_solana_plays.py | No program configured, exiting")
        return

    db = index_solana_plays.db

    # Highest currently processed slot in the DB
    latest_processed_slot = get_latest_slot(db)
    logger.info(
        f"index_solana_plays.py | latest used slot: {latest_processed_slot}")

    # Loop exit condition
    intersection_found = False

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    # Current batch of transactions
    transaction_signature_batch = []

    last_tx_signature = None

    # Traverse recent records until an intersection is found with existing Plays table
    while not intersection_found:
        # TODO: Is there any optimization around this limit value?
        transactions_history = solana_client.get_confirmed_signature_for_address2(
            TRACK_LISTEN_PROGRAM, before=last_tx_signature, limit=100)
        transactions_array = transactions_history['result']
        # logger.info(f"index_solana_plays.py | {transactions_array}")

        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            intersection_found = True
            logger.info(
                f"index_solana_plays.py | No transactions found before {last_tx_signature}"
            )
        else:
            with db.scoped_session() as read_session:
                for tx in transactions_array:
                    tx_sig = tx['signature']
                    tx_slot = tx['slot']
                    logger.info(
                        f"index_solana_plays.py | Processing tx, sig={tx_sig} slot={tx_slot}"
                    )
                    if tx['slot'] > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif tx['slot'] == latest_processed_slot:
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_solana_plays.py | Latest slot re-traversal\
    slot={tx_slot}, sig={tx_sig},\
    latest_processed_slot(db)={latest_processed_slot}")
                        exists = get_tx_in_db(read_session, tx_sig)
                        if exists:
                            # Exit loop and set terminal condition since this tx has been found in DB
                            # Transactions are returned with most recently committed first, so we can assume
                            # subsequent transactions in this batch have already been processed
                            intersection_found = True
                            break
                        else:
                            # Ensure this transaction is still processed
                            transaction_signature_batch.append(tx_sig)
                    else:
                        logger.info(f"index_solana_plays.py |\
    slot={tx_slot}, sig={tx_sig},\
    latest_processed_slot(db)={latest_processed_slot}")
                        # Exit loop and set terminal condition since this slot is < max known value in plays DB
                        intersection_found = True
                        break
                last_tx = transactions_array[-1]
                last_tx_signature = last_tx["signature"]
                # Append batch of processed signatures
                transaction_signatures.append(transaction_signature_batch)
                # Reset batch state
                transaction_signature_batch = []
        logger.info(
            f"index_solana_plays.py | intersection_found={intersection_found}, last_tx_signature={last_tx_signature}"
        )

    logger.info(f"index_solana_plays.py | {transaction_signatures}, {len(transaction_signatures)} entries")

    transaction_signatures.reverse()

    # TODO: DO NOT LET transaction_signatures grow unbounded, cut off x last entries
    logger.info(f"index_solana_plays.py | {transaction_signatures}")

    for tx_sig_batch in transaction_signatures:
        logger.error(f"index_solana_plays.py | processing {tx_sig_batch}")
        batch_start_time = time.time()
        # Process each batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            with db.scoped_session() as session:
                parse_sol_tx_futures = {
                    executor.submit(parse_sol_play_transaction, session,
                                    solana_client, tx_sig): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(
                        parse_sol_tx_futures):
                    try:
                        # No return value expected here so we just ensure all futures are resolved
                        future.result()
                    except Exception as exc:
                        logger.error(exc)

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_solana_plays.py | processed {len(tx_sig_batch)} txs in {batch_duration}s"
        )

    # Update plays iff some batch is found
    if transaction_signatures:
        session.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate_plays")

######## CELERY TASKS ########
@celery.task(name="index_solana_plays", bind=True)
def index_solana_plays(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_solana_plays.redis
    solana_client = index_solana_plays.solana_client
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("solana_plays_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_solana_plays.py | Acquired lock")
            process_solana_plays(solana_client)
    except Exception as e:
        logger.error("index_solana_plays.py | Fatal error in main loop",
                     exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
