import concurrent.futures
import enum
import json
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, TypedDict, cast

from redis import Redis
from solders.instruction import CompiledInstruction
from solders.message import Message
from solders.pubkey import Pubkey
from solders.rpc.responses import GetTransactionResp
from solders.token.associated import get_associated_token_address
from solders.transaction_status import UiTransactionStatusMeta
from sqlalchemy import and_, desc
from sqlalchemy.orm.session import Session

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.exceptions import SolanaTransactionFetchError
from src.models.playlists.album_price_history import AlbumPriceHistory
from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.models.tracks.track_price_history import TrackPriceHistory
from src.models.users.payment_router import PaymentRouterTx
from src.models.users.usdc_purchase import (
    PurchaseAccessType,
    PurchaseType,
    PurchaseVendor,
    USDCPurchase,
)
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount
from src.queries.get_extended_purchase_gate import (
    ExtendedSplit,
    add_wallet_info_to_splits,
    calculate_split_amounts,
    to_wallet_amount_map,
)
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
    USDC_DECIMALS,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_helpers import get_base_address
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import (
    BalanceChange,
    decode_all_solana_memos,
    get_account_index,
    get_account_owner_from_balance_change,
    get_solana_tx_token_balance_changes,
    get_valid_instruction,
    has_log,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_cache import get_solana_transaction_key
from src.utils.redis_constants import redis_keys
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)

# Populate values used in indexing from config
PAYMENT_ROUTER_ADDRESS = shared_config["solana"]["payment_router_program_address"]
COINFLOW_PROGRAM_ADDRESS = shared_config["solana"]["coinflow_program_address"]
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

RECOVERY_MEMO_STRING = "Recover Withdrawal"
GEO_MEMO_STRING = "geo:"

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


class UserIdBankAccount(TypedDict):
    user_id: int
    user_bank_account: str


class PurchaseMetadataDict(TypedDict):
    price: int
    splits: List[ExtendedSplit]
    type: PurchaseType
    id: int
    purchaser_user_id: int
    content_owner_id: int
    access: PurchaseAccessType


class GeoMetadataDict(TypedDict):
    city: str
    region: str
    country: str


class RouteTransactionMemoType(str, enum.Enum):
    purchase = "purchase"
    recovery = "recovery"
    unknown = "unknown"


class RouteTransactionMemo(TypedDict):
    type: RouteTransactionMemoType
    metadata: PurchaseMetadataDict | None


def check_config():
    if not all([WAUDIO_MINT_PUBKEY, USDC_MINT_PUBKEY, PAYMENT_ROUTER_PUBKEY]):
        logger.error(
            f"index_payment_router.py | Missing required configuration"
            f"WAUDIO_MINT_PUBKEY: {WAUDIO_MINT_PUBKEY} USDC_MINT_PUBKEY: {USDC_MINT_PUBKEY} PAYMENT_ROUTER_PUBKEY: {PAYMENT_ROUTER_PUBKEY}- exiting."
        )
        return False
    return True


def get_sol_tx_info(
    solana_client_manager: SolanaClientManager, tx_sig: str, redis: Redis
):
    try:
        existing_tx = redis.get(get_solana_transaction_key(tx_sig))
        if existing_tx is not None and existing_tx != "":
            logger.debug(f"index_payment_router.py | Cache hit: {tx_sig}")
            tx_info = GetTransactionResp.from_json(existing_tx.decode("utf-8"))
            return (tx_info, tx_sig)
        logger.debug(f"index_payment_router.py | Cache miss: {tx_sig}")
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


def get_playlist_owner_id(session: Session, playlist_id: int) -> Optional[int]:
    """Gets the owner of a playlist"""
    playlist_owner_id = (
        session.query(Playlist.playlist_owner_id)
        .filter(Playlist.playlist_id == playlist_id)
        .first()
    )
    if playlist_owner_id is not None:
        return playlist_owner_id[0]
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


# Query a tx signature and confirm its existence
def get_tx_in_db(session: Session, tx_sig: str) -> bool:
    exists = False
    tx_sig_db_count = (
        session.query(PaymentRouterTx).filter(PaymentRouterTx.signature == tx_sig)
    ).count()
    exists = tx_sig_db_count > 0
    return exists


