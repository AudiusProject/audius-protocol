import concurrent.futures
import datetime
import logging
import time
from decimal import Decimal
from typing import Any, List, Optional, Set, TypedDict

import base58
from redis import Redis
from solana.publickey import PublicKey
from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm.session import Session
from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.models.indexing.spl_token_backfill_transaction import (
    SPLTokenBackfillTransaction,
)
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_transaction_types import (
    ConfirmedSignatureForAddressResult,
    ConfirmedTransaction,
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import get_solana_tx_owner, get_solana_tx_token_balances
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager
from src.utils.solana_indexing_logger import SolanaIndexingLogger

SPL_TOKEN_PROGRAM = shared_config["solana"]["waudio_mint"]
SPL_TOKEN_PUBKEY = PublicKey(SPL_TOKEN_PROGRAM) if SPL_TOKEN_PROGRAM else None
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
USER_BANK_PUBKEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
PURCHASE_AUDIO_MEMO_PROGRAM = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"

# Number of signatures that are fetched from RPC and written at once
# For example, in a batch of 1000 only 100 will be fetched and written in parallel
# Intended to relieve RPC and DB pressure
TX_SIGNATURES_PROCESSING_SIZE = 100

# Index of memo instruction in instructions list
MEMO_INSTRUCTION_INDEX = 4
# Index of receiver account in solana transaction pre/post balances
# Note: the receiver index is currently the same for purchase and transfer instructions
# but this assumption could change in the future.
RECEIVER_ACCOUNT_INDEX = 1
# Thought we don't index transfers from the sender's side in this task, we must still
# enqueue the sender's accounts for balance refreshes if they are Audius accounts.
SENDER_ACCOUNT_INDEX = 2

purchase_vendor_map = {
    "Link by Stripe": TransactionType.purchase_stripe,
    "Coinbase Pay": TransactionType.purchase_coinbase,
    "Unknown": TransactionType.purchase_unknown,
}
index_spl_token_backfill_tablename = "index_spl_token_backfill"
index_spl_token_backfill_complete = "index_spl_token_backfill_complete"

logger = logging.getLogger(__name__)


class SplTokenTransactionInfo(TypedDict):
    user_bank: str
    signature: str
    slot: int
    timestamp: datetime.datetime
    vendor: Optional[str]
    prebalance: int
    postbalance: int
    sender_wallet: str
    root_accounts: List[str]
    token_accounts: List[str]


def get_tx_in_audio_tx_history(session: Session, tx_sig: str) -> bool:
    """Checks if the transaction signature already exists in Audio Transactions History"""
    tx_sig_in_db = (
        session.query(AudioTransactionsHistory).filter(
            AudioTransactionsHistory.signature == tx_sig
        )
    ).first()
    return bool(tx_sig_in_db)


def parse_memo_instruction(result: Any) -> str:
    try:
        txs = result["transaction"]
        memo_instruction = next(
            (
                inst
                for inst in txs["message"]["instructions"]
                if inst["programIdIndex"] == MEMO_INSTRUCTION_INDEX
            ),
            None,
        )
        if not memo_instruction:
            return ""

        memo_account = txs["message"]["accountKeys"][MEMO_INSTRUCTION_INDEX]
        if not memo_account or memo_account != PURCHASE_AUDIO_MEMO_PROGRAM:
            return ""
        return memo_instruction["data"]
    except Exception as e:
        logger.error(
            f"index_spl_token_backfill.py | Error parsing memo, {e}", exc_info=True
        )
        raise e


def decode_memo_and_extract_vendor(memo_encoded: str) -> str:
    try:
        memo = str(base58.b58decode(memo_encoded))
        if not memo or "In-App $AUDIO Purchase:" not in memo:
            return ""

        vendor = memo[1:-1].split(":")[1][1:]
        if vendor not in purchase_vendor_map:
            return ""
        return vendor
    except Exception as e:
        logger.error(
            f"index_spl_token_backfill.py | Error decoding memo, {e}", exc_info=True
        )
        raise e


def parse_spl_token_transaction(
    solana_client_manager: SolanaClientManager,
    tx_sig: ConfirmedSignatureForAddressResult,
) -> Optional[SplTokenTransactionInfo]:
    try:
        if tx_sig["err"]:
            return None
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig["signature"])
        result = tx_info["result"]
        meta = result["meta"]
        error = meta["err"]
        if error:
            return None

        memo_encoded = parse_memo_instruction(result)
        vendor = decode_memo_and_extract_vendor(memo_encoded) if memo_encoded else None

        sender_root_account = get_solana_tx_owner(meta, SENDER_ACCOUNT_INDEX)
        receiver_root_account = get_solana_tx_owner(meta, RECEIVER_ACCOUNT_INDEX)
        account_keys = result["transaction"]["message"]["accountKeys"]
        receiver_token_account = account_keys[RECEIVER_ACCOUNT_INDEX]
        sender_token_account = account_keys[SENDER_ACCOUNT_INDEX]
        prebalance, postbalance = get_solana_tx_token_balances(
            meta, RECEIVER_ACCOUNT_INDEX
        )
        # Skip if there is no balance change.
        if postbalance - prebalance == 0:
            return None
        receiver_spl_tx_info: SplTokenTransactionInfo = {
            "user_bank": receiver_token_account,
            "signature": tx_sig["signature"],
            "slot": result["slot"],
            "timestamp": datetime.datetime.utcfromtimestamp(result["blockTime"]),
            "vendor": vendor,
            "prebalance": prebalance,
            "postbalance": postbalance,
            "sender_wallet": sender_root_account,
            "root_accounts": [sender_root_account, receiver_root_account],
            "token_accounts": [sender_token_account, receiver_token_account],
        }
        return receiver_spl_tx_info

    except Exception as e:
        signature = tx_sig["signature"]
        logger.error(
            f"index_spl_token_backfill.py | Error processing {signature}, {e}",
            exc_info=True,
        )
        raise e


