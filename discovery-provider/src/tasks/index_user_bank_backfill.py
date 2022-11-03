import concurrent.futures
import datetime
import logging
import re
import time
from decimal import Decimal
from typing import List, Optional, TypedDict

from redis import Redis
from solana.publickey import PublicKey
from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm.session import Session
from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.models.users.user_bank_backfill import UserBankBackfillTx
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_parser import (
    InstructionFormat,
    SolanaInstructionType,
    parse_instruction_data,
)
from src.solana.solana_transaction_types import (
    ConfirmedTransaction,
    ResultMeta,
    TransactionInfoResult,
    TransactionMessage,
    TransactionMessageInstruction,
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import get_solana_tx_token_balances
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)

# Populate values used in UserBank indexing from config
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
WAUDIO_MINT = shared_config["solana"]["waudio_mint"]
USER_BANK_KEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
WAUDIO_MINT_PUBKEY = PublicKey(WAUDIO_MINT) if WAUDIO_MINT else None

# Used to limit tx history if needed
MIN_SLOT = int(shared_config["solana"]["user_bank_min_slot"])

# Used to find the correct accounts for sender/receiver in the transaction
TRANSFER_SENDER_ACCOUNT_INDEX = 1
TRANSFER_RECEIVER_ACCOUNT_INDEX = 2

index_user_bank_backfill_tablename = "index_user_bank_backfill"


# Recover ethereum public key from bytes array
# Message formatted as follows:
# EthereumAddress = [214, 237, 135, 129, 143, 240, 221, 138, 97, 84, 199, 236, 234, 175, 81, 23, 114, 209, 118, 39]
def parse_eth_address_from_msg(msg: str):
    res = re.findall(r"\[.*?\]", msg)
    # Remove brackets
    inner_res = res[0][1:-1]
    # Convert to public key hex for ethereum
    arr_val = [int(s) for s in inner_res.split(",")]
    public_key_bytes = bytes(arr_val)
    public_key = public_key_bytes.hex()
    public_key_str = f"0x{public_key}"
    return public_key_str, public_key_bytes


# Return highest user bank slot that has been processed
def get_highest_user_bank_tx_slot(session: Session):
    slot = MIN_SLOT
    tx_query = (
        session.query(UserBankBackfillTx.slot).order_by(desc(UserBankBackfillTx.slot))
    ).first()
    if tx_query:
        slot = tx_query[0]
    return slot


# Query a tx signature and confirm its existence
def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    exists = False
    tx_sig_db_count = (
        session.query(UserBankBackfillTx).filter(UserBankBackfillTx.signature == tx_sig)
    ).count()
    exists = tx_sig_db_count > 0
    return exists


def get_tx_in_audio_tx_history(session: Session, tx_sig: str) -> bool:
    """Checks if the transaction signature already exists in Audio Transactions History"""
    tx_sig_in_db = (
        session.query(AudioTransactionsHistory).filter(
            AudioTransactionsHistory.signature == tx_sig
        )
    ).first()
    return bool(tx_sig_in_db)


def get_user_ids_from_bank_accounts(session: Session, accts=List[str]):
    results = (
        session.query(User.user_id, UserBankAccount.bank_account)
        .join(
            UserBankAccount,
            and_(
                UserBankAccount.bank_account.in_(accts),
                UserBankAccount.ethereum_address == User.wallet,
            ),
        )
        .filter(User.is_current == True)
        .all()
    )
    return results


create_token_account_instr: List[InstructionFormat] = [
    {"name": "eth_address", "type": SolanaInstructionType.EthereumAddress},
]


