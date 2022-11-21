import concurrent.futures
import datetime
import logging
import time
from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional, TypedDict

import base58
from redis import Redis
from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm.session import Session
from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.models.rewards.challenge import Challenge, ChallengeType
from src.models.rewards.rewards_manager_backfill import (
    RewardsManagerBackfillTransaction,
)
from src.models.rewards.user_challenge import UserChallenge
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
from src.solana.solana_parser import (
    InstructionFormat,
    SolanaInstructionType,
    parse_instruction_data,
)
from src.solana.solana_transaction_types import (
    ResultMeta,
    TransactionInfoResult,
    TransactionMessage,
    TransactionMessageInstruction,
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import get_solana_tx_token_balances
from src.utils.prometheus_metric import save_duration_metric
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]
MIN_SLOT = int(shared_config["solana"]["rewards_manager_min_slot"])
MIN_SIG = str(shared_config["solana"]["rewards_manager_backfill_min_sig"])

# Used to find the correct accounts for sender/receiver in the transaction
TRANSFER_RECEIVER_ACCOUNT_INDEX = 4


def check_valid_rewards_manager_program():
    try:
        base58.b58decode(REWARDS_MANAGER_PROGRAM)
        return True
    except ValueError:
        logger.error(
            f"index_rewards_manager_backfill.py"
            f"Invalid Rewards Manager program ({REWARDS_MANAGER_PROGRAM}) configured, exiting."
        )
        return False


is_valid_rewards_manager_program = check_valid_rewards_manager_program()


rewards_manager_transfer_instr: List[InstructionFormat] = [
    {"name": "amount", "type": SolanaInstructionType.u64},
    {"name": "id", "type": SolanaInstructionType.string},
    {"name": "eth_recipient", "type": SolanaInstructionType.EthereumAddress},
]


class RewardsManagerTransfer(TypedDict):
    amount: int
    id: str
    eth_recipient: str


class RewardTransferInstruction(TypedDict):
    amount: int
    challenge_id: str
    specifier: str
    eth_recipient: str
    prebalance: int
    postbalance: int


class RewardManagerTransactionInfo(TypedDict):
    tx_sig: str
    slot: int
    timestamp: int
    transfer_instruction: Optional[RewardTransferInstruction]


challenge_type_map_global: Dict[str, TransactionType] = {}
index_rewards_manager_backfill_tablename = "index_rewards_manager_backfill"
index_rewards_manager_backfill_complete = "index_rewards_manager_backfill_complete"


def get_challenge_type_map(
    session: Session,
):
    # pylint: disable=W0603
    global challenge_type_map_global
    if not bool(challenge_type_map_global):
        challenges = (
            session.query(Challenge.id, Challenge.type)
            .filter(bool(Challenge.active))
            .all()
        )
        challenge_type_map_global = {
            challenge[0]: TransactionType.trending_reward
            if challenge[1] == ChallengeType.trending
            else TransactionType.user_reward
            for challenge in challenges
        }

    return challenge_type_map_global


def parse_transfer_instruction_data(data: str) -> RewardsManagerTransfer:
    """Parse Transfer instruction data submitted to Audius Rewards Manager program

    Instruction struct:
    pub struct TransferArgs {
        /// Amount to transfer
        pub amount: u64,
        /// ID generated on backend
        pub id: String,
        /// Recipient's Eth address
        pub eth_recipient: EthereumAddress,
    }

    Decodes the data and parses each param into the correct type
    """

    return parse_instruction_data(data, rewards_manager_transfer_instr)


def parse_transfer_instruction_id(transfer_id: str) -> Optional[List[str]]:
    """Parses the transfer instruction id into [challenge_id, specifier]
    The id in the transfer instruction is formatted as "<CHALLENGE_ID>:<SPECIFIER>"
    """
    id_parts = transfer_id.split(":", 1)
    if len(id_parts) != 2:
        logger.error(
            "index_rewards_manager_backfill.py | Unable to parse transfer instruction id"
            f"into challenge_id and specifier {transfer_id}"
        )
        return None
    return id_parts


