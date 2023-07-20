import concurrent.futures
import datetime
import logging
import re
import time
from decimal import Decimal
from typing import List, Optional, Tuple, TypedDict

import base58
from redis import Redis
from solana.publickey import PublicKey
from sqlalchemy import and_, desc
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount, UserBankAccount, UserBankTx
from src.models.users.user_tip import UserTip
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import SPL_TOKEN_ID_PK, get_address_pair
from src.solana.solana_parser import (
    InstructionFormat,
    SolanaInstructionType,
    parse_instruction_data,
)
from src.solana.solana_transaction_types import (
    ConfirmedTransaction,
    ResultMeta,
    TransactionInfoResult,
    TransactionMessageInstruction,
)
from src.tasks.celery_app import celery
from src.utils.cache_solana_program import (
    cache_latest_sol_db_tx,
    fetch_and_cache_latest_program_tx_redis,
)
from src.utils.config import shared_config
from src.utils.helpers import (
    get_account_index,
    get_solana_tx_token_balances,
    get_valid_instruction,
    has_log,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import (
    latest_sol_user_bank_db_tx_key,
    latest_sol_user_bank_program_tx_key,
    latest_sol_user_bank_slot_key,
)

logger = logging.getLogger(__name__)

# Populate values used in UserBank indexing from config
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
WAUDIO_MINT = shared_config["solana"]["waudio_mint"]
USDC_MINT = shared_config["solana"]["usdc_mint"]
USER_BANK_KEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
WAUDIO_MINT_PUBKEY = PublicKey(WAUDIO_MINT) if WAUDIO_MINT else None
USDC_MINT_PUBKEY = PublicKey(USDC_MINT) if USDC_MINT else None

# Used to limit tx history if needed
MIN_SLOT = int(shared_config["solana"]["user_bank_min_slot"])
INITIAL_FETCH_SIZE = 10

# Used to find the correct accounts for sender/receiver in the transaction
TRANSFER_SENDER_ACCOUNT_INDEX = 1
TRANSFER_RECEIVER_ACCOUNT_INDEX = 2

# Used to find the mint for a CreateTokenAccount instruction
CREATE_MINT_ACCOUNT_INDEX = 1


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
    tx_query = (session.query(UserBankTx.slot).order_by(desc(UserBankTx.slot))).first()
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
        session.query(UserBankTx).filter(UserBankTx.signature == tx_sig)
    ).count()
    exists = tx_sig_db_count > 0
    return exists


def refresh_user_balances(session: Session, redis: Redis, accts=List[str]):
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
    # Only refresh if this is a known account within audius
    if results:
        user_ids = [user_id[0] for user_id in results]
        logger.info(f"index_user_bank.py | Refresh user_ids = {user_ids}")
        enqueue_immediate_balance_refresh(redis, user_ids)
    return results


create_token_account_instr: List[InstructionFormat] = [
    {"name": "eth_address", "type": SolanaInstructionType.EthereumAddress},
]


def process_create_userbank_instruction(
    session: Session,
    instruction: TransactionMessageInstruction,
    account_keys: List[str],
    tx_sig: str,
    timestamp: datetime.datetime,
):
    tx_data = instruction["data"]
    parsed_token_data = parse_create_token_data(tx_data)
    eth_addr = parsed_token_data["eth_address"]
    decoded = base58.b58decode(tx_data)[1:]
    public_key_bytes = decoded[:20]
    mint_address = account_keys[
        get_account_index(instruction, CREATE_MINT_ACCOUNT_INDEX)
    ]
    _, derived_address = get_address_pair(
        PublicKey(mint_address), public_key_bytes, USER_BANK_KEY, SPL_TOKEN_ID_PK
    )
    bank_acct = str(derived_address[0])
    try:
        # Confirm expected address is present in transaction
        bank_acct_index = account_keys.index(bank_acct)
        if bank_acct_index:
            if mint_address == WAUDIO_MINT:
                logger.info(
                    f"index_user_bank.py | {tx_sig} Found known $AUDIO account: {eth_addr}, {bank_acct}"
                )
                session.add(
                    UserBankAccount(
                        signature=tx_sig,
                        ethereum_address=eth_addr,
                        bank_account=bank_acct,
                        created_at=timestamp,
                    )
                )
            elif mint_address == USDC_MINT:
                logger.info(
                    f"index_user_bank.py | {tx_sig} Found known $USDC account: {eth_addr}, {bank_acct}"
                )
                session.add(
                    USDCUserBankAccount(
                        signature=tx_sig,
                        ethereum_address=eth_addr,
                        bank_account=bank_acct,
                        created_at=timestamp,
                    )
                )
            else:
                logger.error(
                    f"index_user_bank.py | Unknown mint address {mint_address}. Expected AUDIO={WAUDIO_MINT} or USDC={USDC_MINT}"
                )

    except ValueError as e:
        logger.error(e)