def process_transfer_instruction(
    session: Session,
    instruction: TransactionMessageInstruction,
    account_keys: List[str],
    meta: ResultMeta,
    tx_sig: str,
    slot: int,
    timestamp: datetime.datetime,
):
    # The transaction might list sender/receiver in a different order in the pubKeys.
    # The "accounts" field of the instruction has the mapping of accounts to pubKey index
    sender_index = instruction["accounts"][TRANSFER_SENDER_ACCOUNT_INDEX]
    receiver_index = instruction["accounts"][TRANSFER_RECEIVER_ACCOUNT_INDEX]
    sender_account = account_keys[sender_index]
    receiver_account = account_keys[receiver_index]
    # Accounts to refresh balance
    logger.info(
        f"index_user_bank_backfill.py | Balance refresh accounts: {sender_account}, {receiver_account}"
    )
    user_id_accounts = get_user_ids_from_bank_accounts(
        session, [sender_account, receiver_account]
    )
    if not user_id_accounts:
        logger.error(
            "index_user_bank_backfill.py | ERROR: Neither accounts are user banks"
        )
        return

    sender_user_id: Optional[int] = None
    receiver_user_id: Optional[int] = None
    for user_id_account in user_id_accounts:
        if user_id_account[1] == sender_account:
            sender_user_id = user_id_account[0]
        elif user_id_account[1] == receiver_account:
            receiver_user_id = user_id_account[0]
    if sender_user_id is None:
        logger.error(
            f"index_user_bank_backfill.py | ERROR: Unexpected user ids in results: {user_id_accounts}"
        )
        return

    pre_sender_balance, post_sender_balance = get_solana_tx_token_balances(
        meta, sender_index
    )
    pre_receiver_balance, post_receiver_balance = get_solana_tx_token_balances(
        meta, receiver_index
    )
    if (
        pre_sender_balance is None
        or pre_receiver_balance is None
        or post_sender_balance is None
        or post_receiver_balance is None
    ):
        logger.error(
            "index_user_bank_backfill.py | ERROR: Sender or Receiver balance missing!"
        )
        return
    sent_amount = pre_sender_balance - post_sender_balance
    received_amount = post_receiver_balance - pre_receiver_balance
    if sent_amount != received_amount:
        logger.error(
            f"index_user_bank_backfill.py | ERROR: Sent and received amounts don't match. Sent = {sent_amount}, Received = {received_amount}"
        )
        return

    # If there was only 1 user bank, index as a send external transfer
    # Cannot index receive external transfers this way as those use the spl-token program
    if len(user_id_accounts) == 1:
        audio_transfer_sent = AudioTransactionsHistory(
            user_bank=sender_account,
            slot=slot,
            signature=tx_sig,
            transaction_type=TransactionType.transfer,
            method=TransactionMethod.send,
            transaction_created_at=timestamp,
            change=Decimal(sent_amount),
            balance=Decimal(post_sender_balance),
            tx_metadata=receiver_account,
        )
        logger.debug(
            f"index_user_bank_backfill.py | Creating audio_transfer_sent {audio_transfer_sent}"
        )
        session.add(audio_transfer_sent)

    # If there are two userbanks to update, it was a transfer from user to user
    # Index as a user_tip
    elif len(user_id_accounts) == 2:
        if receiver_user_id is None:
            logger.error(
                f"index_user_bank_backfill.py | ERROR: Unexpected user ids in results: {user_id_accounts}"
            )
            return

        audio_tx_sent = AudioTransactionsHistory(
            user_bank=sender_account,
            slot=slot,
            signature=tx_sig,
            transaction_type=TransactionType.tip,
            method=TransactionMethod.send,
            transaction_created_at=timestamp,
            change=Decimal(sent_amount),
            balance=Decimal(post_sender_balance),
            tx_metadata=str(receiver_user_id),
        )
        logger.debug(
            f"index_user_bank_backfill.py | Creating audio_tx_history send tx for tip {audio_tx_sent}"
        )
        session.add(audio_tx_sent)
        audio_tx_received = AudioTransactionsHistory(
            user_bank=receiver_account,
            slot=slot,
            signature=tx_sig,
            transaction_type=TransactionType.tip,
            method=TransactionMethod.receive,
            transaction_created_at=timestamp,
            change=Decimal(received_amount),
            balance=Decimal(post_receiver_balance),
            tx_metadata=str(sender_user_id),
        )
        session.add(audio_tx_received)
        logger.debug(
            f"index_user_bank_backfill.py | Creating audio_tx_history received tx for tip {audio_tx_received}"
        )


class CreateTokenAccount(TypedDict):
    eth_address: str


def parse_create_token_data(data: str) -> CreateTokenAccount:
    """Parse Transfer instruction data submitted to Audius Claimable Token program

    Instruction struct:
    pub struct TransferArgs {
        pub eth_address: EthereumAddress,
    }

    Decodes the data and parses each param into the correct type
    """

    return parse_instruction_data(data, create_token_account_instr)


def get_valid_instruction(
    tx_message: TransactionMessage, meta: ResultMeta
) -> Optional[TransactionMessageInstruction]:
    """Checks that the tx is valid
    checks for the transaction message for correct instruction log
    checks accounts keys for claimable token program
    """
    try:
        account_keys = tx_message["accountKeys"]
        instructions = tx_message["instructions"]
        user_bank_program_index = account_keys.index(USER_BANK_ADDRESS)
        for instruction in instructions:
            if instruction["programIdIndex"] == user_bank_program_index:
                return instruction

        return None
    except Exception as e:
        logger.error(
            f"index_user_bank_backfill.py | Error processing instruction valid, {e}",
            exc_info=True,
        )
        return None