def parse_route_transaction_memos(
    session: Session, memos: List[str], timestamp: datetime
) -> Tuple[RouteTransactionMemo | None, GeoMetadataDict | None]:
    """Checks the list of memos for one matching a format of a purchase's content_metadata, and then uses that content_metadata to find the stream_conditions associated with that content to get the price"""
    if len(memos) == 0:
        return None, None

    route_transaction_memo = None
    geo_memo = None

    for memo in memos:
        try:
            if memo == RECOVERY_MEMO_STRING:
                route_transaction_memo = RouteTransactionMemo(
                    type=RouteTransactionMemoType.recovery, metadata=None
                )
                continue
            if memo.startswith(GEO_MEMO_STRING):
                geo_data = json.loads(memo.replace(GEO_MEMO_STRING, ""))
                if not geo_data:
                    logger.warn(
                        f"index_payment_router.py | No geo data found in geo memo: {memo}"
                    )
                    continue
                city = geo_data.get("city")
                region = geo_data.get("region")
                country = geo_data.get("country")
                if not country:
                    logger.warn(
                        f"index_payment_router.py | No country found in geo memo: {memo}"
                    )
                    continue
                geo_memo = GeoMetadataDict(
                    {
                        "city": city,
                        "region": region,
                        "country": country,
                    }
                )
                continue

            content_metadata = memo.split(":")
            if len(content_metadata) == 4:
                (
                    type_str,
                    id_str,
                    blocknumber_str,
                    purchaser_user_id_str,
                ) = content_metadata
                access_str = "stream"  # Default to stream access
            elif len(content_metadata) == 5:
                (
                    type_str,
                    id_str,
                    blocknumber_str,
                    purchaser_user_id_str,
                    access_str,
                ) = content_metadata
            else:
                logger.warn(
                    f"index_payment_router.py | Ignoring memo, no content metadata found: {memo}"
                )

            type = PurchaseType[type_str.lower()]
            id = int(id_str)
            purchaser_user_id = int(purchaser_user_id_str)
            blocknumber = int(blocknumber_str)
            access = PurchaseAccessType[access_str.lower()]

            # TODO: Wait for blocknumber to be indexed by ACDC
            logger.debug(
                f"index_payment_router.py | Found content_metadata in memo: type={type}, id={id}, blocknumber={blocknumber} user_id={purchaser_user_id} access={access}"
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
                        TrackPriceHistory.access == access,
                    )
                    .order_by(desc(TrackPriceHistory.block_timestamp))
                    .first()
                )
                if result is not None:
                    price = result.total_price_cents
                    splits = result.splits
            elif type == PurchaseType.album:
                env = shared_config["discprov"]["env"]
                content_owner_id = get_playlist_owner_id(session, id)
                if content_owner_id is None:
                    logger.error(
                        f"index_payment_router.py | Couldn't find content owner for playlist_id={id}"
                    )
                    continue
                query = session.query(AlbumPriceHistory)
                if env != "dev":
                    # See above comment
                    query.filter(AlbumPriceHistory.block_timestamp < timestamp)
                result = (
                    query.filter(AlbumPriceHistory.playlist_id == id)
                    .order_by(desc(AlbumPriceHistory.block_timestamp))
                    .first()
                )
                if result is not None:
                    price = result.total_price_cents
                    splits = result.splits
            else:
                logger.error(f"index_payment_router.py | Unknown content type {type}")

            if (
                price is not None
                and splits is not None
                and isinstance(splits, list)
                and content_owner_id is not None
            ):
                wallet_splits = add_wallet_info_to_splits(session, splits, timestamp)
                extended_splits = calculate_split_amounts(price, wallet_splits)
                route_transaction_memo = RouteTransactionMemo(
                    type=RouteTransactionMemoType.purchase,
                    metadata={
                        "type": type,
                        "id": id,
                        "price": price * USDC_PER_USD_CENT,
                        "splits": extended_splits,
                        "purchaser_user_id": purchaser_user_id,
                        "content_owner_id": content_owner_id,
                        "access": access,
                    },
                )
                continue
            else:
                logger.error(
                    f"index_payment_router.py | Couldn't find relevant price for {content_metadata}."
                )
        except (ValueError, KeyError) as e:
            logger.error(
                f"index_payment_router.py | Ignoring memo, failed to parse content metadata: {memo}, Error: {e}"
            )
    logger.warn("index_payment_router.py | Failed to find known memo format")
    if not route_transaction_memo:
        route_transaction_memo = RouteTransactionMemo(
            type=RouteTransactionMemoType.unknown, metadata=None
        )

    return route_transaction_memo, geo_memo