def process_spl_token_transactions(
    txs: List[SplTokenTransactionInfo], user_bank_set: Set[str]
) -> List[AudioTransactionsHistory]:
    try:
        audio_txs = []
        for tx_info in txs:
            # Disregard if recipient account is not a user_bank
            if tx_info["user_bank"] not in user_bank_set:
                continue

            logger.info(
                f"index_spl_token_backfill.py | processing transaction: {tx_info['signature']} | slot={tx_info['slot']}"
            )
            vendor = tx_info["vendor"]
            # Index as an external receive transaction
            # Note: external sends are under a different program, see index_user_bank.py
            if not vendor:
                audio_txs.append(
                    AudioTransactionsHistory(
                        user_bank=tx_info["user_bank"],
                        slot=tx_info["slot"],
                        signature=tx_info["signature"],
                        transaction_type=(TransactionType.transfer),
                        method=TransactionMethod.receive,
                        transaction_created_at=tx_info["timestamp"],
                        change=Decimal(tx_info["postbalance"] - tx_info["prebalance"]),
                        balance=Decimal(tx_info["postbalance"]),
                        tx_metadata=tx_info["sender_wallet"],
                    )
                )
            # Index as purchase transaction
            else:
                audio_txs.append(
                    AudioTransactionsHistory(
                        user_bank=tx_info["user_bank"],
                        slot=tx_info["slot"],
                        signature=tx_info["signature"],
                        transaction_type=purchase_vendor_map[vendor],
                        method=TransactionMethod.receive,
                        transaction_created_at=tx_info["timestamp"],
                        change=Decimal(tx_info["postbalance"] - tx_info["prebalance"]),
                        balance=Decimal(tx_info["postbalance"]),
                        tx_metadata=None,
                    )
                )
        return audio_txs

    except Exception as e:
        logger.error(
            f"index_spl_token_backfill.py | Error processing transaction {tx_info}, {e}",
            exc_info=True,
        )
        raise e


# Query the highest traversed solana slot
def get_latest_slot(db):
    latest_slot = None
    with db.scoped_session() as session:
        highest_slot_query = session.query(
            SPLTokenBackfillTransaction.last_scanned_slot
        ).first()
        # Can be None prior to first write operations
        if highest_slot_query is not None:
            latest_slot = highest_slot_query[0]

    # Return None if not yet cached
    return latest_slot