def process_user_bank_tx_details(
    session: Session,
    tx_info: ConfirmedTransaction,
    tx_sig,
    timestamp,
):
    result: TransactionInfoResult = tx_info["result"]
    meta = result["meta"]
    error = meta["err"]
    if error:
        logger.info(
            f"index_user_bank_backfill.py | Skipping error transaction from chain {tx_info}"
        )
        return
    account_keys = tx_info["result"]["transaction"]["message"]["accountKeys"]
    tx_message = result["transaction"]["message"]

    # Check for valid instruction
    has_create_token_instruction = any(
        log == "Program log: Instruction: CreateTokenAccount"
        for log in meta["logMessages"]
    )
    has_transfer_instruction = any(
        log == "Program log: Instruction: Transfer" for log in meta["logMessages"]
    )

    if not has_create_token_instruction and not has_transfer_instruction:
        return

    instruction = get_valid_instruction(tx_message, meta)
    if instruction is None:
        logger.error(
            f"index_user_bank_backfill.py | {tx_sig} No Valid instruction found"
        )
        return

    if has_transfer_instruction:
        process_transfer_instruction(
            session=session,
            instruction=instruction,
            account_keys=account_keys,
            meta=meta,
            tx_sig=tx_sig,
            slot=result["slot"],
            timestamp=timestamp,
        )


def parse_user_bank_transaction(
    session: Session,
    solana_client_manager: SolanaClientManager,
    tx_sig,
):
    tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
    tx_slot = tx_info["result"]["slot"]
    timestamp = tx_info["result"]["blockTime"]
    parsed_timestamp = datetime.datetime.utcfromtimestamp(timestamp)

    logger.debug(
        f"index_user_bank_backfill.py | parse_user_bank_transaction |\
    {tx_slot}, {tx_sig} | {tx_info} | {parsed_timestamp}"
    )

    process_user_bank_tx_details(session, tx_info, tx_sig, parsed_timestamp)
    session.add(
        UserBankBackfillTx(signature=tx_sig, slot=tx_slot, created_at=parsed_timestamp)
    )
    return (tx_info["result"], tx_sig)


def process_user_bank_txs(stop_sig: str):
    solana_client_manager: SolanaClientManager = (
        index_user_bank_backfill.solana_client_manager
    )
    db = index_user_bank_backfill.db
    logger.info("index_user_bank_backfill.py | Acquired lock")

    # Exit if required configs are not found
    if not WAUDIO_MINT_PUBKEY or not USER_BANK_KEY:
        logger.error(
            f"index_user_bank_backfill.py | Missing required configuration"
            f"WAUDIO_PROGRAM_PUBKEY: {WAUDIO_MINT_PUBKEY} USER_BANK_KEY: {USER_BANK_KEY}- exiting."
        )
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = stop_sig

    # Loop exit condition
    intersection_found = False

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_highest_user_bank_tx_slot(session)
        logger.info(f"index_user_bank_backfill.py | high tx = {latest_processed_slot}")
        while not intersection_found:
            transactions_history = solana_client_manager.get_signatures_for_address(
                USER_BANK_ADDRESS,
                before=last_tx_signature,
                limit=FETCH_TX_SIGNATURES_BATCH_SIZE,
            )
            transactions_array = transactions_history["result"]
            if not transactions_array:
                intersection_found = True
                logger.info(
                    f"index_user_bank_backfill.py | No transactions found before {last_tx_signature}"
                )
            else:
                # Current batch of transactions
                transaction_signature_batch = []
                for tx_info in transactions_array:
                    tx_sig = tx_info["signature"]
                    tx_slot = tx_info["slot"]
                    logger.debug(
                        f"index_user_bank_backfill.py | Processing tx={tx_sig} | slot={tx_slot}"
                    )
                    logger.info(
                        f"index_user_bank_backfill.py | Processing tx={tx_sig} | slot={tx_slot}"
                    )
                    if tx_info["slot"] > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif (
                        tx_info["slot"] <= latest_processed_slot
                        and tx_info["slot"] > MIN_SLOT
                    ):
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_user_bank_backfill.py | Latest slot re-traversal\
                            slot={tx_slot}, sig={tx_sig},\
                            latest_processed_slot(db)={latest_processed_slot}"
                        )
                        exists = get_tx_in_db(session, tx_sig)
                        if exists:
                            intersection_found = True
                            break
                        # Ensure this transaction is still processed
                        transaction_signature_batch.append(tx_sig)

                # Restart processing at the end of this transaction signature batch
                last_tx = transactions_array[-1]
                last_tx_signature = last_tx["signature"]

                # Append batch of processed signatures
                if transaction_signature_batch:
                    transaction_signatures.append(transaction_signature_batch)

                # Ensure processing does not grow unbounded
                if len(transaction_signatures) > TX_SIGNATURES_MAX_BATCHES:
                    prev_len = len(transaction_signatures)
                    # Only take the oldest transaction from the transaction_signatures array
                    # transaction_signatures is sorted from newest to oldest
                    transaction_signatures = transaction_signatures[
                        -TX_SIGNATURES_RESIZE_LENGTH:
                    ]
                    logger.info(
                        f"index_user_bank_backfill.py | sliced tx_sigs from {prev_len} to {len(transaction_signatures)} entries"
                    )

    # Reverse batches aggregated so oldest transactions are processed first
    transaction_signatures.reverse()

    last_tx_sig: Optional[str] = None
    last_tx = None
    if transaction_signatures and transaction_signatures[-1]:
        last_tx_sig = transaction_signatures[-1][0]

    num_txs_processed = 0
    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_user_bank_backfill.py | processing {tx_sig_batch}")
        batch_start_time = time.time()
        # Process each batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            with db.scoped_session() as session:
                parse_sol_tx_futures = {
                    executor.submit(
                        parse_user_bank_transaction,
                        session,
                        solana_client_manager,
                        tx_sig,
                    ): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                    try:
                        # No return value expected here so we just ensure all futures are resolved
                        tx_info, tx_sig = future.result()
                        if tx_info and last_tx_sig and last_tx_sig == tx_sig:
                            last_tx = tx_info

                        num_txs_processed += 1
                    except Exception as exc:
                        logger.error(
                            f"index_user_bank_backfill.py | error {exc}", exc_info=True
                        )
                        raise

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_user_bank_backfill.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )


