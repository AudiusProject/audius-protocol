import concurrent.futures
import datetime
import logging
import re
import time
from typing import Tuple, Optional, TypedDict, List
import base58
from redis import Redis
from sqlalchemy.orm.session import Session
from sqlalchemy import desc, and_
from solana.publickey import PublicKey
from src.tasks.celery_app import celery
from src.utils.cache_solana_program import cache_latest_sol_db_tx, fetch_and_cache_latest_program_tx_redis
from src.utils.config import shared_config
from src.models import User, UserBankTransaction, UserBankAccount
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import get_address_pair, SPL_TOKEN_ID_PK
from src.solana.solana_transaction_types import (
    TransactionInfoResult,
    TransactionMessage,
    TransactionMessageInstruction,
    ResultMeta
)
from src.solana.solana_parser import (
    parse_instruction_data,
    InstructionFormat,
    SolanaInstructionType,
)
from src.utils.redis_constants import latest_sol_user_bank_db_tx_key, latest_sol_user_bank_program_tx_key

logger = logging.getLogger(__name__)

# Populate values used in UserBank indexing from config
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
WAUDIO_PROGRAM_ADDRESS = shared_config["solana"]["waudio_program_address"]
USER_BANK_KEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
WAUDIO_PROGRAM_PUBKEY = (
    PublicKey(WAUDIO_PROGRAM_ADDRESS) if WAUDIO_PROGRAM_ADDRESS else None
)

# Used to limit tx history if needed
MIN_SLOT = int(shared_config["solana"]["user_bank_min_slot"])

# Maximum number of batches to process at once
TX_SIGNATURES_MAX_BATCHES = 3

# Last N entries present in tx_signatures array during processing
TX_SIGNATURES_RESIZE_LENGTH = 3

# Recover ethereum public key from bytes array
# Message formatted as follows:
# EthereumAddress = [214, 237, 135, 129, 143, 240, 221, 138, 97, 84, 199, 236, 234, 175, 81, 23, 114, 209, 118, 39]
def parse_eth_address_from_msg(msg: str):
    logger.info(f"index_user_bank.py {msg}")
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
        session.query(UserBankTransaction.slot).order_by(desc(UserBankTransaction.slot))
    ).first()
    if tx_query:
        slot = tx_query[0]
    return slot

# Cache the latest value committed to DB in redis
# Used for quick retrieval in health check
def cache_latest_sol_user_bank_db_tx(redis: Redis, tx):
    cache_latest_sol_db_tx(redis, latest_sol_user_bank_db_tx_key, tx)


# Query a tx signature and confirm its existence
def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    exists = False
    tx_sig_db_count = (
        session.query(UserBankTransaction).filter(
            UserBankTransaction.signature == tx_sig
        )
    ).count()
    exists = tx_sig_db_count > 0
    # logger.info(f"index_user_bank.py | {tx_sig} exists={exists}")
    return exists


def refresh_user_balance(session: Session, redis: Redis, user_bank_acct: str):
    user_id: Optional[Tuple[int, None]] = (
        session.query(User.user_id)
        .join(
            UserBankAccount,
            and_(
                UserBankAccount.bank_account == user_bank_acct,
                UserBankAccount.ethereum_address == User.wallet,
            ),
        )
        .filter(User.is_current == True)
        .one_or_none()
    )
    # Only refresh if this is a known account within audius
    if user_id:
        logger.info(
            f"index_user_bank.py | Refresh user_id = {user_id}, {user_bank_acct}"
        )
        enqueue_immediate_balance_refresh(redis, [user_id[0]])

create_token_account_instr: List[InstructionFormat] = [
    {"name": "eth_address", "type": SolanaInstructionType.EthereumAddress},
]

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
            f"index_user_bank.py | Error processing instruction valid, {e}",
            exc_info=True,
        )
        return None

def process_user_bank_tx_details(
    session: Session,
    redis: Redis,
    tx_info,
    tx_sig,
    timestamp
):
    result: TransactionInfoResult = tx_info["result"]
    meta = result["meta"]
    error = meta["err"]
    if error:
        logger.info(
            f"index_user_bank.py | Skipping error transaction from chain {tx_info}"
        )
        return
    account_keys = tx_info["result"]["transaction"]["message"]["accountKeys"]
    tx_message = result["transaction"]["message"]

    # Check for valid instruction
    has_create_token_instruction = any(
        log == "Program log: Instruction: CreateTokenAccount"
        for log in meta["logMessages"]
    )
    has_claim_instruction = any(
        log == "Program log: Instruction: Claim"
        for log in meta["logMessages"]
    )

    if not has_create_token_instruction and not has_claim_instruction:
        return

    instruction = get_valid_instruction(tx_message, meta)
    if instruction is None:
        logger.error(f"index_user_bank.py | {tx_sig} No Valid instruction found")
        return

    if has_create_token_instruction:
        tx_data = instruction["data"]
        parsed_token_data = parse_create_token_data(tx_data)
        eth_addr = parsed_token_data["eth_address"]
        decoded = base58.b58decode(tx_data)[1:]
        public_key_bytes = decoded[:20]
        _, derived_address = get_address_pair(
            WAUDIO_PROGRAM_PUBKEY,
            public_key_bytes,
            USER_BANK_KEY,
            SPL_TOKEN_ID_PK
        )
        bank_acct = str(derived_address[0])
        try:
            # Confirm expected address is present in transaction
            bank_acct_index = account_keys.index(bank_acct)
            if bank_acct_index:
                logger.info(
                    f"index_user_bank.py | {tx_sig} Found known account: {eth_addr}, {bank_acct}"
                )
                session.add(
                    UserBankAccount(
                        signature=tx_sig,
                        ethereum_address=eth_addr,
                        bank_account=bank_acct,
                        created_at=timestamp,
                    )
                )
        except ValueError as e:
            logger.error(e)

    elif has_claim_instruction:
        # Accounts to refresh balance
        acct_1 = account_keys[1]
        acct_2 = account_keys[2]
        logger.info(
            f"index_user_bank.py | Balance refresh accounts: {acct_1}, {acct_2}"
        )
        refresh_user_balance(session, redis, acct_1)
        refresh_user_balance(session, redis, acct_2)