def validate_purchase(
    purchase_metadata: PurchaseMetadataDict, balance_changes: dict[str, BalanceChange]
):
    """Validates the user has correctly constructed the transaction in order to create the purchase, including validating they paid the full price at the time of the purchase, and that payments were appropriately split"""
    # Check that the recipients all got the correct split
    splits = to_wallet_amount_map(purchase_metadata["splits"])
    for account, split in splits.items():
        if account not in balance_changes:
            logger.error(
                f"index_payment_router.py | No split given to account={account}, expected={split}"
            )
            return False
        if balance_changes[account]["change"] < split:
            logger.error(
                f"index_payment_router.py | Incorrect split given to account={account} amount={balance_changes[account]['change']} expected={split}"
            )
            return False
    return True


def index_purchase(
    session: Session,
    sender_user_account: UserIdBankAccount | None,
    receiver_user_accounts: List[UserIdBankAccount],
    receiver_accounts: List[str],
    balance_changes: dict[str, BalanceChange],
    purchase_metadata: PurchaseMetadataDict,
    geo_metadata: GeoMetadataDict | None,
    slot: int,
    timestamp: datetime,
    tx_sig: str,
    vendor: PurchaseVendor,
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
        access=purchase_metadata["access"],
        city=geo_metadata.get("city") if geo_metadata else None,
        region=geo_metadata.get("region") if geo_metadata else None,
        country=geo_metadata.get("country") if geo_metadata else None,
        vendor=vendor,
        splits=purchase_metadata["splits"],
    )
    logger.debug(
        f"index_payment_router.py | tx: {tx_sig} | Creating usdc_purchase for purchase {usdc_purchase}"
    )
    session.add(usdc_purchase)

    receiver_set = set()

    for user_account in receiver_user_accounts:
        if user_account["user_bank_account"] in receiver_set:
            logger.warn(
                f"index_payment_router.py | tx: {tx_sig} | Duplicate recipient found. Possible duplicate user record for user ID: {user_account['user_id']} address: {user_account['user_bank_account']}"
            )
            continue
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
        receiver_set.add(user_account["user_bank_account"])
        session.add(usdc_tx_received)
        logger.debug(
            f"index_payment_router.py | tx: {tx_sig} | Created usdc_tx_history received tx for purchase {usdc_tx_received}"
        )
    # If the sender for this transaction was a user bank, index the transaction for that
    # user bank as well
    if sender_user_account is not None:
        balance_change = balance_changes[sender_user_account["user_bank_account"]]
        usdc_tx_sent = USDCTransactionsHistory(
            user_bank=sender_user_account["user_bank_account"],
            slot=slot,
            signature=tx_sig,
            transaction_type=USDCTransactionType.purchase_content,
            method=USDCTransactionMethod.send,
            transaction_created_at=timestamp,
            change=Decimal(balance_change["change"]),
            balance=Decimal(balance_change["post_balance"]),
            tx_metadata=str(purchase_metadata["content_owner_id"]),
        )
        session.add(usdc_tx_sent)
        logger.debug(
            f"index_payment_router.py | tx: {tx_sig} | Created usdc_tx_history sent tx for purchase {usdc_tx_sent}"
        )


def index_transfer(
    session: Session,
    sender_account: str,
    sender_user_account: UserIdBankAccount | None,
    receiver_user_accounts: List[UserIdBankAccount],
    receiver_accounts: List[str],
    transaction_type: USDCTransactionType,
    balance_changes: dict[str, BalanceChange],
    slot: int,
    timestamp: datetime,
    tx_sig: str,
):
    sender_metadata_address = sender_account
    # If sending account was a user bank, leave that as the address
    # Otherwise, map it to an owning solana wallet
    if sender_user_account is None:
        sender_metadata_address = (
            get_account_owner_from_balance_change(
                account=sender_account, balance_changes=balance_changes
            )
            or sender_account
        )
    for user_account in receiver_user_accounts:
        balance_change = balance_changes[user_account["user_bank_account"]]
        usdc_tx_received = USDCTransactionsHistory(
            user_bank=user_account["user_bank_account"],
            slot=slot,
            signature=tx_sig,
            transaction_type=transaction_type,
            method=USDCTransactionMethod.receive,
            transaction_created_at=timestamp,
            change=Decimal(balance_change["change"]),
            balance=Decimal(balance_change["post_balance"]),
            tx_metadata=sender_metadata_address,
        )
        session.add(usdc_tx_received)

        logger.debug(
            f"index_payment_router.py | tx: {tx_sig} | Creating {transaction_type} received tx {usdc_tx_received}"
        )
    # If sender was a user bank, index a single transfer with a list of recipients
    if sender_user_account is not None:
        balance_change = balance_changes[sender_user_account["user_bank_account"]]
        usdc_tx_received = USDCTransactionsHistory(
            user_bank=sender_user_account["user_bank_account"],
            slot=slot,
            signature=tx_sig,
            transaction_type=transaction_type,
            method=USDCTransactionMethod.send,
            transaction_created_at=timestamp,
            change=Decimal(balance_change["change"]),
            balance=Decimal(balance_change["post_balance"]),
            tx_metadata=",".join(receiver_accounts),
        )
        session.add(usdc_tx_received)
        logger.debug(
            f"index_payment_router.py | tx: {tx_sig} | Creating {transaction_type} sent tx {usdc_tx_received}"
        )