def get_valid_instruction(
    tx_message: TransactionMessage, meta: ResultMeta
) -> Optional[TransactionMessageInstruction]:
    """Checks that the tx is valid
    checks for the transaction message for correct instruction log
    checks accounts keys for rewards manager account
    checks for rewards manager program in instruction
    """
    try:
        account_keys = tx_message["accountKeys"]
        has_transfer_instruction = any(
            log == "Program log: Instruction: Transfer" for log in meta["logMessages"]
        )

        if not has_transfer_instruction:
            return None

        if not any(REWARDS_MANAGER_ACCOUNT == key for key in account_keys):
            logger.error(
                "index_rewards_manager_backfill.py | Rewards manager account missing from account keys"
            )
            return None

        instructions = tx_message["instructions"]
        rewards_manager_program_index = account_keys.index(REWARDS_MANAGER_PROGRAM)
        for instruction in instructions:
            if instruction["programIdIndex"] == rewards_manager_program_index:
                return instruction

        return None
    except Exception as e:
        logger.error(
            f"index_rewards_manager_backfill.py | Error processing instruction valid, {e}",
            exc_info=True,
        )
        return None


def fetch_and_parse_sol_rewards_transfer_instruction(
    solana_client_manager: SolanaClientManager, tx_sig: str
) -> RewardManagerTransactionInfo:
    """Fetches metadata for rewards transfer transactions and parses data

    Fetches the transaction metadata from solana using the tx signature
    Checks the metadata for a transfer instruction
    Decodes and parses the transfer instruction metadata
    Validates the metadata fields
    """
    try:
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig, retries=10)
        result: TransactionInfoResult = tx_info["result"]
        # Create transaction metadata
        tx_metadata: RewardManagerTransactionInfo = {
            "tx_sig": tx_sig,
            "slot": result["slot"],
            "timestamp": result["blockTime"],
            "transfer_instruction": None,
        }
        meta = result["meta"]
        if meta["err"]:
            logger.info(
                f"index_rewards_manager_backfill.py | Skipping error transaction from chain {tx_info}"
            )
            return tx_metadata
        tx_message = result["transaction"]["message"]
        instruction = get_valid_instruction(tx_message, meta)
        if instruction is None:
            return tx_metadata
        transfer_instruction_data = parse_transfer_instruction_data(instruction["data"])
        amount = transfer_instruction_data["amount"]
        eth_recipient = transfer_instruction_data["eth_recipient"]
        id = transfer_instruction_data["id"]
        transfer_instruction = parse_transfer_instruction_id(id)
        if transfer_instruction is None:
            return tx_metadata

        challenge_id, specifier = transfer_instruction
        receiver_index = instruction["accounts"][TRANSFER_RECEIVER_ACCOUNT_INDEX]
        pre_balance, post_balance = get_solana_tx_token_balances(meta, receiver_index)
        if pre_balance == -1 or post_balance == -1:
            raise Exception("Reward recipient balance missing!")
        tx_metadata["transfer_instruction"] = {
            "amount": amount,
            "eth_recipient": eth_recipient,
            "challenge_id": challenge_id,
            "specifier": specifier,
            "prebalance": pre_balance,
            "postbalance": post_balance,
        }
        return tx_metadata
    except Exception as e:
        logger.error(
            f"index_rewards_manager_backfill.py | Error processing {tx_sig}, {e}",
            exc_info=True,
        )
        raise e


