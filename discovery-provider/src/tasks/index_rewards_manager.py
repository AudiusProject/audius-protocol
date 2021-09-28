import concurrent.futures
import datetime
import logging
import time
from typing import Callable, List, TypedDict, Optional
from redis import Redis
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
import base58
from src.models import (
    User,
    UserChallenge,
    RewardManagerTransaction,
    ChallengeDisbursement
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.session_manager import SessionManager
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_transaction_types import (
    ResultMeta,
    TransactionMessage,
    TransactionMessageInstruction,
    TransactionInfoResult,
)
from src.solana.solana_parser import (
    parse_instruction_data,
    InstructionFormat,
    SolanaInstructionType,
)
from src.queries.get_balances import enqueue_immediate_balance_refresh

logger = logging.getLogger(__name__)

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]
MIN_SLOT = int(shared_config["solana"]["rewards_manager_min_slot"])

# Maximum number of batches to process at once
TX_SIGNATURES_MAX_BATCHES = 20

# Last N entries present in tx_signatures array during processing
TX_SIGNATURES_RESIZE_LENGTH = 10


def check_valid_rewards_manager_program():
    try:
        base58.b58decode(REWARDS_MANAGER_PROGRAM)
        return True
    except ValueError:
        logger.error(
            f"index_rewards_manager.py"
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
    id_parts = transfer_id.split(":")
    if len(id_parts) != 2:
        logger.error(
            "index_rewards_manager.py | Unable to parse transfer instruction id"
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
                "index_rewards_manager.py | Rewards manager account missing from account keys"
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
            f"index_rewards_manager.py | Error processing instruction valid, {e}",
            exc_info=True,
        )
        return None


class RewardTransferInstruction(TypedDict):
    amount: int
    challenge_id: str
    specifier: str
    eth_recipient: str

class RewardManagerTransactionInfo(TypedDict):
    tx_sig: str
    slot: int
    timestamp: int
    transfer_instruction: Optional[RewardTransferInstruction]

def fetch_and_parse_sol_rewards_transfer_instruction(
    solana_client_manager: SolanaClientManager,
    tx_sig: str
) -> Optional[RewardManagerTransactionInfo]:
    """Fetches metadata for rewards transfer transactions and parses data

    Fetches the transaction metadata from solana using the tx signature
    Checks the metadata for a transfer instruction
    Decodes and parses the transfer instruction metadata
    Validates the metadata fields
    """
    try:
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
        result: TransactionInfoResult = tx_info["result"]
        # Create transaction metadata
        tx_metadata = {
            "tx_sig": tx_sig,
            "slot": result["slot"],
            "timestamp": result["blockTime"]
        }
        meta = result["meta"]
        if meta["err"]:
            logger.info(
                f"index_rewards_manager.py | Skipping error transaction from chain {tx_info}"
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
        tx_metadata["transfer_instruction"] = {
            "amount": amount,
            "eth_recipient": eth_recipient,
            "challenge_id": challenge_id,
            "specifier": specifier,
        }
        return tx_metadata
    except Exception as e:
        logger.error(
            f"index_rewards_manager.py | Error processing {tx_sig}, {e}", exc_info=True
        )
        raise e


def process_batch_sol_reward_manager_txs(
    session: Session,
    reward_manager_txs: List[RewardManagerTransactionInfo],
    redis: Redis
):
    """Validates that the transfer instruction is consistent with DB and inserts ChallengeDisbursement DB entries"""
    try:
        logger.error(f"index_reward_manager | {reward_manager_txs}")
        eth_recipients = [
            tx["transfer_instruction"]["eth_recipient"] for tx in reward_manager_txs if "transfer_instruction" in tx
        ]
        users = (
            session.query(User.wallet, User.user_id)
            .filter(User.wallet.in_(eth_recipients), User.is_current == True)
            .all()
        )
        users_map = {user[0]: user[1] for user in users}

        specifiers = [
            tx["transfer_instruction"]["specifier"] for tx in reward_manager_txs if "transfer_instruction" in tx
        ]

        user_challenges = (
            session.query(UserChallenge.specifier)
            .filter(
                UserChallenge.specifier.in_(specifiers),
            )
            .all()
        )
        user_challenge_specifiers = set([challenge[0] for challenge in user_challenges])

        challenge_disbursements = []
        for tx in reward_manager_txs:
            # Add transaction
            session.add(
                RewardManagerTransaction(
                    signature=tx["tx_sig"],
                    slot=tx["slot"],
                    created_at=datetime.datetime.utcfromtimestamp(tx["timestamp"])
                )
            )
            # No instruction found
            if "transfer_instruction" not in tx:
                logger.error(f"index_rewards_manager.py {tx}")
                continue 
            transfer_instr = tx["transfer_instruction"]
            specifier = transfer_instr["specifier"]
            eth_recipient = transfer_instr["eth_recipient"]
            if specifier not in user_challenge_specifiers:
                logger.error(
                    f"index_rewards_manager.py | Challenge specifier {specifier} not found"
                    "while processing disbursement"
                )
                continue
            if eth_recipient not in users_map:
                logger.error(
                    f"index_rewards_manager.py | eth_recipient {eth_recipient} not found while processing disbursement"
                )
                continue

            user_id = users_map[eth_recipient]
            logger.info(f"index_rewards_manager.py | found successful disbursement for user_id: [{user_id}]")

            challenge_disbursements.append(
                ChallengeDisbursement(
                    challenge_id=transfer_instr["challenge_id"],
                    user_id=user_id,
                    specifier=specifier,
                    amount=str(transfer_instr["amount"]),
                    slot=tx["slot"],
                    signature=tx["tx_sig"],
                )
            )

        if challenge_disbursements:
            # Save out the disbursements
            session.bulk_save_objects(challenge_disbursements)
            # Enqueue balance refreshes for the users
            user_ids = [c.user_id for c in challenge_disbursements]
            enqueue_immediate_balance_refresh(redis, user_ids)

    except Exception as e:
        logger.error(f"index_rewards_manager.py | Error processing {e}", exc_info=True)
        raise e


def get_latest_reward_disbursment_slot(session: Session):
    """Fetches the most recent slot for Challenge Disburements"""
    latest_slot = None
    highest_slot_query = (
        session.query(RewardManagerTransaction.slot).order_by(
            desc(RewardManagerTransaction.slot)
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
        session.query(RewardManagerTransaction).filter(
            RewardManagerTransaction.signature == tx_sig
        )
    ).count()
    exists = tx_sig_db_count > 0
    return exists


def get_transaction_signatures(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    program: str,
    get_latest_slot: Callable[[Session], int],
    check_tx_exists: Callable[[Session, str], bool],
    min_slot=None,
):
    """Fetches next batch of transaction signature offset from the previous latest processed slot

    Fetches the latest processed slot for the rewards manager program
    Iterates backwards from the current tx until an intersection is found with the latest processed slot
    Returns the next set of transaction signature from the current offset slot to process
    """
    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = None

    # Loop exit condition
    intersection_found = False

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_latest_slot(session)
        while not intersection_found:
            transactions_history = (
                solana_client_manager.get_confirmed_signature_for_address2(
                    program, before=last_tx_signature, limit=100
                )
            )

            transactions_array = transactions_history["result"]
            if not transactions_array:
                intersection_found = True
                logger.info(
                    f"index_rewards_manager.py | No transactions found before {last_tx_signature}"
                )
            else:
                # Current batch of transactions
                transaction_signature_batch = []
                for tx_info in transactions_array:
                    tx_sig = tx_info["signature"]
                    tx_slot = tx_info["slot"]
                    logger.info(
                        f"index_rewards_manager.py | Processing tx={tx_sig} | slot={tx_slot}"
                    )
                    if tx_info["slot"] > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif tx_info["slot"] <= latest_processed_slot and (
                        min_slot is None or tx_info["slot"] > min_slot
                    ):
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_rewards_manager.py | Latest slot re-traversal\
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


def process_transaction_signatures(
    solana_client_manager: SolanaClientManager,
    db: SessionManager,
    redis: Redis,
    transaction_signatures: List[str],
):
    """Concurrently processes the transactions to update the DB state for reward transfer instructions"""
    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_rewards_manager.py | processing {tx_sig_batch}")
        batch_start_time = time.time()

        transfer_instructions: List[RewardTransferInstruction] = []
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
                except Exception as exc:
                    logger.error(f"index_rewards_manager.py | {exc}")
                    raise exc
        with db.scoped_session() as session:
            process_batch_sol_reward_manager_txs(
                session, transfer_instructions, redis
            )
        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_rewards_manager.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )


def process_solana_rewards_manager(
    solana_client_manager: SolanaClientManager, db: SessionManager, redis: Redis
):
    """Fetches the next set of reward manager transactions and updates the DB with Challenge Disbursements"""
    if not is_valid_rewards_manager_program:
        logger.error(
            "index_rewards_manager.py | no valid reward manager program passed"
        )
        return
    if not REWARDS_MANAGER_ACCOUNT:
        logger.error("index_rewards_manager.py | reward manager account missing")
        return
    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = get_transaction_signatures(
        solana_client_manager,
        db,
        REWARDS_MANAGER_PROGRAM,
        get_latest_reward_disbursment_slot,
        get_tx_in_db,
        MIN_SLOT,
    )
    logger.info(f"index_rewards_manager.py | {transaction_signatures}")

    process_transaction_signatures(solana_client_manager, db, redis, transaction_signatures)


######## CELERY TASKS ########
@celery.task(name="index_rewards_manager", bind=True)
def index_rewards_manager(self):
    redis = index_rewards_manager.redis
    solana_client_manager = index_rewards_manager.solana_client_manager
    db = index_rewards_manager.db

    # Define lock acquired boolean
    have_lock = False
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock("solana_rewards_manager_lock", timeout=14400)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_rewards_manager.py | Acquired lock")
            process_solana_rewards_manager(solana_client_manager, db, redis)
        else:
            logger.info("index_rewards_manager.py | Failed to acquire lock")
    except Exception as e:
        logger.error(
            "index_rewards_manager.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
