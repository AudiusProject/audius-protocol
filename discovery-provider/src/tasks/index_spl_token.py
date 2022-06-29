import concurrent.futures
import json
import logging
import time
from typing import List, Optional, Set, Tuple

import base58
from redis import Redis
from solana.publickey import PublicKey
from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.models.users.associated_wallet import AssociatedWallet, WalletChain
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import get_base_address
from src.solana.solana_transaction_types import (
    ConfirmedSignatureForAddressResult,
    ConfirmedTransaction,
    TransactionInfoResult,
)
from src.tasks.celery_app import celery
from src.utils.cache_solana_program import (
    CachedProgramTxInfo,
    cache_latest_sol_db_tx,
    fetch_and_cache_latest_program_tx_redis,
)
from src.utils.config import shared_config
from src.utils.redis_constants import (
    latest_sol_spl_token_db_key,
    latest_sol_spl_token_program_tx_key,
)
from src.utils.session_manager import SessionManager
from src.utils.solana_indexing_logger import SolanaIndexingLogger

SPL_TOKEN_PROGRAM = shared_config["solana"]["waudio_mint"]
SPL_TOKEN_PUBKEY = PublicKey(SPL_TOKEN_PROGRAM) if SPL_TOKEN_PROGRAM else None
USER_BANK_ADDRESS = shared_config["solana"]["user_bank_program_address"]
USER_BANK_PUBKEY = PublicKey(USER_BANK_ADDRESS) if USER_BANK_ADDRESS else None

REDIS_TX_CACHE_QUEUE_PREFIX = "spl-token-tx-cache-queue"

# Number of signatures that are fetched from RPC and written at once
# For example, in a batch of 1000 only 100 will be fetched and written in parallel
# Intended to relieve RPC and DB pressure
TX_SIGNATURES_PROCESSING_SIZE = 100

logger = logging.getLogger(__name__)

# Parse a spl token transaction information to check if the token balances change
# by comparing the pre token balance and post token balance fields
# NOTE: that the account index is used instead of the owner field
# because the owner could be the same for both - in the case for user bank accts
# Return a tuple of the owners - corresponding to the root accounts and the
# token accounts which are the accounts in the transaction account keys


def get_token_balance_change_owners(
    tx_result: TransactionInfoResult,
) -> Tuple[Set[str], Set[str]]:
    root_accounts_to_refresh: Set[str] = set()
    token_accounts_to_refresh: Set[str] = set()
    if (
        "meta" not in tx_result
        or "preTokenBalances" not in tx_result["meta"]
        or "postTokenBalances" not in tx_result["meta"]
        or "transaction" not in tx_result
        or "message" not in tx_result["transaction"]
        or "accountKeys" not in tx_result["transaction"]["message"]
    ):
        logger.error("invalid format, return early")
        return (root_accounts_to_refresh, token_accounts_to_refresh)
    owner_balance_dict = {}
    account_keys = tx_result["transaction"]["message"]["accountKeys"]
    for pre_balance in tx_result["meta"]["preTokenBalances"]:
        owner_balance_dict[pre_balance["accountIndex"]] = pre_balance["uiTokenAmount"][
            "amount"
        ]
    for post_balance in tx_result["meta"]["postTokenBalances"]:
        account_index = post_balance["accountIndex"]
        amount = post_balance["uiTokenAmount"]["amount"]
        owner = post_balance["owner"]
        if account_index not in owner_balance_dict and amount != "0":
            root_accounts_to_refresh.add(owner)
            token_accounts_to_refresh.add(account_keys[account_index])
        elif (
            account_index in owner_balance_dict
            and amount != owner_balance_dict[account_index]
        ):
            root_accounts_to_refresh.add(owner)
            token_accounts_to_refresh.add(account_keys[account_index])
    return (root_accounts_to_refresh, token_accounts_to_refresh)


# Cache the latest value committed to DB in redis
# Used for quick retrieval in health check
def cache_latest_spl_audio_db_tx(redis: Redis, latest_tx: CachedProgramTxInfo):
    cache_latest_sol_db_tx(redis, latest_sol_spl_token_db_key, latest_tx)