def process_batch_sol_reward_manager_txs(
    session: Session,
    reward_manager_txs: List[RewardManagerTransactionInfo],
):
    """Validates that the transfer instruction is consistent with DB and inserts ChallengeDisbursement DB entries"""
    try:
        eth_recipients = [
            tx["transfer_instruction"]["eth_recipient"]
            for tx in reward_manager_txs
            if tx["transfer_instruction"] is not None
        ]
        users = (
            session.query(User.wallet, User.user_id, UserBankAccount.bank_account)
            .join(UserBankAccount, UserBankAccount.ethereum_address == User.wallet)
            .filter(User.wallet.in_(eth_recipients), User.is_current == True)
            .all()
        )

        users_map = {
            user[0]: {"user_id": user[1], "user_bank": user[2]} for user in users
        }

        specifiers = [
            tx["transfer_instruction"]["specifier"]
            for tx in reward_manager_txs
            if tx["transfer_instruction"] is not None
        ]
        user_challenges = (
            session.query(UserChallenge.specifier)
            .filter(
                UserChallenge.specifier.in_(specifiers),
            )
            .all()
        )
        user_challenge_specifiers = {challenge[0] for challenge in user_challenges}
        challenge_type_map = get_challenge_type_map(session)

        audio_tx_histories = []
        for tx in reward_manager_txs:
            timestamp = datetime.datetime.utcfromtimestamp(tx["timestamp"])
            # Add transaction
            session.add(
                RewardsManagerBackfillTransaction(
                    signature=tx["tx_sig"], slot=tx["slot"], created_at=timestamp
                )
            )
            session.flush()
            # No instruction found
            if tx["transfer_instruction"] is None:
                logger.warning(
                    f"index_rewards_manager_backfill.py | No transfer instruction found in {tx}"
                )
                continue
            transfer_instr: RewardTransferInstruction = tx["transfer_instruction"]
            specifier = transfer_instr["specifier"]
            eth_recipient = transfer_instr["eth_recipient"]
            if specifier not in user_challenge_specifiers:
                logger.error(
                    f"index_rewards_manager_backfill.py | Challenge specifier {specifier} not found"
                    "while processing disbursement"
                )
            if eth_recipient not in users_map:
                logger.error(
                    f"index_rewards_manager_backfill.py | eth_recipient {eth_recipient} not found while processing disbursement"
                )
                tx_signature = tx["tx_sig"]
                tx_slot = tx["slot"]
                logger.error(
                    f"index_rewards_manager_backfill.py | eth_recipient {eth_recipient} not found processing disbursement"
                    f"tx signature={tx_signature}"
                    f"tx slot={tx_slot}"
                    f"specifier = {specifier}"
                )
                # Set this user's id and user bank to 0 instead of blocking indexing
                # This state can be rectified asynchronously
                users_map[eth_recipient] = {"user_id": 0, "user_bank": 0}

            user_id = users_map[eth_recipient]["user_id"]
            challenge_id = transfer_instr["challenge_id"]
            logger.info(
                f"index_rewards_manager_backfill.py | found successful disbursement for user_id: [{user_id}]"
            )

            prebalance = transfer_instr["prebalance"]
            postbalance = transfer_instr["postbalance"]
            balance_change = postbalance - prebalance
            audio_tx_histories.append(
                AudioTransactionsHistory(
                    user_bank=users_map[eth_recipient]["user_bank"],
                    slot=tx["slot"],
                    signature=tx["tx_sig"],
                    transaction_type=challenge_type_map[challenge_id],
                    method=TransactionMethod.receive,
                    transaction_created_at=timestamp,
                    change=Decimal(balance_change),
                    balance=Decimal(postbalance),
                    tx_metadata=challenge_id,
                )
            )

        if audio_tx_histories:
            # Save out the transaction history list
            session.bulk_save_objects(audio_tx_histories)

    except Exception as e:
        logger.error(
            f"index_rewards_manager_backfill.py | Error processing {e}", exc_info=True
        )
        raise e


def get_latest_reward_disbursment_slot(session: Session):
    """Fetches the most recent slot for Challenge Disburements"""
    latest_slot = None
    highest_slot_query = (
        session.query(RewardsManagerBackfillTransaction.slot).order_by(
            desc(RewardsManagerBackfillTransaction.slot)
        )
    ).first()
    # Can be None prior to first write operations
    if highest_slot_query is not None:
        latest_slot = highest_slot_query[0]

    # If no slots have yet been recorded, assume all are valid
    if latest_slot is None:
        latest_slot = 0

    return latest_slot