def validate_and_index_usdc_transfers(
    session: Session,
    sender_account: str,
    sender_user_account: UserIdBankAccount | None,
    receiver_user_accounts: List[UserIdBankAccount],
    receiver_accounts: List[str],
    balance_changes: dict[str, BalanceChange],
    memo: RouteTransactionMemo | None,
    geo_metadata: GeoMetadataDict | None,
    slot: int,
    timestamp: datetime,
    tx_sig: str,
    vendor: PurchaseVendor,
    challenge_event_bus: ChallengeEventBus,
):
    """Checks if the transaction is a valid purchase and if so creates the purchase record. Otherwise, indexes a transfer."""
    if (
        memo is not None
        and memo["type"] is RouteTransactionMemoType.purchase
        and memo["metadata"] is not None
        and validate_purchase(
            purchase_metadata=memo["metadata"], balance_changes=balance_changes
        )
    ):
        index_purchase(
            session=session,
            sender_user_account=sender_user_account,
            receiver_user_accounts=receiver_user_accounts,
            receiver_accounts=receiver_accounts,
            balance_changes=balance_changes,
            purchase_metadata=memo["metadata"],
            geo_metadata=geo_metadata,
            slot=slot,
            timestamp=timestamp,
            tx_sig=tx_sig,
            vendor=vendor,
        )

        # dispatch audio matching challenge events
        logger.debug(
            f"index_payment_router.py | tx: {tx_sig} | Purchase memo found. Dispatching challenge events"
        )
        purchase_metadata = memo["metadata"]
        sender_user_id = purchase_metadata["purchaser_user_id"]
        amount = int(round(purchase_metadata["price"]) / 10**USDC_DECIMALS)
        challenge_event_bus.dispatch(
            ChallengeEvent.audio_matching_buyer,
            slot,
            timestamp,
            sender_user_id,
            {"track_id": purchase_metadata["id"], "amount": amount},
        )
        challenge_event_bus.dispatch(
            ChallengeEvent.audio_matching_seller,
            slot,
            timestamp,
            purchase_metadata["content_owner_id"],
            {
                "track_id": purchase_metadata["id"],
                "sender_user_id": sender_user_id,
                "amount": amount,
            },
        )

    # For invalid purchases or transfers not related to a purchase, we'll index
    # it as a regular transfer from the sender_account.
    else:
        transaction_type = (
            USDCTransactionType.recover_withdrawal
            if memo is not None and memo["type"] is RouteTransactionMemoType.recovery
            else USDCTransactionType.transfer
        )
        index_transfer(
            session=session,
            sender_account=sender_account,
            sender_user_account=sender_user_account,
            receiver_user_accounts=receiver_user_accounts,
            receiver_accounts=receiver_accounts,
            balance_changes=balance_changes,
            transaction_type=transaction_type,
            slot=slot,
            timestamp=timestamp,
            tx_sig=tx_sig,
        )