def process_transfer_instruction(
    session: Session,
    redis: Redis,
    instruction: TransactionMessageInstruction,
    account_keys: List[str],
    meta: ResultMeta,
    tx_sig: str,
    slot: int,
    challenge_event_bus: ChallengeEventBus,
    timestamp: datetime.datetime,
):
    sender_idx = get_account_index(instruction, TRANSFER_SENDER_ACCOUNT_INDEX)
    receiver_idx = get_account_index(instruction, TRANSFER_RECEIVER_ACCOUNT_INDEX)
    sender_account = account_keys[sender_idx]
    receiver_account = account_keys[receiver_idx]

    # Accounts to refresh balance
    logger.info(
        f"index_user_bank.py | Balance refresh accounts: {sender_account}, {receiver_account}"
    )
    user_id_accounts = refresh_user_balances(
        session, redis, [sender_account, receiver_account]
    )
    if not user_id_accounts:
        logger.error("index_user_bank.py | ERROR: Neither accounts are user banks")
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
            f"index_user_bank.py | ERROR: Unexpected user ids in results: {user_id_accounts}"
        )
        return

    pre_sender_balance, post_sender_balance = get_solana_tx_token_balances(
        meta, sender_idx
    )
    pre_receiver_balance, post_receiver_balance = get_solana_tx_token_balances(
        meta, receiver_idx
    )
    if (
        pre_sender_balance is None
        or pre_receiver_balance is None
        or post_sender_balance is None
        or post_receiver_balance is None
    ):
        logger.error("index_user_bank.py | ERROR: Sender or Receiver balance missing!")
        return
    sent_amount = pre_sender_balance - post_sender_balance
    received_amount = post_receiver_balance - pre_receiver_balance
    if sent_amount != received_amount:
        logger.error(
            f"index_user_bank.py | ERROR: Sent and received amounts don't match. Sent = {sent_amount}, Received = {received_amount}"
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
            f"index_user_bank.py | Creating audio_transfer_sent {audio_transfer_sent}"
        )
        session.add(audio_transfer_sent)

    # If there are two userbanks to update, it was a transfer from user to user
    # Index as a user_tip
    elif len(user_id_accounts) == 2:
        if receiver_user_id is None:
            logger.error(
                f"index_user_bank.py | ERROR: Unexpected user ids in results: {user_id_accounts}"
            )
            return

        user_tip = UserTip(
            signature=tx_sig,
            amount=sent_amount,
            sender_user_id=sender_user_id,
            receiver_user_id=receiver_user_id,
            slot=slot,
            created_at=timestamp,
        )
        logger.debug(f"index_user_bank.py | Creating tip {user_tip}")
        session.add(user_tip)
        challenge_event_bus.dispatch(ChallengeEvent.send_tip, slot, sender_user_id)

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
            f"index_user_bank.py | Creating audio_tx_history send tx for tip {audio_tx_sent}"
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
            f"index_user_bank.py | Creating audio_tx_history received tx for tip {audio_tx_received}"
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


