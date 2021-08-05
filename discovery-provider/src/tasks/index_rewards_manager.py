import concurrent.futures
import logging
import time
from typing import Callable, List, TypedDict
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from solana.rpc.api import Client

import base58
from src.models.models import User, UserChallenge
from src.models import ChallengeDisbursement
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.session_manager import SessionManager
from src.utils.solana_indexing import (
    get_sol_tx_info,
    parse_instruction_data,
    InstructionFormat,
    SolanaInstructionType,
    TransactionInfoResult,
)

logger = logging.getLogger(__name__)

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
MIN_SLOT = int(shared_config["solana"]["rewards_manager_min_slot"])

# Maximum number of batches to process at once
TX_SIGNATURES_MAX_BATCHES = 20

# Last N entries present in tx_signatures array during processing
TX_SIGNATURES_RESIZE_LENGTH = 10


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
    """Parse Trasfer instruction data submitted to Audius Rewards Manager program

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


def parse_transfer_instruction_id(transfer_id: str) -> List[str]:
    """Parses the transfer instruction id into [challenge_id, specifier]
    The id in the transfer instruction is formatted as "<CHALLENGE_ID>:<SPECIFIER>"
    """
    id_parts = transfer_id.split(":")
    if len(id_parts) != 2:
        raise Exception(
            f"Unable to parse tranfer instruction id into challenge_id and specifier {transfer_id}"
        )
    return id_parts


def process_sol_rewards_transfer_instruction(
    session: Session, solana_client: Client, tx_sig: str
):
    """Fetches metadata for rewards tranfer transactions and creates Challege Disbursements

    Fetches the transaction metadata from solana using the tx signature
    Checks the metadata for a transfer instruction
    Decodes and parses the transfer instruction metadata
    Validates the metadata fields and inserts a ChallengeDisbursement DB entry
    """
    try:
        tx_info = get_sol_tx_info(solana_client, tx_sig)
        logger.info(f"index_rewards_manager.py | Got transaction: {tx_sig} | {tx_info}")
        result: TransactionInfoResult = tx_info["result"]
        meta = result["meta"]
        if meta["err"]:
            logger.info(
                f"index_rewards_manager.py | Skipping error transaction from chain {tx_info}"
            )
            return
        tx_message = result["transaction"]["message"]
        instructions = tx_message["instructions"]
        rewards_manager_program_index = tx_message["accountKeys"].index(
            REWARDS_MANAGER_PROGRAM
        )
        has_transfer_instruction = any(
            log == "Program log: Instruction: Transfer" for log in meta["logMessages"]
        )
        if has_transfer_instruction:
            for instruction in instructions:
                if instruction["programIdIndex"] == rewards_manager_program_index:
                    logger.info(f"index_rewards_manager.py | instruction={tx_info}")
                    transfer_instruction_data = parse_transfer_instruction_data(
                        instruction["data"]
                    )
                    amount = transfer_instruction_data["amount"]
                    eth_recipient = transfer_instruction_data["eth_recipient"]
                    id = transfer_instruction_data["id"]
                    challenge_id, specifier = parse_transfer_instruction_id(id)
                    logger.info(
                        f"index_rewards_manager.py | amount={amount} -- id={id} -- eth_recipient={eth_recipient}"
                    )

                    user_query = (
                        session.query(User.user_id)
                        .filter(User.wallet == eth_recipient)
                        .first()
                    )
                    if user_query is None:
                        raise Exception(
                            f"No user found with eth address {eth_recipient}"
                        )
                    user_challenge = (
                        session.query(UserChallenge.user_id)
                        .filter(
                            UserChallenge.challenge_id == challenge_id,
                            UserChallenge.specifier == specifier,
                        )
                        .first()
                    )
                    if user_challenge is None:
                        raise Exception(
                            f"No user challenge found with challenge_id {challenge_id} and specifier {specifier}"
                        )

                    session.add(
                        ChallengeDisbursement(
                            challenge_id=challenge_id,
                            user_id=user_query[0],
                            specifier=specifier,
                            amount=str(amount),
                            slot=result["slot"],
                            signature=tx_sig,
                        )
                    )
    except Exception as e:
        logger.error(
            f"index_rewards_manager.py | Error processing {tx_sig}, {e}", exc_info=True
        )
        raise e


def get_latest_reward_disbursment_slot(session: Session):
    """Fetches the most recent slot for Challenge Disburements"""
    latest_slot = None
    highest_slot_query = (
        session.query(ChallengeDisbursement.slot).order_by(
            desc(ChallengeDisbursement.slot)
        )
    ).first()
    # Can be None prior to first write operations
    if highest_slot_query is not None:
        latest_slot = highest_slot_query[0]

    # If no slots have yet been recorded, assume all are valid
    if latest_slot is None:
        latest_slot = 0

    logger.info(f"index_rewards_manager.py | returning {latest_slot} for highest slot")
    return latest_slot


def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    """Checks if the transaction signature already exists for Challenge Disburements"""
    tx_sig_db_count = (
        session.query(ChallengeDisbursement).filter(
            ChallengeDisbursement.signature == tx_sig
        )
    ).count()
    exists = tx_sig_db_count > 0
    logger.info(f"index_rewards_manager.py | {tx_sig} exists={exists}")
    return exists


def get_transaction_signatures(
    solana_client: Client,
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
        logger.info(f"index_rewards_manager.py | highest tx = {latest_processed_slot}")
        while not intersection_found:
            transactions_history = solana_client.get_confirmed_signature_for_address2(
                program, before=last_tx_signature, limit=100
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
                    prev_len = len(transaction_signatures)
                    # Only take the oldest transaction from the transaction_signatures array
                    # transaction_signatures is sorted from newest to oldest
                    transaction_signatures = transaction_signatures[
                        -TX_SIGNATURES_RESIZE_LENGTH:
                    ]
                    logger.info(
                        f"index_rewards_manager.py | sliced tx_sigs from \
                            {prev_len} to {len(transaction_signatures)} entries"
                    )

    # Reverse batches aggregated so oldest transactions are processed first
    transaction_signatures.reverse()
    return transaction_signatures


def process_transaction_signature(
    solana_client: Client, db: SessionManager, transaction_signatures: List[str]
):
    """Concurrently processes the transactions to update the DB state for reward transfer instructions"""
    for tx_sig_batch in transaction_signatures:
        logger.info(f"index_rewards_manager.py | processing {tx_sig_batch}")
        batch_start_time = time.time()
        # Process each batch in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            with db.scoped_session() as session:
                parse_sol_tx_futures = {
                    executor.submit(
                        process_sol_rewards_transfer_instruction,
                        session,
                        solana_client,
                        tx_sig,
                    ): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                    try:
                        # No return value expected here so we just ensure all futures are resolved
                        future.result()
                    except Exception as exc:
                        logger.error(f"index_rewards_manager.py | {exc}")
                        raise exc

        batch_end_time = time.time()
        batch_duration = batch_end_time - batch_start_time
        logger.info(
            f"index_rewards_manager.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
        )


def process_solana_rewards_manager(solana_client: Client, db: SessionManager):
    """Fetches the next set of reward manager transactions and updates the DB with Challenge Disbursements"""
    try:
        base58.b58decode(REWARDS_MANAGER_PROGRAM)
    except ValueError:
        logger.error(
            f"index_rewards_manager.py"
            f"Invalid Rewards Manager program ({REWARDS_MANAGER_PROGRAM}) configured, exiting."
        )
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = get_transaction_signatures(
        solana_client,
        db,
        REWARDS_MANAGER_PROGRAM,
        get_latest_reward_disbursment_slot,
        get_tx_in_db,
        MIN_SLOT,
    )
    logger.info(f"index_rewards_manager.py | {transaction_signatures}")

    process_transaction_signature(solana_client, db, transaction_signatures)


######## CELERY TASKS ########
@celery.task(name="index_rewards_manager", bind=True)
def index_rewards_manager(self):
    redis = index_rewards_manager.redis
    solana_client = index_rewards_manager.solana_client
    db = index_rewards_manager.db

    # Define lock acquired boolean
    have_lock = False
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock(
        "solana_rewards_manager", blocking_timeout=25, timeout=14400
    )

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_rewards_manager.py | Acquired lock")
            process_solana_rewards_manager(solana_client, db)
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