def find_sender_account_from_balance_changes(balance_changes: dict[str, BalanceChange]):
    """Finds the sender account from the balance changes and receiver accounts"""
    min_change = 0
    sender = None
    for account, balance_change in balance_changes.items():
        if balance_change["change"] < min_change:
            sender = account
            min_change = balance_change["change"]
    return sender


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
    vendor: PurchaseVendor,
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

    route_source_address = account_keys[
        get_account_index(instruction, ROUTE_INSTRUCTION_SENDER_INDEX)
    ]

    is_audio = route_source_address == PAYMENT_ROUTER_WAUDIO_ATA_ADDRESS
    is_usdc = route_source_address == PAYMENT_ROUTER_USDC_ATA_ADDRESS

    balance_changes = get_solana_tx_token_balance_changes(
        account_keys=account_keys, meta=meta
    )

    # Detect the account which sent tokens _into_ payment router, as that's
    # our real source account
    sender_account = (
        find_sender_account_from_balance_changes(balance_changes=balance_changes)
        or sender_pda_account
    )

    user_id_accounts = []

    if is_audio:
        logger.warn(
            f"index_payment_router.py | tx: {tx_sig} | $AUDIO payment router transactions are not yet indexed. Skipping balance refresh"
        )
    elif is_usdc:
        search_accounts = (
            receiver_accounts + [sender_account]
            if sender_account is not None
            else receiver_accounts
        )
        user_id_accounts = (
            session.query(User.user_id, USDCUserBankAccount.bank_account)
            .join(
                USDCUserBankAccount,
                and_(
                    USDCUserBankAccount.bank_account.in_(search_accounts),
                    USDCUserBankAccount.ethereum_address == User.wallet,
                ),
            )
            .all()
        )
        # Payment Router recipients may not be Audius user banks
        if not user_id_accounts:
            logger.warn(
                f"index_payment_router.py | tx: {tx_sig} | No sender or receiver accounts are user banks | {str(search_accounts)}"
            )
    else:
        logger.error(
            f"index_payment_router.py | tx: {tx_sig} | Unrecognized source ATA {route_source_address}. Expected AUDIO={PAYMENT_ROUTER_WAUDIO_ATA_ADDRESS} or USDC={PAYMENT_ROUTER_USDC_ATA_ADDRESS}"
        )
        return

    receiver_user_accounts: List[UserIdBankAccount] = []
    sender_user_account: UserIdBankAccount | None = None
    for user_id, bank_account in user_id_accounts:
        if bank_account in receiver_accounts:
            receiver_user_accounts.append(
                {
                    "user_id": user_id,
                    "user_bank_account": bank_account,
                }
            )
        elif bank_account == sender_account:
            sender_user_account = {
                "user_id": user_id,
                "user_bank_account": bank_account,
            }

    if is_audio:
        logger.warning(
            f"index_payment_router.py | tx: {tx_sig} | $AUDIO payment router transactions are not yet indexed. Skipping instruction indexing."
        )
    elif is_usdc:
        logger.debug(f"index_payment_router.py | Parsing memos: {memos}")

        memo, geo_metadata = parse_route_transaction_memos(
            session=session, memos=memos, timestamp=timestamp
        )
        validate_and_index_usdc_transfers(
            session=session,
            sender_account=sender_account,
            sender_user_account=sender_user_account,
            receiver_user_accounts=receiver_user_accounts,
            receiver_accounts=receiver_accounts,
            balance_changes=balance_changes,
            memo=memo,
            geo_metadata=geo_metadata,
            slot=slot,
            timestamp=timestamp,
            tx_sig=tx_sig,
            vendor=vendor,
            challenge_event_bus=challenge_event_bus,
        )


def process_payment_router_tx_details(
    session: Session,
    tx_info: GetTransactionResp,
    tx_sig: str,
    timestamp: datetime,
    challenge_event_bus: ChallengeEventBus,
):
    logger.debug(f"index_payment_router.py | Processing tx={tx_info.to_json()}")
    result = tx_info.value
    if not result:
        logger.error("index_payment_router.py | tx: {tx_sig} | No result")
        return
    meta = result.transaction.meta
    if not meta:
        logger.error("index_payment_router.py | tx: {tx_sig} | No result meta")
        return
    error = meta.err
    if error:
        logger.error(
            f"index_payment_router.py | tx: {tx_sig} | Skipping error transaction from chain {tx_info}"
        )
        return
    transaction = result.transaction.transaction
    if not hasattr(transaction, "message"):
        logger.error(
            f"index_payment_router.py | tx: {tx_sig} | No transaction message found {transaction}"
        )
        return

    tx_message = cast(Message, transaction.message)
    account_keys = list(map(lambda x: str(x), transaction.message.account_keys))

    # Check for valid instruction
    has_route_instruction = has_log(meta, "Program log: Instruction: Route")

    instruction = get_valid_instruction(tx_message, meta, PAYMENT_ROUTER_ADDRESS)
    contains_conflow_instruction = get_valid_instruction(
        tx_message, meta, COINFLOW_PROGRAM_ADDRESS
    )
    if instruction is None:
        logger.error(
            f"index_payment_router.py | tx: {tx_sig} |  No Valid instruction found"
        )
        return

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
            vendor=(
                PurchaseVendor.coinflow
                if contains_conflow_instruction
                else PurchaseVendor.user_bank
            ),
        )


