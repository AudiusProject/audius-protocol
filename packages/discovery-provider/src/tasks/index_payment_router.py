import concurrent.futures
import time
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple, TypedDict, Union, cast

from src.models.users.payment_router import PaymentRouterTx
from redis import Redis
from solders.instruction import CompiledInstruction
from solders.message import Message
from solders.pubkey import Pubkey
from solders.token.associated import get_associated_token_address
from solders.rpc.responses import GetTransactionResp
from solders.transaction_status import UiTransactionStatusMeta

from sqlalchemy import and_, desc
from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.exceptions import SolanaTransactionFetchError
from src.models.tracks.track_price_history import TrackPriceHistory
from src.models.tracks.track import Track
from src.models.users.usdc_purchase import PurchaseType, USDCPurchase
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
    USDC_DECIMALS,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import (
    get_base_address,
)
from src.tasks.celery_app import celery
from src.utils.cache_solana_program import (
    cache_latest_sol_db_tx,
    fetch_and_cache_latest_program_tx_redis,
)
from src.utils.config import shared_config
from src.utils.helpers import (
    BalanceChange,
    decode_all_solana_memos,
    get_account_index,
    get_solana_tx_token_balance_changes,
    get_valid_instruction,
    has_log,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_constants import (
    latest_sol_payment_router_db_tx_key,
    latest_sol_payment_router_program_tx_key,
    latest_sol_payment_router_slot_key,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)

# Populate values used in indexing from config
PAYMENT_ROUTER_ADDRESS = shared_config["solana"]["payment_router_program_address"]
WAUDIO_MINT = shared_config["solana"]["waudio_mint"]
USDC_MINT = shared_config["solana"]["usdc_mint"]

PAYMENT_ROUTER_PUBKEY = (
    Pubkey.from_string(PAYMENT_ROUTER_ADDRESS) if PAYMENT_ROUTER_ADDRESS else None
)
WAUDIO_MINT_PUBKEY = Pubkey.from_string(WAUDIO_MINT) if WAUDIO_MINT else None
USDC_MINT_PUBKEY = Pubkey.from_string(USDC_MINT) if USDC_MINT else None

# Transfer instructions don't have a mint address in their account list. But the
# source account will be an ATA for either USDC or WAUDIO which is owned by the
# payment router PDA. We can derive the payment router PDA and then use it to
# derive the expected ATA addresses for each mint.
PAYMENT_ROUTER_PDA_PUBKEY, _ = get_base_address(
    "payment_router".encode("UTF-8"), PAYMENT_ROUTER_PUBKEY
)
PAYMENT_ROUTER_USDC_ATA_ADDRESS = (
    str(get_associated_token_address(PAYMENT_ROUTER_PDA_PUBKEY, USDC_MINT_PUBKEY))
    if PAYMENT_ROUTER_PDA_PUBKEY and USDC_MINT_PUBKEY
    else None
)
PAYMENT_ROUTER_WAUDIO_ATA_ADDRESS = (
    str(get_associated_token_address(PAYMENT_ROUTER_PDA_PUBKEY, WAUDIO_MINT_PUBKEY))
    if PAYMENT_ROUTER_PDA_PUBKEY and WAUDIO_MINT_PUBKEY
    else None
)

# The amount of USDC that represents one USD cent
USDC_PER_USD_CENT = 10000

# Used to limit tx history if needed
MIN_SLOT = int(shared_config["solana"]["payment_router_min_slot"])
INITIAL_FETCH_SIZE = 10

# Used to find the correct accounts for sender/receiver in the transaction and the PaymentRouterPDA
TRANSFER_INSTRUCTION_SENDER_ACCOUNT_INDEX = 0
TRANSFER_INSTRUCTION_MINT_ACCOUNT_INDEX = 1
TRANSFER_INSTRUCTION_RECEIVER_ACCOUNT_INDEX = 2  # Should be the PaymentRouterPDA

ROUTE_INSTRUCTION_SENDER_INDEX = 0
# This should be an account owned by the PaymentRouterPDA
ROUTE_INSTRUCTION_PAYMENT_ROUTER_PDA_INDEX = 1
ROUTE_INSTRUCTION_SPL_TOKEN_PROGRAM_INDEX = 2
# Everything after this index is a receiver account
ROUTE_INSTRUCTION_RECEIVER_ACCOUNTS_START_INDEX = 3


class ReceiverUserAccount(TypedDict):
    user_id: int
    user_bank_account: str


class PurchaseMetadataDict(TypedDict):
    price: int
    splits: dict[str, int]
    type: PurchaseType
    id: int
    purchaser_user_id: int
    content_owner_id: int


def check_config():
    if not all([WAUDIO_MINT_PUBKEY, USDC_MINT_PUBKEY, PAYMENT_ROUTER_PUBKEY]):
        logger.error(
            f"index_payment_router.py | Missing required configuration"
            f"WAUDIO_MINT_PUBKEY: {WAUDIO_MINT_PUBKEY} USDC_MINT_PUBKEY: {USDC_MINT_PUBKEY} PAYMENT_ROUTER_PUBKEY: {PAYMENT_ROUTER_PUBKEY}- exiting."
        )
        return False
    return True


def get_sol_tx_info(
    solana_client_manager: SolanaClientManager,
    tx_sig: str,
):
    try:
        tx_info = solana_client_manager.get_sol_tx_info(tx_sig)
        return (tx_info, tx_sig)
    except SolanaTransactionFetchError:
        return None


def get_track_owner_id(session: Session, track_id: int) -> Optional[int]:
    """Gets the owner of a track"""
    track_owner_id = (
        session.query(Track.owner_id).filter(Track.track_id == track_id).first()
    )
    if track_owner_id is not None:
        return track_owner_id[0]
    else:
        return None


# Return highest payment router slot that has been processed
def get_highest_payment_router_tx_slot(session: Session):
    slot = MIN_SLOT
    tx_query = (
        session.query(PaymentRouterTx.slot).order_by(desc(PaymentRouterTx.slot))
    ).first()
    if tx_query:
        slot = tx_query[0]
    return slot


# Cache the latest value committed to DB in redis
# Used for quick retrieval in health check
def cache_latest_sol_payment_router_db_tx(redis: Redis, tx):
    cache_latest_sol_db_tx(redis, latest_sol_payment_router_db_tx_key, tx)


# Query a tx signature and confirm its existence
def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    exists = False
    tx_sig_db_count = (
        session.query(PaymentRouterTx).filter(PaymentRouterTx.signature == tx_sig)
    ).count()
    exists = tx_sig_db_count > 0
    return exists


def get_purchase_metadata_from_memo(
    session: Session, memos: List[str], timestamp: datetime
) -> Union[PurchaseMetadataDict, None]:
    """Checks the list of memos for one matching the format of a purchase's content_metadata, and then uses that content_metadata to find the premium_conditions associated with that content to get the price"""
    for memo in memos:
        try:
            content_metadata = memo.split(":")
            if len(content_metadata) == 4:
                (
                    type_str,
                    id_str,
                    blocknumber_str,
                    purchaser_user_id_str,
                ) = content_metadata
                type = PurchaseType[type_str.lower()]
                id = int(id_str)
                purchaser_user_id = int(purchaser_user_id_str)
                blocknumber = int(blocknumber_str)

                # TODO: Wait for blocknumber to be indexed by ACDC
                logger.debug(
                    f"index_payment_router.py | Found content_metadata in memo: type={type}, id={id}, blocknumber={blocknumber} user_id={purchaser_user_id}"
                )
                price = None
                splits = None
                content_owner_id = None
                if type == PurchaseType.track:
                    env = shared_config["discprov"]["env"]
                    content_owner_id = get_track_owner_id(session, id)
                    if content_owner_id is None:
                        logger.error(
                            f"index_payment_router.py | Couldn't find content owner for track_id={id}"
                        )
                        continue
                    query = session.query(TrackPriceHistory)
                    if env != "dev":
                        # In local stack, the blocktime of solana-test-validator is offset.
                        # The start time of the validator is baked into the prebuilt container.
                        # So if the container was built on 7/15, but you upped the container on 7/22, the blocktimes will still say 7/15 and be way behind.
                        # To remedy this locally would require getting the start time of the solana-test-validator container and getting its offset compared to when
                        # the the validator thinks the beginning of time is, and that's just too much work so I'm just not adding the blocktime filter in local dev
                        query.filter(TrackPriceHistory.block_timestamp < timestamp)
                    result = (
                        query.filter(
                            TrackPriceHistory.track_id == id,
                        )
                        .order_by(desc(TrackPriceHistory.block_timestamp))
                        .first()
                    )
                    if result is not None:
                        price = result.total_price_cents
                        splits = result.splits
                else:
                    logger.error(
                        f"index_payment_router.py | Unknown content type {type}"
                    )
                if (
                    price is not None
                    and splits is not None
                    and isinstance(splits, dict)
                    and content_owner_id is not None
                ):
                    return {
                        "type": type,
                        "id": id,
                        "price": price * USDC_PER_USD_CENT,
                        "splits": splits,
                        "purchaser_user_id": purchaser_user_id,
                        "content_owner_id": content_owner_id,
                    }
                else:
                    logger.error(
                        f"index_payment_router.py | Couldn't find relevant price for {content_metadata}"
                    )
            else:
                logger.debug(
                    f"index_payment_router.py | Ignoring memo, no content metadata found: {memo}"
                )
        except (ValueError, KeyError) as e:
            logger.debug(
                f"index_payment_router.py | Ignoring memo, failed to parse content metadata: {memo}, Error: {e}"
            )
    logger.error("index_payment_router.py | Failed to find any content metadata")
    return None


def validate_purchase(
    purchase_metadata: PurchaseMetadataDict, balance_changes: dict[str, BalanceChange]
):
    """Validates the user has correctly constructed the transaction in order to create the purchase, including validating they paid the full price at the time of the purchase, and that payments were appropriately split"""
    # Check that the recipients all got the correct split
    for account, split in purchase_metadata["splits"].items():
        if account not in balance_changes or balance_changes[account]["change"] < split:
            logger.error(
                f"index_payment_router.py | Incorrect split given to account={account} amount={balance_changes[account]['change']} expected={split}"
            )
            return False
    return True


def index_purchase(
    session: Session,
    receiver_user_accounts: List[ReceiverUserAccount],
    receiver_accounts: List[str],
    balance_changes: dict[str, BalanceChange],
    purchase_metadata: PurchaseMetadataDict,
    slot: int,
    timestamp: datetime,
    tx_sig: str,
):
    # Detect "pay extra" amount (difference between total balance change across
    # all recipients and the purchase price)
    receiver_changes = [
        balance_changes[account]["change"] for account in receiver_accounts
    ]
    extra_amount = max(0, sum(receiver_changes) - purchase_metadata["price"])
    usdc_purchase = USDCPurchase(
        slot=slot,
        signature=tx_sig,
        seller_user_id=purchase_metadata["content_owner_id"],
        buyer_user_id=purchase_metadata["purchaser_user_id"],
        amount=purchase_metadata["price"],
        extra_amount=extra_amount,
        content_type=purchase_metadata["type"],
        content_id=purchase_metadata["id"],
    )
    logger.debug(
        f"index_payment_router.py | Creating usdc_purchase for purchase {usdc_purchase}"
    )
    session.add(usdc_purchase)

    for user_account in receiver_user_accounts:
        balance_change = balance_changes[user_account["user_bank_account"]]
        usdc_tx_received = USDCTransactionsHistory(
            user_bank=user_account["user_bank_account"],
            slot=slot,
            signature=tx_sig,
            transaction_type=USDCTransactionType.purchase_content,
            method=USDCTransactionMethod.receive,
            transaction_created_at=timestamp,
            change=Decimal(balance_change["change"]),
            balance=Decimal(balance_change["post_balance"]),
            tx_metadata=str(purchase_metadata["purchaser_user_id"]),
        )
        session.add(usdc_tx_received)
        logger.debug(
            f"index_payment_router.py | Creating usdc_tx_history received tx for purchase {usdc_tx_received}"
        )


def validate_and_index_usdc_transfers(
    session: Session,
    sender_account: str,
    receiver_user_accounts: List[ReceiverUserAccount],
    receiver_accounts: List[str],
    balance_changes: dict[str, BalanceChange],
    purchase_metadata: Union[PurchaseMetadataDict, None],
    slot: int,
    timestamp: datetime,
    tx_sig: str,
):
    """Checks if the transaction is a valid purchase and if so creates the purchase record. Otherwise, indexes a transfer."""
    if purchase_metadata is not None and validate_purchase(
        purchase_metadata=purchase_metadata, balance_changes=balance_changes
    ):
        index_purchase(
            session=session,
            receiver_user_accounts=receiver_user_accounts,
            receiver_accounts=receiver_accounts,
            balance_changes=balance_changes,
            purchase_metadata=purchase_metadata,
            slot=slot,
            timestamp=timestamp,
            tx_sig=tx_sig,
        )
    # For invalid purchases or transfers not related to a purchase, we'll index
    # it as a regular transfer, though it will always show as being sent from
    # the payment router PDA
    # TODO: We _could_ receive the actual sender from the first tranfer instruction here
    # and use that instead.
    else:
        # TODO: Detect transfers _out_ of user banks to payment router and index them
        # here as "sent" transactions
        for user_account in receiver_user_accounts:
            balance_change = balance_changes[user_account["user_bank_account"]]
            usdc_tx_received = USDCTransactionsHistory(
                user_bank=user_account["user_bank_account"],
                slot=slot,
                signature=tx_sig,
                transaction_type=USDCTransactionType.transfer,
                method=USDCTransactionMethod.receive,
                transaction_created_at=timestamp,
                change=Decimal(balance_change["change"]),
                balance=Decimal(balance_change["post_balance"]),
                tx_metadata=sender_account,
            )
            session.add(usdc_tx_received)
            logger.debug(
                f"index_payment_router.py | Creating transfer received tx {usdc_tx_received}"
            )


def process_route_instruction(
    session: Session,
    instruction: CompiledInstruction,
    memos: List[str],
    account_keys: List[str],
    meta: UiTransactionStatusMeta,
    tx_sig: str,
    slot: int,
    challenge_event_bus: ChallengeEventBus,
    timestamp: datetime,
):
    # Route instructions have a varying number of receiver accounts but they are always
    # at the end
    receiver_accounts = [
        account_keys[i]
        for i in instruction.accounts[ROUTE_INSTRUCTION_RECEIVER_ACCOUNTS_START_INDEX:]
    ]

    sender_pda_account = account_keys[
        get_account_index(instruction, ROUTE_INSTRUCTION_PAYMENT_ROUTER_PDA_INDEX)
    ]

    sender_address = account_keys[
        get_account_index(instruction, ROUTE_INSTRUCTION_SENDER_INDEX)
    ]

    is_audio = sender_address == PAYMENT_ROUTER_WAUDIO_ATA_ADDRESS
    is_usdc = sender_address == PAYMENT_ROUTER_USDC_ATA_ADDRESS

    user_id_accounts = []

    if is_audio:
        logger.info(
            "index_payment_router.py | $AUDIO payment router transactions are not yet indexed. Skipping balance refresh"
        )
    elif is_usdc:
        user_id_accounts = (
            session.query(User.user_id, USDCUserBankAccount.bank_account)
            .join(
                USDCUserBankAccount,
                and_(
                    USDCUserBankAccount.bank_account.in_(receiver_accounts),
                    USDCUserBankAccount.ethereum_address == User.wallet,
                ),
            )
            .all()
        )
        # Payment Router recipients may not be Audius user banks
        if not user_id_accounts:
            logger.info(
                f"index_payment_router.py | No receiver accounts are user banks | {str(receiver_accounts)}"
            )
    else:
        logger.error(
            f"index_payment_router.py | Unrecognized source ATA {sender_address}. Expected AUDIO={PAYMENT_ROUTER_WAUDIO_ATA_ADDRESS} or USDC={PAYMENT_ROUTER_USDC_ATA_ADDRESS}"
        )
        return

    receiver_user_accounts: List[ReceiverUserAccount] = []
    for user_id_account in user_id_accounts:
        if user_id_account[1] in receiver_accounts:
            receiver_user_accounts.append(
                {
                    "user_id": user_id_account[0],
                    "user_bank_account": user_id_account[1],
                }
            )

    balance_changes = get_solana_tx_token_balance_changes(
        account_keys=account_keys, meta=meta
    )

    # TODO: Adapt this to detecting external transfers via payment router. It would require that
    # we have already parsed the sender of the TransferChecked instruction _before_ the Route
    # instruction and have passed that into this function. Then we could create a
    # TranscationType.Transfer w/ the external addresess listed.

    if is_audio:
        logger.warning(
            "index_payment_router.py | $AUDIO payment router transactions are not yet indexed. Skipping instruction indexing."
        )
    elif is_usdc:
        # Index as a purchase of some content
        purchase_metadata = get_purchase_metadata_from_memo(
            session=session, memos=memos, timestamp=timestamp
        )
        validate_and_index_usdc_transfers(
            session=session,
            sender_account=sender_pda_account,
            receiver_user_accounts=receiver_user_accounts,
            receiver_accounts=receiver_accounts,
            balance_changes=balance_changes,
            purchase_metadata=purchase_metadata,
            slot=slot,
            timestamp=timestamp,
            tx_sig=tx_sig,
        )

        # We can have a USDC payment router transfer with no purchase attached
        if purchase_metadata is None:
            logger.info(
                f"index_payment_router.py | No purchase metadata found on {tx_sig}"
            )
            return

        sender_user_id = purchase_metadata["purchaser_user_id"]
        amount = int(round(purchase_metadata["price"]) / 10**USDC_DECIMALS)
        challenge_event_bus.dispatch(
            ChallengeEvent.audio_matching_buyer,
            slot,
            sender_user_id,
            {"track_id": purchase_metadata["id"], "amount": amount},
        )
        challenge_event_bus.dispatch(
            ChallengeEvent.audio_matching_seller,
            slot,
            purchase_metadata["content_owner_id"],
            {
                "track_id": purchase_metadata["id"],
                "sender_user_id": sender_user_id,
                "amount": amount,
            },
        )


def process_payment_router_tx_details(
    session: Session,
    redis: Redis,
    tx_info: GetTransactionResp,
    tx_sig,
    timestamp,
    challenge_event_bus: ChallengeEventBus,
):
    logger.debug(f"index_payment_router.py | Processing tx={tx_info.to_json()}")
    result = tx_info.value
    if not result:
        logger.error("index_payment_router.py | No result")
        return
    meta = result.transaction.meta
    if not meta:
        logger.error("index_payment_router.py | No result meta")
        return
    error = meta.err
    if error:
        logger.error(
            f"index_payment_router.py | Skipping error transaction from chain {tx_info}"
        )
        return
    transaction = result.transaction.transaction
    if not hasattr(transaction, "message"):
        logger.error(
            f"index_payment_router.py | No transaction message found {transaction}"
        )
        return

    tx_message = cast(Message, transaction.message)
    account_keys = list(map(lambda x: str(x), transaction.message.account_keys))

    # Check for valid instruction
    has_route_instruction = has_log(meta, "Program log: Instruction: Route")

    instruction = get_valid_instruction(tx_message, meta, PAYMENT_ROUTER_ADDRESS)
    if instruction is None:
        logger.error(f"index_payment_router.py | {tx_sig} No Valid instruction found")
        return

    # TODO: Parse existing TransferChecked instruction first to get the address which sent
    # money _into_ the payment router. This will be necessary to correctly index
    # external transfers via Payment Router from a userbank.

    if has_route_instruction:
        process_route_instruction(
            session=session,
            instruction=instruction,
            memos=decode_all_solana_memos(tx_message=tx_message),
            account_keys=account_keys,
            meta=meta,
            tx_sig=tx_sig,
            slot=result.slot,
            challenge_event_bus=challenge_event_bus,
            timestamp=timestamp,
        )


def process_payment_router_txs() -> None:
    solana_client_manager: SolanaClientManager = (
        index_payment_router.solana_client_manager
    )
    challenge_bus: ChallengeEventBus = index_payment_router.challenge_event_bus
    db = index_payment_router.db
    redis = index_payment_router.redis
    logger.info("index_payment_router.py | Acquired lock")

    # Exit if required configs are not found
    if not check_config():
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = None
    latest_global_slot = None

    # Loop exit condition
    intersection_found = False
    is_initial_fetch = True

    # Get the latest slot available globally before fetching txs to keep track of indexing progress
    try:
        latest_global_slot = solana_client_manager.get_slot()
    except Exception as e:
        logger.error(f"index_payment_router.py | Failed to get block height | {e}")
        return

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_highest_payment_router_tx_slot(session)
        logger.info(f"index_payment_router.py | high tx = {latest_processed_slot}")
        while not intersection_found:
            fetch_size = (
                INITIAL_FETCH_SIZE
                if is_initial_fetch
                else FETCH_TX_SIGNATURES_BATCH_SIZE
            )
            logger.info(
                f"index_payment_router.py | Requesting {fetch_size} transactions for {PAYMENT_ROUTER_ADDRESS} before {last_tx_signature}"
            )
            transactions_history = solana_client_manager.get_signatures_for_address(
                PAYMENT_ROUTER_ADDRESS, before=last_tx_signature, limit=fetch_size
            )
            is_initial_fetch = False
            transactions_array = transactions_history.value
            if not transactions_array:
                intersection_found = True
                logger.info(
                    f"index_payment_router.py | No transactions found before {last_tx_signature}"
                )
            else:
                # Current batch of transactions
                transaction_signature_batch = []
                for transaction_with_signature in transactions_array:
                    tx_sig = str(transaction_with_signature.signature)
                    tx_slot = transaction_with_signature.slot
                    logger.debug(
                        f"index_payment_router.py | Processing tx={tx_sig} | slot={tx_slot}"
                    )
                    if transaction_with_signature.slot > latest_processed_slot:
                        transaction_signature_batch.append(tx_sig)
                    elif (
                        transaction_with_signature.slot <= latest_processed_slot
                        and transaction_with_signature.slot > MIN_SLOT
                    ):
                        # Check the tx signature for any txs in the latest batch,
                        # and if not present in DB, add to processing
                        logger.info(
                            f"index_payment_router.py | Latest slot re-traversal\
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
                last_tx_signature = transactions_array[-1].signature

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
                        f"index_payment_router.py | sliced tx_sigs from {prev_len} to {len(transaction_signatures)} entries"
                    )

        # Reverse batches aggregated so oldest transactions are processed first
        transaction_signatures.reverse()

        last_tx_sig: Optional[str] = None
        last_tx = None
        if transaction_signatures and transaction_signatures[-1]:
            last_tx_sig = transaction_signatures[-1][0]

        num_txs_processed = 0
        for tx_sig_batch in transaction_signatures:
            logger.info(f"index_payment_router.py | processing {tx_sig_batch}")
            batch_start_time = time.time()

            tx_infos: List[Tuple[GetTransactionResp, str]] = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                parse_sol_tx_futures = {
                    executor.submit(
                        get_sol_tx_info,
                        solana_client_manager,
                        str(tx_sig),
                    ): tx_sig
                    for tx_sig in tx_sig_batch
                }
                for future in concurrent.futures.as_completed(parse_sol_tx_futures):
                    try:
                        tx_info = future.result()
                        if not tx_info:
                            continue
                        tx_infos.append(tx_info)
                    except Exception as exc:
                        logger.error(
                            f"index_payment_router.py | error {exc}", exc_info=True
                        )
                        raise

            # Sort by slot
            # Note: while it's possible (even likely) to have multiple tx in the same slot,
            # these transactions can't be dependent on one another, so we don't care which order
            # we process them.
            # TODO: Consider sorting by _some_ deterministic key to make sure all nodes
            # are processing transactions in the same order.
            tx_infos.sort(key=lambda info: info[0].value.slot if info[0].value else 0)

            for tx_info, tx_sig in tx_infos:
                if tx_info and last_tx_sig and last_tx_sig == tx_sig:
                    last_tx = tx_info.value
                num_txs_processed += 1

                tx_value = tx_info.value
                if tx_value is None:
                    raise Exception(f"No txinfo value {tx_info}")

                tx_slot = tx_value.slot
                timestamp = float(tx_value.block_time or 0)
                parsed_timestamp = datetime.utcfromtimestamp(timestamp)

                logger.debug(
                    f"index_payment_router.py | parse_payment_router_transaction |\
                {tx_slot}, {tx_sig} | {tx_info} | {parsed_timestamp}"
                )

                process_payment_router_tx_details(
                    session, redis, tx_info, tx_sig, parsed_timestamp, challenge_bus
                )

                session.add(
                    PaymentRouterTx(
                        signature=str(tx_sig),
                        slot=tx_slot,
                        created_at=parsed_timestamp,
                    )
                )

            batch_end_time = time.time()
            batch_duration = batch_end_time - batch_start_time
            logger.info(
                f"index_payment_router.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
            )

    if last_tx and last_tx_sig:
        cache_latest_sol_payment_router_db_tx(
            redis,
            {
                "signature": last_tx_sig,
                "slot": last_tx.slot,
                "timestamp": last_tx.block_time,
            },
        )
    if last_tx:
        redis.set(latest_sol_payment_router_slot_key, last_tx.slot)
    elif latest_global_slot is not None:
        redis.set(latest_sol_payment_router_slot_key, latest_global_slot)


# ####### CELERY TASKS ####### #
@celery.task(name="index_payment_router", bind=True)
@save_duration_metric(metric_group="celery_task")
def index_payment_router(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = index_payment_router.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("payment_router_lock", timeout=10 * 60)

    try:
        # Cache latest tx outside of lock
        fetch_and_cache_latest_program_tx_redis(
            index_payment_router.solana_client_manager,
            redis,
            PAYMENT_ROUTER_ADDRESS,
            latest_sol_payment_router_program_tx_key,
        )
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            challenge_bus: ChallengeEventBus = index_payment_router.challenge_event_bus
            with challenge_bus.use_scoped_dispatch_queue():
                process_payment_router_txs()
        else:
            logger.info("index_payment_router.py | Failed to acquire lock")

    except Exception as e:
        logger.error(
            "index_payment_router.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