def parse_sol_tx_batch(
    db: SessionManager,
    solana_client_manager: SolanaClientManager,
    tx_sig_batch_records: List[ConfirmedSignatureForAddressResult],
    solana_logger: SolanaIndexingLogger,
):
    """
    Parse a batch of solana transactions in parallel by calling parse_spl_token_transaction
    with a ThreaPoolExecutor

    This function also has a recursive retry upto a certain limit in case a future doesn't complete
    within the alloted time. It clears the futures thread queue and the batch is retried
    """
    batch_start_time = time.time()
    # Last record in this batch to be cached
    # Important to note that the batch records are in time DESC order
    updated_token_accounts: Set[str] = set()
    spl_token_txs: List[ConfirmedTransaction] = []
    # Process each batch in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        parse_sol_tx_futures = {
            executor.submit(
                parse_spl_token_transaction,
                solana_client_manager,
                tx_sig,
            ): tx_sig
            for tx_sig in tx_sig_batch_records
        }
        try:
            for future in concurrent.futures.as_completed(
                parse_sol_tx_futures, timeout=45
            ):
                tx_info = future.result()
                if not tx_info:
                    continue
                updated_token_accounts.update(tx_info["token_accounts"])
                spl_token_txs.append(tx_info)

        except Exception as exc:
            logger.error(
                f"index_spl_token_backfill.py | Error parsing sol spl token transaction: {exc}"
            )
            raise exc

    with db.scoped_session() as session:
        if updated_token_accounts:
            user_result = (
                session.query(User.user_id, UserBankAccount.bank_account)
                .join(UserBankAccount, UserBankAccount.ethereum_address == User.wallet)
                .filter(
                    UserBankAccount.bank_account.in_(list(updated_token_accounts)),
                    User.is_current == True,
                )
                .all()
            )
            user_bank_set = {user[1] for user in user_result}

            audio_txs = process_spl_token_transactions(spl_token_txs, user_bank_set)
            session.bulk_save_objects(audio_txs)

        if tx_sig_batch_records:
            last_tx = tx_sig_batch_records[0]

            last_scanned_slot = last_tx["slot"]
            last_scanned_signature = last_tx["signature"]
            solana_logger.add_log(
                f"Updating last_scanned_slot to {last_scanned_slot} and signature to {last_scanned_signature}"
            )

            record = session.query(SPLTokenBackfillTransaction).first()
            if record:
                record.last_scanned_slot = last_scanned_slot
                record.signature = last_scanned_signature
            else:
                record = SPLTokenBackfillTransaction(
                    last_scanned_slot=last_scanned_slot,
                    signature=last_scanned_signature,
                )
            session.add(record)

    batch_end_time = time.time()
    batch_duration = batch_end_time - batch_start_time
    solana_logger.add_log(
        f"processed batch {len(tx_sig_batch_records)} txs in {batch_duration}s"
    )

    return updated_token_accounts


def split_list(list, n):
    for i in range(0, len(list), n):
        yield list[i : i + n]