def parse_user_bank_transaction(
    session: Session, solana_client_manager: SolanaClientManager, tx_sig, redis
):
    tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
    tx_slot = tx_info["result"]["slot"]
    timestamp = tx_info["result"]["blockTime"]
    parsed_timestamp = datetime.datetime.utcfromtimestamp(timestamp)

    logger.info(
        f"index_user_bank.py | parse_user_bank_transaction |\
    {tx_slot}, {tx_sig} | {tx_info} | {parsed_timestamp}"
    )

    process_user_bank_tx_details(session, redis, tx_info, tx_sig, parsed_timestamp)
    session.add(
        UserBankTransaction(signature=tx_sig, slot=tx_slot, created_at=parsed_timestamp)
    )
    return (tx_info["result"], tx_sig)


def process_user_bank_txs():
    solana_client_manager = index_user_bank.solana_client_manager
    db = index_user_bank.db
    redis = index_user_bank.redis
    logger.info("index_user_bank.py | Acquired lock")

    # Exit if required configs are not found
    if not WAUDIO_PROGRAM_PUBKEY or not USER_BANK_KEY:
        logger.error(
            f"index_user_bank.py | Missing required configuration"
            f"WAUDIO_PROGRAM_PUBKEY: {WAUDIO_PROGRAM_PUBKEY} USER_BANK_KEY: {USER_BANK_KEY}- exiting."
        )
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = None

    # Loop exit condition
    intersection_found = False

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_highest_user_bank_tx_slot(session)
        logger.info(f"index_user_bank.py | high tx = {latest_processed_slot}")
        while not intersection_found:
            transactions_history = (
                solana_client_manager.get_confirmed_signature_for_address2(
                    USER_BANK_ADDRESS, before=last_tx_signature, limit=100
                )
            )
            transactions_array = transactions_history["result"]
            if not transactions_array:
                intersection_found = True
                logger.info(
                    f"index_user_bank.py | No transactions found before {last_tx_signature}"
                )
            else:
                # Current batch of transactions
                transaction_signature_batch = []
                for tx_info in transactions_array:
                    tx_sig = tx_info["signature"]
                    tx_slot = tx_info["slot"]
                    logger.info(
                        f"index_user_bank.py | Processing tx={tx_sig} | slot={tx_slot}"
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
                            f"index_user_bank.py | Latest slot re-traversal\
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
                        f"index_user_bank.py | sliced tx_sigs from {prev_len} to {len(transaction_signatures)} entries"
                    )

    # Reverse batches aggregated so oldest transactions are processed first
    transaction_signatures.reverse()


    last_tx_sig: Optional[str] = None
    last_tx = None
    if transaction_signatures and transaction_signatures[-1]:
        last_tx_sig = transaction_signatures[-1][0]

    num_txs_processed = 0
    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_user_bank.py | processing {tx_sig_batch}")
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
                        redis,
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
                        logger.error(f"index_user_bank.py | error {exc}", exc_info=True)
                        raise

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_user_bank.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )

    if last_tx and last_tx_sig:
        cache_latest_sol_user_bank_db_tx(redis, {
            "signature": last_tx_sig,
            "slot": last_tx["slot"],
            "timestamp": last_tx["blockTime"]
        })


######## CELERY TASKS ########
@celery.task(name="index_user_bank", bind=True)
def index_user_bank(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_user_bank.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("user_bank_lock", timeout=10 * 60)

    try:
        # Cache latest tx outside of lock
        fetch_and_cache_latest_program_tx_redis(
            index_user_bank.solana_client_manager,
            redis,
            USER_BANK_ADDRESS,
            latest_sol_user_bank_program_tx_key
        )
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            process_user_bank_txs()
        else:
            logger.info("index_user_bank.py | Failed to acquire lock")
    except Exception as e:
        logger.error("index_user_bank.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