def parse_spl_token_transaction(
    solana_client_manager: SolanaClientManager,
    tx_sig: ConfirmedSignatureForAddressResult,
) -> Tuple[ConfirmedTransaction, List[str], List[str]]:
    try:
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig["signature"])
        result = tx_info["result"]
        error = tx_info["result"]["meta"]["err"]

        if error:
            return (tx_info, [], [])
        root_accounts, token_accounts = get_token_balance_change_owners(result)
        return (tx_info, list(root_accounts), list(token_accounts))

    except Exception as e:
        signature = tx_sig["signature"]
        logger.error(
            f"index_spl_token.py | Error processing {signature}, {e}", exc_info=True
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

    logger.info(f"index_spl_token.py | returning {latest_slot} for highest slot")
    return latest_slot


def parse_sol_tx_batch(
    db: SessionManager,
    solana_client_manager: SolanaClientManager,
    redis: Redis,
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
    updated_root_accounts: Set[str] = set()
    updated_token_accounts: Set[str] = set()
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
                _, root_accounts, token_accounts = future.result()
                if root_accounts or token_accounts:
                    updated_root_accounts.update(root_accounts)
                    updated_token_accounts.update(token_accounts)

        except Exception as exc:
            logger.error(
                f"index_spl_token.py | Error parsing sol spl token transaction: {exc}"
            )
            raise exc

    update_user_ids: Set[int] = set()
    with db.scoped_session() as session:
        if updated_token_accounts:
            user_bank_subquery = session.query(UserBankAccount.ethereum_address).filter(
                UserBankAccount.bank_account.in_(list(updated_token_accounts))
            )

            user_result = (
                session.query(User.user_id)
                .filter(User.is_current == True, User.wallet.in_(user_bank_subquery))
                .all()
            )
            user_set = {user_id for [user_id] in user_result}
            update_user_ids.update(user_set)

        if updated_root_accounts:
            # Remove the user bank owner
            user_bank_owner, _ = get_base_address(SPL_TOKEN_PUBKEY, USER_BANK_PUBKEY)
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
            logger.info(
                f"index_spl_token.py | Enqueueing user ids {user_ids} to immediate balance refresh queue"
            )
            enqueue_immediate_balance_refresh(redis, user_ids)

        if tx_sig_batch_records:
            last_tx = tx_sig_batch_records[0]

            last_scanned_slot = last_tx["slot"]
            last_scanned_signature = last_tx["signature"]
            solana_logger.add_log(
                f"Updating last_scanned_slot to {last_scanned_slot} and signature to {last_scanned_signature}"
            )
            cache_latest_spl_audio_db_tx(
                redis,
                {
                    "signature": last_scanned_signature,
                    "slot": last_scanned_slot,
                    "timestamp": last_tx["blockTime"],
                },
            )

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


def split_list(list, n):
    for i in range(0, len(list), n):
        yield list[i : i + n]


# Push to head of array containing seen transactions
# Used to avoid re-traversal from chain tail when slot diff > certain number
def cache_traversed_tx(redis: Redis, tx: ConfirmedSignatureForAddressResult):
    redis.lpush(REDIS_TX_CACHE_QUEUE_PREFIX, json.dumps(tx))


# Fetch the cached transaction from redis queue
# Eliminates transactions one by one if they are < latest db slot
def fetch_traversed_tx_from_cache(redis: Redis, latest_db_slot: Optional[int]):
    if latest_db_slot is None:
        return None
    cached_offset_tx_found = False
    while not cached_offset_tx_found:
        last_cached_tx_raw = redis.lrange(REDIS_TX_CACHE_QUEUE_PREFIX, 0, 1)
        if last_cached_tx_raw:
            last_cached_tx: ConfirmedSignatureForAddressResult = json.loads(
                last_cached_tx_raw[0]
            )
            redis.ltrim(REDIS_TX_CACHE_QUEUE_PREFIX, 1, -1)
            # If a single element is remaining, clear the list to avoid dupe processing
            if redis.llen(REDIS_TX_CACHE_QUEUE_PREFIX) == 1:
                redis.delete(REDIS_TX_CACHE_QUEUE_PREFIX)
            # Return if a valid signature is found
            if last_cached_tx["slot"] > latest_db_slot:
                cached_offset_tx_found = True
                last_tx_signature = last_cached_tx["signature"]
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
        base58.b58decode(SPL_TOKEN_PROGRAM)
    except ValueError:
        logger.error(
            f"index_spl_token.py"
            f"Invalid Token program ({SPL_TOKEN_PROGRAM}) configured, exiting."
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
                logger.info("index_spl_token.py | setting from none")
                transaction_signature_batch = transactions_array
                intersection_found = True
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
    logger.info("index_spl_token.py | intersection found")
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

    logger.info("index_spl_token.py", extra=solana_logger.get_context())


index_spl_token_lock = "spl_token_lock"


@celery.task(name="index_spl_token", bind=True)
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
        # Cache latest tx outside of lock
        fetch_and_cache_latest_program_tx_redis(
            solana_client_manager,
            redis,
            SPL_TOKEN_PROGRAM,
            latest_sol_spl_token_program_tx_key,
        )
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info("index_spl_token.py | Acquired lock")
            process_spl_token_tx(solana_client_manager, db, redis)
        # else:
        #     logger.info("index_spl_token.py | Failed to acquire lock")
    except Exception as e:
        logger.error("index_spl_token.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