def process_spl_token_tx(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    stop_sig: str,
):
    solana_logger = SolanaIndexingLogger("index_spl_token")
    solana_logger.start_time("fetch_batches")
    try:
        base58.b58decode(SPL_TOKEN_PROGRAM)
    except ValueError:
        logger.error(
            f"index_spl_token_backfill.py"
            f"Invalid Token program ({SPL_TOKEN_PROGRAM}) configured, exiting."
        )
        return

    # Highest currently processed slot in the DB
    latest_processed_slot = get_latest_slot(db)
    solana_logger.add_log(f"latest used slot: {latest_processed_slot}")

    # The 'before' value from where we start querying transactions
    last_tx_signature = stop_sig

    # Loop exit condition
    intersection_found = False

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures: List[ConfirmedSignatureForAddressResult] = []

    # Current batch of transactions
    transaction_signature_batch = []

    # Current batch
    page_count = 0

    # Traverse recent records until an intersection is found with latest slot
    while not intersection_found:
        solana_logger.add_log(f"Requesting transactions before {last_tx_signature}")
        transactions_history = solana_client_manager.get_signatures_for_address(
            SPL_TOKEN_PROGRAM,
            before=last_tx_signature,
            limit=FETCH_TX_SIGNATURES_BATCH_SIZE,
        )
        solana_logger.add_log(f"Retrieved transactions before {last_tx_signature}")
        transactions_array = transactions_history["result"]
        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            intersection_found = True
            solana_logger.add_log(f"No transactions found before {last_tx_signature}")
        else:
            # handle initial case where no there is no stored latest processed slot and start from current
            if latest_processed_slot is None:
                logger.debug("index_spl_token_backfill.py | setting from none")
                transaction_signature_batch = transactions_array
            else:
                for tx in transactions_array:
                    if tx["slot"] > latest_processed_slot:
                        transaction_signature_batch.append(tx)
                    elif tx["slot"] <= latest_processed_slot:
                        intersection_found = True
                        break
            # Restart processing at the end of this transaction signature batch
            last_tx = transactions_array[-1]
            last_tx_signature = last_tx["signature"]

            # Append batch of processed signatures
            if transaction_signature_batch:
                transaction_signatures.append(transaction_signature_batch)

            # Ensure processing does not grow unbounded
            if len(transaction_signatures) > TX_SIGNATURES_MAX_BATCHES:
                solana_logger.add_log(
                    f"slicing tx_sigs from {len(transaction_signatures)} entries"
                )
                transaction_signatures = transaction_signatures[
                    -TX_SIGNATURES_RESIZE_LENGTH:
                ]

            # Reset batch state
            transaction_signature_batch = []

        solana_logger.add_log(
            f"intersection_found={intersection_found},\
            last_tx_signature={last_tx_signature},\
            page_count={page_count}"
        )
        page_count = page_count + 1

    transaction_signatures.reverse()
    totals = {"user_ids": 0, "root_accts": 0, "token_accts": 0}
    solana_logger.end_time("fetch_batches")
    solana_logger.start_time("parse_batches")
    for tx_sig_batch in transaction_signatures:
        for tx_sig_batch_records in split_list(
            tx_sig_batch, TX_SIGNATURES_PROCESSING_SIZE
        ):
            token_accounts = parse_sol_tx_batch(
                db, solana_client_manager, tx_sig_batch_records, solana_logger
            )
            totals["token_accts"] += len(token_accounts)

    solana_logger.end_time("parse_batches")
    solana_logger.add_context("total_token_accts_updated", totals["token_accts"])

    logger.info("index_spl_token_backfill.py", extra=solana_logger.get_context())


index_spl_token_backfill_lock = "spl_token_backfill_lock"
purchase_types = [
    TransactionType.purchase_coinbase,
    TransactionType.purchase_stripe,
    TransactionType.purchase_unknown,
]


def check_if_backfilling_complete(
    session: Session, solana_client_manager: SolanaClientManager, redis: Redis
) -> bool:
    try:
        redis_complete = bool(redis.get(index_spl_token_backfill_complete))
        if redis_complete:
            return True

        stop_sig_tuple = (
            session.query(IndexingCheckpoint.signature)
            .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
            .first()
        )
        if not stop_sig_tuple:
            logger.error(
                "index_spl_token_backfill.py | Tried to check if complete, but no stop_sig"
            )
            return False
        stop_sig = stop_sig_tuple[0]

        one_sig_before_stop_result = solana_client_manager.get_signatures_for_address(
            SPL_TOKEN_PROGRAM,
            before=stop_sig,
            limit=1,
        )
        if not one_sig_before_stop_result:
            logger.error("index_spl_token_backfill.py | No sigs before stop_sig")
            return False
        one_sig_before_stop_result = one_sig_before_stop_result["result"][0]
        one_sig_before_stop = one_sig_before_stop_result["signature"]

        sig_before_stop_in_db = (
            session.query(SPLTokenBackfillTransaction)
            .filter(SPLTokenBackfillTransaction.signature == one_sig_before_stop)
            .first()
        )
        complete = bool(sig_before_stop_in_db)
        if complete:
            redis.set(index_spl_token_backfill_complete, int(complete))
        return complete
    except Exception as e:
        logger.error(
            "index_spl_token_backfill.py | Error during check_if_backfilling_complete",
            exc_info=True,
        )
        raise e