def check_if_backfilling_complete(
    session: Session, solana_client_manager: SolanaClientManager, redis: Redis
) -> bool:
    try:
        redis_complete = redis.get(index_user_bank_backfill_complete)
        if redis_complete:
            redis_complete = str(redis_complete.decode())
        if redis_complete == "true":
            return True

        stop_sig_tuple = (
            session.query(IndexingCheckpoint.signature)
            .filter(IndexingCheckpoint.tablename == index_user_bank_backfill_tablename)
            .first()
        )
        if not stop_sig_tuple:
            logger.error(
                "index_user_bank_backfill.py | Tried to check if complete, but no stop_sig"
            )
            return False
        else:
            stop_sig = stop_sig_tuple[0]

        one_sig_before_stop_result = solana_client_manager.get_signatures_for_address(
            USER_BANK_ADDRESS,
            before=stop_sig,
            limit=1,
        )
        if one_sig_before_stop_result:
            one_sig_before_stop_result = one_sig_before_stop_result["result"][0]
            one_sig_before_stop = one_sig_before_stop_result["signature"]
        else:
            logger.error("index_user_bank_backfill.py | No sigs before stop_sig")
            return False

        sig_before_stop_in_db = (
            session.query(UserBankBackfillTx)
            .filter(UserBankBackfillTx.signature == one_sig_before_stop)
            .first()
        )
        complete = bool(sig_before_stop_in_db)
        redis.set(index_user_bank_backfill_complete, "true" if complete else "false")
        return complete
    except Exception as e:
        logger.error(
            "index_user_bank_backfill.py | Error during check_if_backfilling_complete",
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
                AudioTransactionsHistory.transaction_type == TransactionType.tip,
                and_(
                    AudioTransactionsHistory.transaction_type
                    == TransactionType.transfer,
                    AudioTransactionsHistory.method == TransactionMethod.send,
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
            USER_BANK_ADDRESS,
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
            tablename=index_user_bank_backfill_tablename,
            last_checkpoint=stop_sig_slot,
            signature=stop_sig,
        )
    )
    logger.info(
        f"index_user_bank_backfill.py | Added new stop_sig to indexing_checkpoints: {stop_sig}"
    )
    return stop_sig


# ####### CELERY TASKS ####### #
@celery.task(name="index_user_bank_backfill", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_user_bank_backfill(self):

    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_user_bank_backfill.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("user_bank_backfill_lock", timeout=10 * 60)

    db = index_user_bank_backfill.db
    solana_client_manager = index_user_bank_backfill.solana_client_manager

    with db.scoped_session() as session:

        stop_sig = (
            session.query(IndexingCheckpoint.signature)
            .filter(IndexingCheckpoint.tablename == index_user_bank_backfill_tablename)
            .first()
        )
        if not stop_sig:
            stop_sig = find_true_stop_sig(session, solana_client_manager, stop_sig)
            if not stop_sig:
                logger.error(
                    "index_user_bank_backfill.py | Failed to find true stop signature"
                )
                return
            logger.info(
                f"index_user_bank_backfill.py | Found true stop_sig: {stop_sig}"
            )
        else:
            stop_sig = stop_sig[0]

    if not stop_sig:
        logger.info(f"index_user_bank_backfill.py | No stop_sig found: {stop_sig}")
        return

    if check_if_backfilling_complete(session, solana_client_manager, redis):
        logger.info("index_user_bank_backfill.py | Backfill indexing complete!")
        return

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            process_user_bank_txs(stop_sig)
        else:
            logger.info("index_user_bank_backfill.py | Failed to acquire lock")

    except Exception as e:
        logger.error(
            "index_user_bank_backfill.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