def process_payment_router_txs() -> None:
    solana_client_manager: SolanaClientManager = (
        index_payment_router.solana_client_manager
    )
    challenge_bus: ChallengeEventBus = index_payment_router.challenge_event_bus
    db = index_payment_router.db
    redis = index_payment_router.redis
    logger.debug("index_payment_router.py | Acquired lock")

    # Exit if required configs are not found
    if not check_config():
        return

    # List of signatures that will be populated as we traverse recent operations
    transaction_signatures = []

    last_tx_signature = None

    # Loop exit condition
    intersection_found = False
    is_initial_fetch = True

    # Query for solana transactions until an intersection is found
    with db.scoped_session() as session:
        latest_processed_slot = get_highest_payment_router_tx_slot(session)
        logger.debug(f"index_payment_router.py | high tx = {latest_processed_slot}")
        while not intersection_found:
            fetch_size = (
                INITIAL_FETCH_SIZE
                if is_initial_fetch
                else FETCH_TX_SIGNATURES_BATCH_SIZE
            )
            logger.debug(
                f"index_payment_router.py | Requesting {fetch_size} transactions for {PAYMENT_ROUTER_ADDRESS} before {last_tx_signature}"
            )
            transactions_history = solana_client_manager.get_signatures_for_address(
                PAYMENT_ROUTER_ADDRESS, before=last_tx_signature, limit=fetch_size
            )
            is_initial_fetch = False
            transactions_array = transactions_history.value
            if not transactions_array:
                intersection_found = True
                logger.debug(
                    f"index_payment_router.py | No transactions found before {last_tx_signature}"
                )
            else:
                # Current batch of transactions
                transaction_signature_batch = []
                for transaction_with_signature in transactions_array:
                    tx_sig = str(transaction_with_signature.signature)
                    tx_slot = transaction_with_signature.slot

                    if transaction_with_signature.err is not None:
                        logger.debug(
                            f"index_payment_router.py | Skipping error transaction tx={tx_sig} err={transaction_with_signature.err}"
                        )
                        continue

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
                        logger.debug(
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
                    logger.debug(
                        f"index_payment_router.py | sliced tx_sigs from {prev_len} to {len(transaction_signatures)} entries"
                    )

        # Reverse batches aggregated so oldest transactions are processed first
        transaction_signatures.reverse()

        last_tx_sig: Optional[str] = None
        if transaction_signatures and transaction_signatures[-1]:
            last_tx_sig = transaction_signatures[-1][0]

        num_txs_processed = 0
        for tx_sig_batch in transaction_signatures:
            logger.debug(f"index_payment_router.py | processing {tx_sig_batch}")
            batch_start_time = time.time()

            tx_infos: List[Tuple[GetTransactionResp, str]] = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                parse_sol_tx_futures = {
                    executor.submit(
                        get_sol_tx_info, solana_client_manager, str(tx_sig), redis
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
                    session, tx_info, tx_sig, parsed_timestamp, challenge_bus
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
            logger.debug(
                f"index_payment_router.py | processed batch {len(tx_sig_batch)} txs in {batch_duration}s"
            )

    if last_tx_sig:
        redis.set(redis_keys.solana.payment_router.last_tx, last_tx_sig)


# ####### CELERY TASKS ####### #
@celery.task(name="index_payment_router", rate_limit="5/s", time_limit=300, bind=True)
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
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            challenge_bus: ChallengeEventBus = index_payment_router.challenge_event_bus
            with challenge_bus.use_scoped_dispatch_queue():
                process_payment_router_txs()
            # Update latest completion
            redis.set(
                redis_keys.solana.payment_router.last_completed_at,
                datetime.now(timezone.utc).timestamp(),
            )
        else:
            logger.debug("index_payment_router.py | Failed to acquire lock")

    except Exception as e:
        logger.error(
            "index_payment_router.py | Fatal error in main loop", exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
        celery.send_task("index_payment_router", queue="index_sol")