def process_user_bank_tx_details(
    session: Session,
    redis: Redis,
    tx_info: ConfirmedTransaction,
    tx_sig,
    timestamp,
    challenge_event_bus: ChallengeEventBus,
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
    has_create_token_instruction = has_log(
        meta, "Program log: Instruction: CreateTokenAccount"
    )
    has_transfer_instruction = has_log(meta, "Program log: Instruction: Transfer")

    if not has_create_token_instruction and not has_transfer_instruction:
        return

    instruction = get_valid_instruction(tx_message, meta, USER_BANK_ADDRESS)
    if instruction is None:
        logger.error(f"index_user_bank.py | {tx_sig} No Valid instruction found")
        return

    if has_create_token_instruction:
        process_create_userbank_instruction(
            session=session,
            instruction=instruction,
            account_keys=account_keys,
            tx_sig=tx_sig,
            timestamp=timestamp,
        )

    elif has_transfer_instruction:
        process_transfer_instruction(
            session=session,
            redis=redis,
            instruction=instruction,
            account_keys=account_keys,
            meta=meta,
            tx_sig=tx_sig,
            slot=result["slot"],
            challenge_event_bus=challenge_event_bus,
            timestamp=timestamp,
        )


def get_sol_tx_info(
    solana_client_manager: SolanaClientManager,
    tx_sig: str,
):
    tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
    return (tx_info, tx_sig)


def process_user_bank_txs() -> None:
    solana_client_manager: SolanaClientManager = index_user_bank.solana_client_manager
    challenge_bus: ChallengeEventBus = index_user_bank.challenge_event_bus
    db = index_user_bank.db
    redis = index_user_bank.redis
    logger.info("index_user_bank.py | Acquired lock")

    # Exit if required configs are not found
    if not WAUDIO_MINT_PUBKEY or not USER_BANK_KEY:
        logger.error(
            f"index_user_bank.py | Missing required configuration"
            f"WAUDIO_PROGRAM_PUBKEY: {WAUDIO_MINT_PUBKEY} USER_BANK_KEY: {USER_BANK_KEY}- exiting."
        )
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = None

    # Loop exit condition
    intersection_found = False
    is_initial_fetch = True

    # Get the latests slot available globally before fetching txs to keep track of indexing progress
    try:
        latest_global_slot = solana_client_manager.get_slot()
    except:
        logger.error("index_user_bank.py | Failed to get block height")

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_highest_user_bank_tx_slot(session)
        logger.info(f"index_user_bank.py | high tx = {latest_processed_slot}")
        while not intersection_found:
            fetch_size = (
                INITIAL_FETCH_SIZE
                if is_initial_fetch
                else FETCH_TX_SIGNATURES_BATCH_SIZE
            )
            logger.info(f"index_user_bank.py | Requesting {fetch_size} transactions")
            transactions_history = solana_client_manager.get_signatures_for_address(
                USER_BANK_ADDRESS, before=last_tx_signature, limit=fetch_size
            )
            is_initial_fetch = False
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
                    logger.debug(
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

            tx_infos: List[Tuple[ConfirmedTransaction, str]] = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                parse_sol_tx_futures = {
                    executor.submit(
                        get_sol_tx_info,
                        solana_client_manager,
                        tx_sig,
                    ): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                    try:
                        tx_infos.append(future.result())
                    except Exception as exc:
                        logger.error(f"index_user_bank.py | error {exc}", exc_info=True)
                        raise

            # Sort by slot
            # Note: while it's possible (even likely) to have multiple tx in the same slot,
            # these transactions can't be dependent on one another, so we don't care which order
            # we process them.
            tx_infos.sort(key=lambda info: info[0]["result"]["slot"])

            for tx_info, tx_sig in tx_infos:
                if tx_info and last_tx_sig and last_tx_sig == tx_sig:
                    last_tx = tx_info["result"]
                num_txs_processed += 1

                tx_slot = tx_info["result"]["slot"]
                timestamp = tx_info["result"]["blockTime"]
                parsed_timestamp = datetime.datetime.utcfromtimestamp(timestamp)

                logger.debug(
                    f"index_user_bank.py | parse_user_bank_transaction |\
                {tx_slot}, {tx_sig} | {tx_info} | {parsed_timestamp}"
                )

                process_user_bank_tx_details(
                    session, redis, tx_info, tx_sig, parsed_timestamp, challenge_bus
                )
                session.add(
                    UserBankTx(
                        signature=tx_sig, slot=tx_slot, created_at=parsed_timestamp
                    )
                )

            batch_end_time = time.time()
            batch_duration = batch_end_time - batch_start_time
            logger.info(
                f"index_user_bank.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
            )

    if last_tx and last_tx_sig:
        cache_latest_sol_user_bank_db_tx(
            redis,
            {
                "signature": last_tx_sig,
                "slot": last_tx["slot"],
                "timestamp": last_tx["blockTime"],
            },
        )
    if last_tx:
        redis.set(latest_sol_user_bank_slot_key, last_tx["slot"])
    elif latest_global_slot is not None:
        redis.set(latest_sol_user_bank_slot_key, latest_global_slot)


# ####### CELERY TASKS ####### #
@celery.task(name="index_user_bank", bind=True)
@save_duration_metric(metric_group="celery_task")
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
            latest_sol_user_bank_program_tx_key,
        )
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            challenge_bus: ChallengeEventBus = index_user_bank.challenge_event_bus
            with challenge_bus.use_scoped_dispatch_queue():
                process_user_bank_txs()
        else:
            logger.info("index_user_bank.py | Failed to acquire lock")

    except Exception as e:
        logger.error("index_user_bank.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
