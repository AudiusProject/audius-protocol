import concurrent.futures
import logging
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Set, TypedDict, TypeVar, cast

import base58
from redis import Redis
from solders.instruction import CompiledInstruction
from solders.message import Message
from solders.pubkey import Pubkey
from solders.rpc.responses import RpcConfirmedTransactionStatusWithSignature
from solders.transaction import Transaction

from src.exceptions import SolanaTransactionFetchError
from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.models.users.associated_wallet import AssociatedWallet, WalletChain
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import SPL_TOKEN_ID, get_base_address
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import (
    get_account_index,
    get_solana_tx_token_balance_changes,
    get_valid_instruction,
    has_log,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import redis_keys
from src.utils.session_manager import SessionManager
from src.utils.solana_indexing_logger import SolanaIndexingLogger

WAUDIO_MINT = shared_config["solana"]["waudio_mint"]
WAUDIO_MINT_PUBKEY = Pubkey.from_string(WAUDIO_MINT) if WAUDIO_MINT else None
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
USER_BANK_PUBKEY = Pubkey.from_string(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None
PURCHASE_AUDIO_MEMO_PROGRAM = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
TRANSFER_CHECKED_INSTRUCTION = "Program log: Instruction: TransferChecked"

REDIS_TX_CACHE_QUEUE_PREFIX = "spl-token-tx-cache-queue"

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
# Though we don't index transfers from the sender's side in this task, we must still
# enqueue the sender's accounts for balance refreshes if they are Audius accounts.
SENDER_ACCOUNT_INDEX = 0
INITIAL_FETCH_SIZE = 10

purchase_vendor_map = {
    "Link by Stripe": TransactionType.purchase_stripe,
    "Coinbase Pay": TransactionType.purchase_coinbase,
    "Unknown": TransactionType.purchase_unknown,
}

logger = logging.getLogger(__name__)


class SplTokenTransactionInfo(TypedDict):
    user_bank: str
    signature: str
    slot: int
    timestamp: datetime
    vendor: Optional[str]
    prebalance: int
    postbalance: int
    sender_wallet: Optional[str]
    root_accounts: List[str]
    token_accounts: List[str]


def parse_memo_instruction(tx_message: Message) -> str:
    try:
        account_keys = tx_message.account_keys
        instructions: List[CompiledInstruction] = tx_message.instructions
        memo_instruction = next(
            (
                inst
                for inst in instructions
                if inst.program_id_index == MEMO_INSTRUCTION_INDEX
            ),
            None,
        )

        if not memo_instruction:
            return ""

        memo_account = str(account_keys[MEMO_INSTRUCTION_INDEX])

        if not memo_account or memo_account != PURCHASE_AUDIO_MEMO_PROGRAM:
            return ""
        return str(memo_instruction.data)
    except Exception as e:
        logger.error(f"index_spl_token.py | Error parsing memo, {e}", exc_info=True)
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
        logger.error(f"index_spl_token.py | Error decoding memo, {e}", exc_info=True)
        raise e


def parse_spl_token_transaction(
    solana_client_manager: SolanaClientManager,
    tx_sig: str,
) -> Optional[List[SplTokenTransactionInfo]]:
    # Fork on v0 transaction.
    # If v0 transaction, look for the balance changes with the mint we care about
    # Index those into an array of SplTokenTransactionInfo
    try:
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
        result = tx_info.value
        if not result:
            raise Exception(f"No txinfo value {tx_info}")

        version = result.transaction.version
        meta = result.transaction.meta
        if not meta:
            raise Exception(f"No transaction meta {meta}")

        if meta.err:
            return None

        has_transfer_checked_instruction = has_log(meta, TRANSFER_CHECKED_INSTRUCTION)
        if not has_transfer_checked_instruction:
            logger.debug(
                f"index_spl_token.py | {tx_sig} No transfer checked instruction found"
            )
            return None

        tx_message = cast(Transaction, result.transaction.transaction).message
        account_keys = list(map(lambda key: str(key), tx_message.account_keys))

        memo_encoded = parse_memo_instruction(tx_message)
        vendor = decode_memo_and_extract_vendor(memo_encoded) if memo_encoded else None

        receiver_spl_tx_info: SplTokenTransactionInfo

        if version == 0:
            balance_changes = get_solana_tx_token_balance_changes(
                meta=meta, account_keys=account_keys, mint=WAUDIO_MINT
            )
            tx_infos: list[SplTokenTransactionInfo] = []
            sender_token_accounts: list[str] = []
            sender_root_accounts: list[str] = []
            for key, balance_change in balance_changes.items():
                if balance_change["change"] < 0:  # Only get senders
                    sender_token_accounts.append(key)
                    sender_root_accounts.append(balance_changes[key]["owner"])

            for key, balance_change in balance_changes.items():
                if balance_change["change"] > 0:  # Only get receivers
                    receiver_spl_tx_info = {
                        "user_bank": key,
                        "signature": tx_sig,
                        "slot": result.slot,
                        "timestamp": datetime.utcfromtimestamp(
                            float(result.block_time or 0)
                        ),
                        "vendor": vendor,
                        "prebalance": balance_changes[key]["pre_balance"],
                        "postbalance": balance_changes[key]["post_balance"],
                        "root_accounts": sender_root_accounts
                        + [balance_changes[key]["owner"]],
                        "token_accounts": sender_token_accounts + [key],
                        # The specific sender may be ambigous in the case of a Address Lookup Table
                        "sender_wallet": None,
                    }
                    tx_infos.append(receiver_spl_tx_info)
            return tx_infos
        else:
            instruction = get_valid_instruction(tx_message, meta, SPL_TOKEN_ID)
            if not instruction:
                logger.error(
                    f"index_spl_token.py | {tx_sig} No valid instruction for spl token program found"
                )
                return None
            balance_changes = get_solana_tx_token_balance_changes(
                meta=meta, account_keys=account_keys
            )
            sender_idx = get_account_index(instruction, SENDER_ACCOUNT_INDEX)
            receiver_idx = get_account_index(instruction, RECEIVER_ACCOUNT_INDEX)
            sender_token_account = str(account_keys[sender_idx])
            receiver_token_account = str(account_keys[receiver_idx])
            sender_root_account = balance_changes[sender_token_account]["owner"]
            receiver_root_account = balance_changes[receiver_token_account]["owner"]

            if balance_changes[receiver_token_account]["change"] == 0:
                logger.error(f"index_spl_token.py | {tx_sig} no balance change found")
                return None

            receiver_spl_tx_info = {
                "user_bank": receiver_token_account,
                "signature": tx_sig,
                "slot": result.slot,
                "timestamp": datetime.utcfromtimestamp(float(result.block_time or 0)),
                "vendor": vendor,
                "prebalance": balance_changes[receiver_token_account]["pre_balance"],
                "postbalance": balance_changes[receiver_token_account]["post_balance"],
                "sender_wallet": sender_root_account,
                "root_accounts": [sender_root_account, receiver_root_account],
                "token_accounts": [sender_token_account, receiver_token_account],
            }
            return [receiver_spl_tx_info]

    except SolanaTransactionFetchError:
        return None
    except Exception as e:
        signature = tx_sig
        logger.error(
            f"index_spl_token.py | Error processing {signature}, {e}", exc_info=True
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

            logger.debug(
                f"index_spl_token.py | processing transaction: {tx_info['signature']} | slot={tx_info['slot']}"
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
            f"index_spl_token.py | Error processing transaction {tx_info}, {e}",
            exc_info=True,
        )
        raise e


# Query the highest traversed solana slot
def get_latest_slot(db):
    latest_slot = None
    with db.scoped_session() as session:
        highest_slot_query = session.query(
            SPLTokenTransaction.last_scanned_slot
        ).first()
        # Can be None prior to first write operations
        if highest_slot_query is not None:
            latest_slot = highest_slot_query[0]

    # Return None if not yet cached
    return latest_slot


def parse_sol_tx_batch(
    db: SessionManager,
    solana_client_manager: SolanaClientManager,
    redis: Redis,
    tx_sig_batch_records: List[RpcConfirmedTransactionStatusWithSignature],
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
    updated_root_accounts: Set[str] = set()
    updated_token_accounts: Set[str] = set()
    spl_token_txs: List[SplTokenTransactionInfo] = []
    # Process each batch in parallel
    with concurrent.futures.ThreadPoolExecutor() as executor:
        parse_sol_tx_futures = {
            executor.submit(
                parse_spl_token_transaction,
                solana_client_manager,
                str(tx_sig.signature),
            ): tx_sig
            for tx_sig in tx_sig_batch_records
        }
        try:
            for future in concurrent.futures.as_completed(
                parse_sol_tx_futures, timeout=45
            ):
                try:
                    tx_infos = future.result()
                except Exception as e:
                    logger.error(f"index_spl_token.py | {e}")
                    continue
                if not tx_infos:
                    continue
                for tx_info in tx_infos:
                    updated_root_accounts.update(tx_info["root_accounts"])
                    updated_token_accounts.update(tx_info["token_accounts"])
                    spl_token_txs.append(tx_info)

        except Exception as exc:
            logger.error(
                f"index_spl_token.py | Error parsing sol spl token transaction: {exc}"
            )
            raise exc

    update_user_ids: Set[int] = set()
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
            user_set = {user[0] for user in user_result}
            user_bank_set = {user[1] for user in user_result}
            update_user_ids.update(user_set)

            audio_txs = process_spl_token_transactions(spl_token_txs, user_bank_set)
            session.bulk_save_objects(audio_txs)

        if updated_root_accounts:
            # Remove the user bank owner
            user_bank_owner, _ = get_base_address(WAUDIO_MINT_PUBKEY, USER_BANK_PUBKEY)
            updated_root_accounts.discard(str(user_bank_owner))

            associated_wallet_result = (
                session.query(AssociatedWallet.user_id).filter(
                    AssociatedWallet.is_current == True,
                    AssociatedWallet.is_delete == False,
                    AssociatedWallet.chain == WalletChain.sol,
                    AssociatedWallet.wallet.in_(list(updated_root_accounts)),
                )
            ).all()
            associated_wallet_set = {user_id for [user_id] in associated_wallet_result}
            update_user_ids.update(associated_wallet_set)

        user_ids = list(update_user_ids)
        if user_ids:
            logger.debug(
                f"index_spl_token.py | Enqueueing user ids {user_ids} to immediate balance refresh queue"
            )
            enqueue_immediate_balance_refresh(redis, user_ids)

        if tx_sig_batch_records:
            last_tx = tx_sig_batch_records[0]

            last_scanned_slot = last_tx.slot
            last_scanned_signature = str(last_tx.signature)
            solana_logger.add_log(
                f"Updating last_tx signature to {last_scanned_signature}"
            )
            redis.set(redis_keys.solana.spl_token.last_tx, last_scanned_signature)

            record = session.query(SPLTokenTransaction).first()
            if record:
                record.last_scanned_slot = last_scanned_slot
                record.signature = last_scanned_signature
            else:
                record = SPLTokenTransaction(
                    last_scanned_slot=last_scanned_slot,
                    signature=last_scanned_signature,
                )
            session.add(record)

    batch_end_time = time.time()
    batch_duration = batch_end_time - batch_start_time
    solana_logger.add_log(
        f"processed batch {len(tx_sig_batch_records)} txs in {batch_duration}s"
    )

    return (update_user_ids, updated_root_accounts, updated_token_accounts)


T = TypeVar("T")


def split_list(l: List[T], n: int):
    for i in range(0, len(l), n):
        yield l[i : i + n]


# Push to head of array containing seen transactions
# Used to avoid re-traversal from chain tail when slot diff > certain number
def cache_traversed_tx(redis: Redis, tx: RpcConfirmedTransactionStatusWithSignature):
    redis.lpush(REDIS_TX_CACHE_QUEUE_PREFIX, tx.to_json())


# Fetch the cached transaction from redis queue
# Eliminates transactions one by one if they are < latest db slot
def fetch_traversed_tx_from_cache(redis: Redis, latest_db_slot: Optional[int]):
    if latest_db_slot is None:
        return None
    cached_offset_tx_found = False
    while not cached_offset_tx_found:
        last_cached_tx_raw = redis.lrange(REDIS_TX_CACHE_QUEUE_PREFIX, 0, 1)
        if last_cached_tx_raw:
            last_cached_tx = RpcConfirmedTransactionStatusWithSignature.from_json(
                last_cached_tx_raw[0].decode()
            )
            redis.ltrim(REDIS_TX_CACHE_QUEUE_PREFIX, 1, -1)
            # If a single element is remaining, clear the list to avoid dupe processing
            if redis.llen(REDIS_TX_CACHE_QUEUE_PREFIX) == 1:
                redis.delete(REDIS_TX_CACHE_QUEUE_PREFIX)
            # Return if a valid signature is found
            if last_cached_tx.slot > latest_db_slot:
                cached_offset_tx_found = True
                last_tx_signature = last_cached_tx.signature
                return last_tx_signature
        else:
            break
    return None


def process_spl_token_tx(
    solana_client_manager: SolanaClientManager, db: SessionManager, redis: Redis
):
    solana_logger = SolanaIndexingLogger("index_spl_token")
    solana_logger.start_time("fetch_batches")
    try:
        base58.b58decode(WAUDIO_MINT)
    except ValueError:
        logger.error(
            f"index_spl_token.py"
            f"Invalid Token program ({WAUDIO_MINT}) configured, exiting."
        )
        return

    # Highest currently processed slot in the DB
    latest_processed_slot = get_latest_slot(db)
    solana_logger.add_log(f"latest used slot: {latest_processed_slot}")

    # Utilize the cached tx to offset
    cached_offset_tx = fetch_traversed_tx_from_cache(redis, latest_processed_slot)

    # The 'before' value from where we start querying transactions
    last_tx_signature = cached_offset_tx

    # Loop exit condition
    intersection_found = False

    # List of batches of signatures that will be populated as we traverse recent operations
    transaction_signatures: List[List[RpcConfirmedTransactionStatusWithSignature]] = []

    # Current batch of transactions
    transaction_signature_batch: List[RpcConfirmedTransactionStatusWithSignature] = []

    # Current batch
    page_count = 0
    is_initial_fetch = True

    # Traverse recent records until an intersection is found with latest slot
    while not intersection_found:
        fetch_size = (
            INITIAL_FETCH_SIZE if is_initial_fetch else FETCH_TX_SIGNATURES_BATCH_SIZE
        )
        solana_logger.add_log(
            f"Requesting {fetch_size} transactions before {last_tx_signature}"
        )
        transactions_history = solana_client_manager.get_signatures_for_address(
            WAUDIO_MINT,
            before=last_tx_signature,
            limit=fetch_size,
        )
        is_initial_fetch = False
        solana_logger.add_log(f"Retrieved transactions before {last_tx_signature}")
        transactions_array = transactions_history.value
        if not transactions_array:
            # This is considered an 'intersection' since there are no further transactions to process but
            # really represents the end of known history for this ProgramId
            intersection_found = True
            solana_logger.add_log(f"No transactions found before {last_tx_signature}")
        else:
            # handle initial case where no there is no stored latest processed slot and start from current
            if latest_processed_slot is None:
                logger.debug("index_spl_token.py | setting from none")
                transaction_signature_batch = transactions_array
                intersection_found = True
            else:
                for tx in transactions_array:
                    if tx.err is not None:
                        logger.debug(
                            f"index_spl_token.py | Skipping error transaction tx={tx.signature} err={tx.err}"
                        )
                        continue
                    if tx.slot > latest_processed_slot:
                        transaction_signature_batch.append(tx)
                    elif tx.slot <= latest_processed_slot:
                        intersection_found = True
                        break
            # Restart processing at the end of this transaction signature batch
            last_tx = transactions_array[-1]
            last_tx_signature = last_tx.signature

            # Append to recently seen cache
            cache_traversed_tx(redis, last_tx)

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
            user_ids, root_accounts, token_accounts = parse_sol_tx_batch(
                db, solana_client_manager, redis, tx_sig_batch_records, solana_logger
            )
            totals["user_ids"] += len(user_ids)
            totals["root_accts"] += len(root_accounts)
            totals["token_accts"] += len(token_accounts)

    solana_logger.end_time("parse_batches")
    solana_logger.add_context("total_user_ids_updated", totals["user_ids"])
    solana_logger.add_context("total_root_accts_updated", totals["root_accts"])
    solana_logger.add_context("total_token_accts_updated", totals["token_accts"])

    logger.debug("index_spl_token.py", extra=solana_logger.get_context())


index_spl_token_lock = "spl_token_lock"


@celery.task(name="index_spl_token", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_spl_token(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = index_spl_token.redis
    solana_client_manager = index_spl_token.solana_client_manager
    db = index_spl_token.db
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    # Max duration of lock is 4hrs or 14400 seconds
    update_lock = redis.lock(index_spl_token_lock, blocking_timeout=25, timeout=14400)

    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.debug("index_spl_token.py | Acquired lock")
            process_spl_token_tx(solana_client_manager, db, redis)
            redis.set(
                redis_keys.solana.spl_token.last_completed_at,
                datetime.now(timezone.utc).timestamp(),
            )
    except Exception as e:
        logger.error("index_spl_token.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