def find_true_stop_sig(
    session: Session, solana_client_manager: SolanaClientManager, stop_sig: str
) -> str:
    stop_sig_and_slot = (
        session.query(AudioTransactionsHistory.slot, AudioTransactionsHistory.signature)
        .filter(
            or_(
                AudioTransactionsHistory.transaction_type.in_(purchase_types),
                and_(
                    AudioTransactionsHistory.transaction_type
                    == TransactionType.transfer,
                    AudioTransactionsHistory.method == TransactionMethod.receive,
                ),
            )
        )
        .order_by(asc(AudioTransactionsHistory.slot))
    ).first()

    if not stop_sig_and_slot:
        return ""
    stop_sig = stop_sig_and_slot[1]
    stop_sig_slot = stop_sig_and_slot[0]

    # Traverse backwards 1-by-1 from the min sig from audio_transactions_history table.
    # When we find a sig that is not in the table, then the sig after that is the true
    # stop sig.
    count = 100
    while count:
        tx_before_stop_sig = solana_client_manager.get_signatures_for_address(
            SPL_TOKEN_PROGRAM,
            before=stop_sig,
            limit=1,
        )
        if tx_before_stop_sig:
            tx_before_stop_sig = tx_before_stop_sig["result"][0]
        if get_tx_in_audio_tx_history(session, tx_before_stop_sig["signature"]):
            stop_sig = tx_before_stop_sig["signature"]
            stop_sig_slot = tx_before_stop_sig["slot"]
        else:
            break
        count -= 1
    if not count:
        return ""

    session.add(
        IndexingCheckpoint(
            tablename=index_spl_token_backfill_tablename,
            last_checkpoint=stop_sig_slot,
            signature=stop_sig,
        )
    )
    logger.info(
        f"index_spl_token_backfill.py | Added new stop_sig to indexing_checkpoints: {stop_sig}"
    )
    return stop_sig


def check_progress(session: Session):
    stop_row = (
        session.query(IndexingCheckpoint)
        .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
        .first()
    )
    if not stop_row:
        return None
    ret: Any = {}
    ret["stop_slot"] = stop_row.last_checkpoint
    ret["stop_sig"] = stop_row.signature
    latest_processed_row = (
        session.query(SPLTokenBackfillTransaction)
        .order_by(desc(SPLTokenBackfillTransaction.last_scanned_slot))
        .first()
    )
    if not latest_processed_row:
        return ret
    ret["latest_processed_sig"] = latest_processed_row.signature
    ret["latest_processed_slot"] = latest_processed_row.last_scanned_slot
    min_row = (
        session.query(AudioTransactionsHistory)
        .filter(
            and_(
                or_(
                    AudioTransactionsHistory.transaction_type.in_(purchase_types),
                    and_(
                        AudioTransactionsHistory.transaction_type
                        == TransactionType.transfer,
                        AudioTransactionsHistory.method == TransactionMethod.receive,
                    ),
                ),
                AudioTransactionsHistory.slot < ret["stop_slot"],
            )
        )
        .order_by(asc(AudioTransactionsHistory.slot))
    ).first()
    if not min_row:
        return ret
    ret["min_slot"] = min_row.slot
    ret["min_sig"] = min_row.signature
    return ret


@celery.task(name="index_spl_token_backfill", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_spl_token_backfill(self):

    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = index_spl_token_backfill.redis
    solana_client_manager = index_spl_token_backfill.solana_client_manager
    db = index_spl_token_backfill.db
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock(
        index_spl_token_backfill_lock, blocking_timeout=25, timeout=14400
    )

    with db.scoped_session() as session:
        stop_sig = (
            session.query(IndexingCheckpoint.signature)
            .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
            .first()
        )
        if not stop_sig:
            stop_sig = find_true_stop_sig(session, solana_client_manager, stop_sig)
            if not stop_sig:
                logger.info(
                    "index_spl_token_backfill.py | Failed to find true stop signature"
                )
                return
            logger.info(
                f"index_spl_token_backfill.py | Found true stop_sig: {stop_sig}"
            )
        else:
            stop_sig = stop_sig[0]

        if not stop_sig:
            logger.info(
                f"index_spl_token_backfill.py | Error with stop_sig: {stop_sig}"
            )
            return

        if check_if_backfilling_complete(session, solana_client_manager, redis):
            logger.info("index_spl_token_backfill.py | Backfill indexing complete!")
            return

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_spl_token_backfill.py | Acquired lock")
            process_spl_token_tx(solana_client_manager, db, stop_sig)
    except Exception as e:
        logger.error(
            "index_spl_token_backfill.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
