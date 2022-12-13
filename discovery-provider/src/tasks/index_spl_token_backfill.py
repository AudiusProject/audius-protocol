import concurrent.futures
import datetime
import logging
import time
from decimal import Decimal
from typing import Any, List, Optional, Set, TypedDict

import base58
from redis import Redis
from solana.publickey import PublicKey
from sqlalchemy import and_, asc, or_
from sqlalchemy.orm.session import Session
from src.exceptions import UnsupportedVersionError
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
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import SPL_TOKEN_ID
from src.solana.solana_transaction_types import (
    ConfirmedSignatureForAddressResult,
    ConfirmedTransaction,
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import (
    get_account_index,
    get_solana_tx_owner,
    get_solana_tx_token_balances,
    get_valid_instruction,
    has_log,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager
from src.utils.solana_indexing_logger import SolanaIndexingLogger

SPL_TOKEN_PROGRAM = shared_config["solana"]["waudio_mint"]
SPL_TOKEN_PUBKEY = PublicKey(SPL_TOKEN_PROGRAM) if SPL_TOKEN_PROGRAM else None
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
USER_BANK_PUBKEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
PURCHASE_AUDIO_MEMO_PROGRAM = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
MIN_SIG = str(shared_config["solana"]["spl_token_backfill_min_sig"])
TRANSFER_CHECKED_INSTRUCTION = "Program log: Instruction: TransferChecked"

# Number of signatures that are fetched from RPC and written at once
# For example, in a batch of 1000 only 100 will be fetched and written in parallel
# Intended to relieve RPC and DB pressure
TX_SIGNATURES_PROCESSING_SIZE = 100

# Index of memo instruction in instructions list
MEMO_INSTRUCTION_INDEX = 4
# Index of receiver account in solana transaction pre/post balances
# Note: the receiver index is currently the same for purchase and transfer instructions
# but this assumption could change in the future.
RECEIVER_ACCOUNT_INDEX = 2
# Thought we don't index transfers from the sender's side in this task, we must still
# enqueue the sender's accounts for balance refreshes if they are Audius accounts.
SENDER_ACCOUNT_INDEX = 0

purchase_vendor_map = {
    "Link by Stripe": TransactionType.purchase_stripe,
    "Coinbase Pay": TransactionType.purchase_coinbase,
    "Unknown": TransactionType.purchase_unknown,
}
index_spl_token_backfill_lock = "spl_token_backfill_lock"
index_spl_token_backfill_tablename = "index_spl_token_backfill"
index_spl_token_backfill_complete = "index_spl_token_backfill_complete"
index_spl_token_backfill_min_slot = "index_spl_token_backfill_min_slot"

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
    session: Session,
    solana_client_manager: SolanaClientManager,
    tx: ConfirmedSignatureForAddressResult,
) -> Optional[SplTokenTransactionInfo]:
    try:
        if tx["err"]:
            return None
        tx_start_time = time.time()
        tx_info = solana_client_manager.get_sol_tx_info(tx["signature"])
        tx_end_time = time.time()
        logger.info(
            f"index_spl_token_backfill.py | get_sol_tx_info time: {tx_end_time - tx_start_time}"
        )

        result = tx_info["result"]
        meta = result["meta"]
        error = meta["err"]
        if error:
            return None
        tx_sig = tx["signature"]
        tx_slot = result["slot"]

        has_transfer_checked_instruction = has_log(meta, TRANSFER_CHECKED_INSTRUCTION)
        if not has_transfer_checked_instruction:
            logger.info(
                f"index_spl_token_backfill.py | {tx_sig} no transfer checked instruction"
            )
            return None
        tx_message = result["transaction"]["message"]
        instruction = get_valid_instruction(tx_message, meta, SPL_TOKEN_ID)
        if not instruction:
            logger.error(
                f"index_spl_token_backfill.py | {tx_sig} No Valid instruction for spl token program {SPL_TOKEN_ID} found"
            )
            return None

        memo_encoded = parse_memo_instruction(result)
        vendor = decode_memo_and_extract_vendor(memo_encoded) if memo_encoded else None

        sender_idx = get_account_index(instruction, SENDER_ACCOUNT_INDEX)
        receiver_idx = get_account_index(instruction, RECEIVER_ACCOUNT_INDEX)
        account_keys = result["transaction"]["message"]["accountKeys"]
        sender_token_account = account_keys[sender_idx]
        receiver_token_account = account_keys[receiver_idx]
        sender_root_account = get_solana_tx_owner(meta, sender_idx)
        prebalance, postbalance = get_solana_tx_token_balances(meta, receiver_idx)
        logger.info(
            f"index_spl_token_backfill.py | receiver_idx: {receiver_idx} prebalance: {prebalance} post_balance: {postbalance} sig: {tx_sig} meta: {meta}"
        )
        # Balance is expected to change if there is a transfer instruction.
        if postbalance == -1 or prebalance == -1:
            logger.error(
                f"index_spl_token_backfill.py | {tx_sig} error while parsing pre and post balances"
            )
            return None
        if postbalance - prebalance == 0:
            logger.error(
                f"index_spl_token_backfill.py | {tx_sig} no balance change found"
            )
            return None

        receiver_spl_tx_info: SplTokenTransactionInfo = {
            "user_bank": receiver_token_account,
            "signature": tx_sig,
            "slot": tx_slot,
            "timestamp": datetime.datetime.utcfromtimestamp(result["blockTime"]),
            "vendor": vendor,
            "prebalance": prebalance,
            "postbalance": postbalance,
            "sender_wallet": sender_root_account,
            "token_accounts": [sender_token_account, receiver_token_account],
        }
        return receiver_spl_tx_info

    except UnsupportedVersionError:
        return None
    except Exception as e:
        logger.error(
            f"index_spl_token_backfill.py | Error processing {tx['signature']}, {e}",
            exc_info=True,
        )
        raise e


def process_spl_token_transactions(
    txs: List[SplTokenTransactionInfo], user_bank_set: Set[str]
) -> List[AudioTransactionsHistory]:
    try:
        audio_txs: List[AudioTransactionsHistory] = []
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


# Return lowest spl-token tx signature and slot that has been processed
def get_earliest_processed_tx(session: Session):
    """Fetches the most recent slot for Challenge Disburements"""
    min_sig = (
        session.query(
            IndexingCheckpoint.signature, IndexingCheckpoint.last_checkpoint
        ).filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
    ).first()
    if not min_sig:
        return None, None
    return min_sig


def parse_sol_tx_batch(
    db: SessionManager,
    solana_client_manager: SolanaClientManager,
    tx_sig_batch_records: List[ConfirmedSignatureForAddressResult],
):
    """
    Parse a batch of solana transactions in parallel by calling parse_spl_token_transaction
    with a ThreaPoolExecutor

    This function also has a recursive retry upto a certain limit in case a future doesn't complete
    within the alloted time. It clears the futures thread queue and the batch is retried
    """
    # Last record in this batch to be cached
    # Important to note that the batch records are in time DESC order
    updated_token_accounts: Set[str] = set()
    spl_token_txs: List[ConfirmedTransaction] = []
    earliest_tx = tx_sig_batch_records[-1]
    # Process each batch in parallel
    logger.info(
        f"index_spl_token_backfill.py | parsing slot starting at {tx_sig_batch_records[0]['slot']}"
    )
    fetch_start_time = time.time()
    with db.scoped_session() as session:
        with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
            parse_sol_tx_futures = {
                executor.submit(
                    parse_spl_token_transaction,
                    session,
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

    fetch_end_time = time.time()
    logger.info(
        f"index_spl_token_backfill.py | fetched {len(tx_sig_batch_records)} fetch time: {fetch_end_time - fetch_start_time}"
    )
    process_start_time = time.time()
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
            if audio_txs:
                session.bulk_save_objects(audio_txs)
                logger.info(
                    f"index_spl_token_backfill.py | added txs to audio_tx_hist table starting with: {audio_txs[0]}"
                )

        spl_backfill_txs = [
            SPLTokenBackfillTransaction(
                slot=tx["slot"],
                signature=tx["signature"],
                created_at=datetime.datetime.utcfromtimestamp(tx["blockTime"]),
            )
            for tx in tx_sig_batch_records
        ]
        session.bulk_save_objects(spl_backfill_txs)

        # Checkpoint earliest processed signature
        record = (
            session.query(IndexingCheckpoint)
            .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
            .first()
        )
        earliest_sig = earliest_tx["signature"]
        earliest_slot = earliest_tx["slot"]
        if record:
            record.last_checkpoint = earliest_slot
            record.signature = earliest_sig
        else:
            logger.error(
                "index_spl_token_backfill.py | Indexing checkpoint did not exist"
            )
            raise Exception("Indexing checkpoint did not exist")
        logger.info(
            f"index_spl_token_backfill.py | Checkpointing earliest sig: {earliest_sig} slot: {earliest_slot}"
        )
        session.add(record)

    process_end_time = time.time()
    logger.info(
        f"index_spl_token_backfill.py | processed batch {len(tx_sig_batch_records)} txs in {process_end_time - process_start_time}s"
    )

    return updated_token_accounts


def split_list(list, n):
    for i in range(0, len(list), n):
        yield list[i : i + n]


def process_spl_token_tx(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
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

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures: List[ConfirmedSignatureForAddressResult] = []

    # Traverse recent records until an intersection is found with latest slot
    with db.scoped_session() as session:
        earliest_processed_sig, earliest_processed_slot = get_earliest_processed_tx(
            session
        )
        logger.info(
            f"index_spl_token_backfill.py | high tx = {earliest_processed_sig}, slot = {earliest_processed_slot}"
        )

    while len(transaction_signatures) < TX_SIGNATURES_MAX_BATCHES:
        logger.info(f"Requesting transactions before {earliest_processed_sig}")
        transactions_history = solana_client_manager.get_signatures_for_address(
            SPL_TOKEN_PROGRAM,
            before=earliest_processed_sig,
            limit=FETCH_TX_SIGNATURES_BATCH_SIZE,
        )
        transactions_array = transactions_history["result"]
        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            logger.info(
                f"No transactions found before {earliest_processed_sig}, got {transactions_array}"
            )
            if earliest_processed_sig != MIN_SIG:
                logger.error(
                    f"No transactions found before {earliest_processed_sig}, but there should be."
                )
            break
        else:
            logger.info(
                f"index_spl_token_backfill.py | adding to batch: newest slot {transactions_array[0]['slot']}"
            )
            # handle initial case where no there is no stored latest processed slot and start from current
            # Restart processing at the end of this transaction signature batch
            earliest_tx = transactions_array[-1]
            earliest_processed_sig = earliest_tx["signature"]

            # Append batch of processed signatures
            transaction_signatures.append(transactions_array)

    totals = {"user_ids": 0, "root_accts": 0, "token_accts": 0}
    solana_logger.end_time("fetch_batches")
    solana_logger.start_time("parse_batches")
    for tx_sig_batch in transaction_signatures:
        logger.info(
            f"index_spl_token_backfill.py | parsing new batch starting with {tx_sig_batch[0]}"
        )
        token_accounts = parse_sol_tx_batch(db, solana_client_manager, tx_sig_batch)
        totals["token_accts"] += len(token_accounts)

    solana_logger.end_time("parse_batches")
    solana_logger.add_context("total_token_accts_updated", totals["token_accts"])

    logger.info("index_spl_token_backfill.py", extra=solana_logger.get_context())


purchase_types = [
    TransactionType.purchase_coinbase,
    TransactionType.purchase_stripe,
    TransactionType.purchase_unknown,
]


def check_if_backfilling_complete(
    earliest_program_slot: int,
    session: Session,
    solana_client_manager: SolanaClientManager,
    redis: Redis,
) -> bool:
    try:
        redis_complete = bool(redis.get(index_spl_token_backfill_complete))
        if redis_complete:
            return True

        earliest_processed_tuple = (
            session.query(
                IndexingCheckpoint.signature, IndexingCheckpoint.last_checkpoint
            )
            .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
            .first()
        )
        if not earliest_processed_tuple:
            logger.error(
                "index_spl_token_backfill.py | Tried to check if complete, but no stop_sig"
            )
            return False
        earliest_processed_sig = earliest_processed_tuple[0]
        earliest_processed_slot = earliest_processed_tuple[1]

        complete = earliest_processed_sig == MIN_SIG
        if complete:
            redis.set(index_spl_token_backfill_complete, int(complete))
        logger.debug(
            f"index_spl_token_backfill.py | Checking for completion, earliest processed tx sig={earliest_processed_sig} slot={earliest_processed_slot}, {earliest_processed_slot - earliest_program_slot} slots left"
        )
        return complete
    except Exception as e:
        logger.error(
            "index_spl_token_backfill.py | Error during check_if_backfilling_complete",
            exc_info=True,
        )
        raise e


# This should only run once - the first time this backfiller starts up, indexing_checkpoints
# table will not contain a row pertaining to this backfiller, so we populate it with the
# earliest signature from audio_transactions_history table.
def find_earliest_audio_tx_hist_tx(
    session: Session, solana_client_manager: SolanaClientManager
) -> str:
    earliest_sig_and_slot = (
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

    if not earliest_sig_and_slot:
        logger.info(
            "index_spl_token_backfill.py | No relevant tx in audio_transactions_history yet."
        )
        return ""
    earliest_sig = earliest_sig_and_slot[1]
    earliest_slot = earliest_sig_and_slot[0]

    # Traverse backwards 1-by-1 in time descending order from the earliest sig from
    # audio_transactions_history table. When we encounter a sig that is not in the table,
    # then the sig after that is the true earliest sig. This is necessary because ordering
    # in audio_transactions_history db is not necessarily the same as Solana transaction
    # ordering. Avoid an infinite loop by limiting to 100 hops.
    count = 100
    while count:
        tx_before_earliest_sig = solana_client_manager.get_signatures_for_address(
            SPL_TOKEN_PROGRAM, before=earliest_sig, limit=1
        )
        if tx_before_earliest_sig:
            tx_before_earliest_sig = tx_before_earliest_sig["result"][0]
        if get_tx_in_audio_tx_history(session, tx_before_earliest_sig["signature"]):
            earliest_sig = tx_before_earliest_sig["signature"]
            earliest_slot = tx_before_earliest_sig["slot"]
        else:
            break
        count -= 1
    if not count:
        return ""

    record = (
        session.query(IndexingCheckpoint)
        .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
        .first()
    )
    if record:
        logger.error(
            f"index_spl_token_backfill.py | Tried to add new earliest_sig to IndexingCheckpoints table but one already exists! new earliest sig: {earliest_sig}"
        )
    session.add(
        IndexingCheckpoint(
            tablename=index_spl_token_backfill_tablename,
            last_checkpoint=earliest_slot,
            signature=earliest_sig,
        )
    )
    logger.info(
        f"index_spl_token_backfill.py | Added new earliest_sig to indexing_checkpoints: {earliest_sig}"
    )
    return earliest_sig


def check_progress(session: Session, redis: Redis):
    earliest_processed_row = (
        session.query(IndexingCheckpoint)
        .filter(IndexingCheckpoint.tablename == index_spl_token_backfill_tablename)
        .first()
    )
    if not earliest_processed_row:
        return None
    ret: Any = {}
    ret["earliest_processed_sig"] = earliest_processed_row.signature
    ret["earliest_processed_slot"] = earliest_processed_row.last_checkpoint
    ret["earliest_program_sig"] = MIN_SIG
    earliest_program_slot = redis.get(index_spl_token_backfill_min_slot)
    if earliest_program_slot:
        earliest_program_slot = int(earliest_program_slot)
        ret["earliest_program_slot"] = earliest_program_slot
        ret["slots_left"] = (
            earliest_processed_row.last_checkpoint - earliest_program_slot
        )
    txs_traversed = session.query(SPLTokenBackfillTransaction).count()
    ret["txs_traversed"] = txs_traversed
    return ret


# ####### CELERY TASKS ####### #
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
    update_lock = redis.lock(index_spl_token_backfill_lock)

    try:
        # Fetch earliest program slot for use in check_progress() (used by get_health.py)
        earliest_program_slot = redis.get(index_spl_token_backfill_min_slot)
        if not earliest_program_slot:
            earliest_tx_info = solana_client_manager.get_sol_tx_info(MIN_SIG)
            earliest_program_slot = earliest_tx_info["result"]["slot"]
            if earliest_tx_info:
                redis.set(index_spl_token_backfill_min_slot, earliest_program_slot)
        earliest_program_slot = int(earliest_program_slot)

        with db.scoped_session() as session:
            # Ensure that there is at least one relevant tx in audio_transactions_history
            # table, and that IndexingCheckpoints is populated.
            earliest_processed_sig, _ = get_earliest_processed_tx(session)
            if not earliest_processed_sig:
                if not find_earliest_audio_tx_hist_tx(session, solana_client_manager):
                    return

            if check_if_backfilling_complete(
                earliest_program_slot, session, solana_client_manager, redis
            ):
                logger.info("index_spl_token_backfill.py | Backfill indexing complete!")
                return

        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_spl_token_backfill.py | Acquired lock")
            process_spl_token_tx(solana_client_manager, db)
    except Exception as e:
        logger.error(
            f"index_spl_token_backfill.py | Fatal error in main loop: {e}",
            exc_info=True,
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