def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    """Checks if the transaction signature already exists for Challenge Disburements"""
    tx_sig_db_count = (
        session.query(RewardsManagerBackfillTransaction).filter(
            RewardsManagerBackfillTransaction.signature == tx_sig
        )
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


def get_transaction_signatures(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    program: str,
    get_latest_slot: Callable[[Session], int],
    check_tx_exists: Callable[[Session, str], bool],
    stop_sig: str,
    min_slot=None,
) -> List[List[str]]:
    """Fetches next batch of transaction signature offset from the previous latest processed slot

    Fetches the latest processed slot for the rewards manager program
    Iterates backwards from the current tx until an intersection is found with the latest processed slot
    Returns the next set of transaction signature from the current offset slot to process
    """
    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = stop_sig

    # Loop exit condition
    intersection_found = False

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_latest_slot(session)
        while not intersection_found:
            transactions_history = solana_client_manager.get_signatures_for_address(
                program,
                before=last_tx_signature,
                limit=FETCH_TX_SIGNATURES_BATCH_SIZE,
                retries=20,
            )

            transactions_array = transactions_history["result"]
            if not transactions_array:
                intersection_found = True
                logger.info(
                    f"index_rewards_manager_backfill.py | No transactions found before {last_tx_signature}, got {transactions_array}"
                )
                if last_tx_signature != MIN_SIG:
                    raise Exception(
                        f"No transactions found before {last_tx_signature} due to Solana flakiness"
                    )
            else:
                logger.info(
                    f"index_rewards_manager_backfill.py | adding to batch: slot {transactions_array[0]['slot']}"
                )
                # Current batch of transactions
                transaction_signature_batch = []
                for tx_info in transactions_array:
                    tx_sig = tx_info["signature"]
                    tx_slot = tx_info["slot"]
                    logger.debug(
                        f"index_rewards_manager_backfill.py | Processing tx={tx_sig} | slot={tx_slot}"
                    )
                    if tx_info["slot"] > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif tx_info["slot"] <= latest_processed_slot and (
                        min_slot is None or tx_info["slot"] > min_slot
                    ):
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_rewards_manager_backfill.py | Latest slot re-traversal\
                            slot={tx_slot}, sig={tx_sig},\
                            latest_processed_slot(db)={latest_processed_slot}"
                        )
                        exists = check_tx_exists(session, tx_sig)
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
                    # Only take the oldest transaction from the transaction_signatures array
                    # transaction_signatures is sorted from newest to oldest
                    transaction_signatures = transaction_signatures[
                        -TX_SIGNATURES_RESIZE_LENGTH:
                    ]

    # Reverse batches aggregated so oldest transactions are processed first
    transaction_signatures.reverse()
    return transaction_signatures


def check_progress(session: Session):
    stop_row = (
        session.query(IndexingCheckpoint)
        .filter(
            IndexingCheckpoint.tablename == index_rewards_manager_backfill_tablename
        )
        .first()
    )
    if not stop_row:
        return None
    ret: Any = {}
    ret["stop_slot"] = stop_row.last_checkpoint
    ret["stop_sig"] = stop_row.signature
    latest_processed_row = (
        session.query(RewardsManagerBackfillTransaction)
        .order_by(desc(RewardsManagerBackfillTransaction.slot))
        .first()
    )
    if not latest_processed_row:
        return ret
    ret["latest_processed_sig"] = latest_processed_row.signature
    ret["latest_processed_slot"] = latest_processed_row.slot
    min_row = (
        session.query(AudioTransactionsHistory)
        .filter(
            and_(
                or_(
                    AudioTransactionsHistory.transaction_type
                    == TransactionType.user_reward,
                    AudioTransactionsHistory.transaction_type
                    == TransactionType.trending_reward,
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


def process_transaction_signatures(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    transaction_signatures: List[List[str]],
):
    """Concurrently processes the transactions to update the DB state for reward transfer instructions"""
    last_tx_sig: Optional[str] = None
    last_tx: Optional[RewardManagerTransactionInfo] = None
    if transaction_signatures and transaction_signatures[-1]:
        last_tx_sig = transaction_signatures[-1][0]

    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_rewards_manager_backfill.py | processing {tx_sig_batch}")
        batch_start_time = time.time()

        transfer_instructions: List[RewardManagerTransactionInfo] = []
        # Process each batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            parse_sol_tx_futures = {
                executor.submit(
                    fetch_and_parse_sol_rewards_transfer_instruction,
                    solana_client_manager,
                    tx_sig,
                ): tx_sig
                for tx_sig in tx_sig_batch
            }
            for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                try:
                    # No return value expected here so we just ensure all futures are resolved
                    parsed_solana_transfer_instruction = future.result()
                    if parsed_solana_transfer_instruction is not None:
                        transfer_instructions.append(parsed_solana_transfer_instruction)
                        if (
                            last_tx_sig
                            and last_tx_sig
                            == parsed_solana_transfer_instruction["tx_sig"]
                        ):
                            last_tx = parsed_solana_transfer_instruction
                except Exception as exc:
                    logger.error(f"index_rewards_manager_backfill.py | {exc}")
                    raise exc
        with db.scoped_session() as session:
            process_batch_sol_reward_manager_txs(session, transfer_instructions)
        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_rewards_manager_backfill.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )

    return last_tx


def process_solana_rewards_manager(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    stop_sig: str,
):
    """Fetches the next set of reward manager transactions and updates the DB with Challenge Disbursements"""
    if not is_valid_rewards_manager_program:
        logger.error(
            "index_rewards_manager_backfill.py | no valid reward manager program passed"
        )
        return
    if not REWARDS_MANAGER_ACCOUNT:
        logger.error(
            "index_rewards_manager_backfill.py | reward manager account missing"
        )
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = get_transaction_signatures(
        solana_client_manager,
        db,
        REWARDS_MANAGER_PROGRAM,
        get_latest_reward_disbursment_slot,
        get_tx_in_db,
        stop_sig,
        MIN_SLOT,
    )
    logger.info(f"index_rewards_manager_backfill.py | {transaction_signatures}")

    process_transaction_signatures(solana_client_manager, db, transaction_signatures)


def check_if_backfilling_complete(
    session: Session, solana_client_manager: SolanaClientManager, redis: Redis
) -> bool:
    try:
        redis_complete = bool(redis.get(index_rewards_manager_backfill_complete))
        if redis_complete:
            return True

        stop_sig_tuple = (
            session.query(IndexingCheckpoint.signature)
            .filter(
                IndexingCheckpoint.tablename == index_rewards_manager_backfill_tablename
            )
            .first()
        )
        if not stop_sig_tuple:
            logger.error(
                "index_rewards_manager_backfill.py | Tried to check if complete, but no stop_sig"
            )
            return False
        stop_sig = stop_sig_tuple[0]

        one_sig_before_stop_result = solana_client_manager.get_signatures_for_address(
            REWARDS_MANAGER_PROGRAM, before=stop_sig, limit=1, retries=20
        )
        if not one_sig_before_stop_result:
            logger.error("index_rewards_manager_backfill.py | No sigs before stop_sig")
            return False
        one_sig_before_stop_result = one_sig_before_stop_result["result"][0]
        one_sig_before_stop = one_sig_before_stop_result["signature"]

        sig_before_stop_in_db = (
            session.query(RewardsManagerBackfillTransaction)
            .filter(RewardsManagerBackfillTransaction.signature == one_sig_before_stop)
            .first()
        )
        complete = bool(sig_before_stop_in_db)
        if complete:
            redis.set(index_rewards_manager_backfill_complete, int(complete))
        return complete
    except Exception as e:
        logger.error(
            "index_rewards_manager_backfill.py | Error during check_if_backfilling_complete",
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
                AudioTransactionsHistory.transaction_type
                == TransactionType.user_reward,
                AudioTransactionsHistory.transaction_type
                == TransactionType.trending_reward,
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
            REWARDS_MANAGER_PROGRAM, before=stop_sig, limit=1, retries=10
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
            tablename=index_rewards_manager_backfill_tablename,
            last_checkpoint=stop_sig_slot,
            signature=stop_sig,
        )
    )
    logger.info(
        f"index_rewards_manager_backfill.py | Added new stop_sig to indexing_checkpoints: {stop_sig}"
    )
    return stop_sig


# ####### CELERY TASKS ####### #
@celery.task(name="index_rewards_manager_backfill", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_rewards_manager_backfill(self):
    redis = index_rewards_manager_backfill.redis
    solana_client_manager = index_rewards_manager_backfill.solana_client_manager
    db = index_rewards_manager_backfill.db

    # Define lock acquired boolean
    have_lock = False
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock("solana_rewards_manager_backfill_lock")

    try:
        with db.scoped_session() as session:
            stop_sig = (
                session.query(IndexingCheckpoint.signature)
                .filter(
                    IndexingCheckpoint.tablename
                    == index_rewards_manager_backfill_tablename
                )
                .first()
            )
            if not stop_sig:
                stop_sig = find_true_stop_sig(session, solana_client_manager, stop_sig)
                if not stop_sig:
                    logger.info(
                        "index_rewards_manager_backfill.py | Failed to find true stop signature"
                    )
                    return
                logger.info(
                    f"index_rewards_manager_backfill.py | Found true stop_sig: {stop_sig}"
                )
            else:
                stop_sig = stop_sig[0]

            if not stop_sig:
                logger.info(
                    f"index_rewards_manager_backfill.py | No stop_sig found: {stop_sig}"
                )
                return

            if check_if_backfilling_complete(session, solana_client_manager, redis):
                logger.info(
                    "index_rewards_manager_backfill.py | Backfill indexing complete!"
                )
                return

        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_rewards_manager_backfill.py | Acquired lock")
            process_solana_rewards_manager(solana_client_manager, db, stop_sig)
        else:
            logger.info("index_rewards_manager_backfill.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "index_rewards_manager_backfill.py | Fatal error in main loop",
            exc_info=True,
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
