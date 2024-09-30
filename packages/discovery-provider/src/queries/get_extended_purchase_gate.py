import logging
from datetime import datetime
from typing import Dict, List, Optional, TypedDict, Union, cast

from sqlalchemy import and_, func
from sqlalchemy.orm import aliased
from sqlalchemy.orm.session import Session

from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount
from src.models.users.user_payout_wallet_history import UserPayoutWalletHistory
from src.utils.config import shared_config
from src.utils.db_session import get_db_read_replica
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)


class GetPurchaseInfoArgs(TypedDict):
    content_id: int
    content_type: str
    content: Union[Track, Playlist]


class Split(TypedDict):
    user_id: Optional[int]  # optional because staking bridge does not have user_id
    percentage: float


class USDCPurchaseCondition(TypedDict):
    price: int
    splits: List[Split]


class PurchaseGate(TypedDict):
    usdc_purchase: USDCPurchaseCondition


class ExtendedSplit(Split):
    amount: int
    payout_wallet: str
    eth_wallet: Optional[
        str
    ]  # optional because staking bridge does not have eth_wallet


class ExtendedUSDCPurchaseCondition(TypedDict):
    price: int | None
    splits: List[ExtendedSplit]


class ExtendedPurchaseGate(TypedDict):
    usdc_purchase: ExtendedUSDCPurchaseCondition


class LegacyUSDCPurchaseCondition(TypedDict):
    price: int
    splits: Dict[str, int]


class LegacyPurchaseGate(TypedDict):
    usdc_purchase: LegacyUSDCPurchaseCondition


class FollowGate(TypedDict):
    follow_user_id: int


class TipGate(TypedDict):
    tip_user_id: int


class NFTCollection(TypedDict):
    chain: str
    address: str
    name: str
    imageUrl: Optional[str]
    externalLink: Optional[str]


class NFTGate(TypedDict):
    nft_collection: NFTCollection


AccessGate = Union[PurchaseGate, FollowGate, TipGate, NFTGate]


# Allow up to 6 decimal points for split percentages
percentage_decimals = 6
percentage_multiplier = 10**percentage_decimals

cents_to_usdc_multiplier = 10**4

# Network take rate is a percentage of the total price that goes to the network
# It is denoted in the config as a whole number, e.g. 10 for 10%
network_take_rate_config = int(shared_config["solana"]["network_take_rate"])

staking_bridge_usdc_payout_wallet = shared_config["solana"][
    "staking_bridge_usdc_payout_wallet"
]


def calculate_split_amounts(
    price: int | None,
    splits: List[Split],
    network_take_rate=network_take_rate_config,
) -> List[ExtendedSplit]:
    """
    Deterministically calculates the USDC amounts to pay to each person,
    adjusting for rounding errors and ensuring the total matches the price.
    """
    if not price or not splits:
        return []

    price_in_usdc = int(cents_to_usdc_multiplier * price)
    running_total = 0
    new_splits: List[Dict] = []

    # Deduct network cut from the total price
    network_cut = int(price_in_usdc * network_take_rate / 100)
    price_in_usdc -= network_cut

    for index in range(len(splits)):
        split = splits[index]
        # multiply percentage to make it a whole number
        percentage_whole = int(split["percentage"] * percentage_multiplier)
        # do safe integer math on the price
        amount = percentage_whole * price_in_usdc
        # divide by the percentage multiplier afterward, and convert percent
        amount = amount / (percentage_multiplier * 100)
        # round towards zero, it'll round up later as necessary
        amount_in_usdc = int(amount)
        new_split: Dict = cast(dict, split)
        new_split["amount"] = amount_in_usdc
        # save the fractional component and index for rounding/sorting later
        new_split["_amount_fractional"] = amount - amount_in_usdc
        new_split["_index"] = index
        new_splits.append(new_split)
        running_total += amount_in_usdc
    # Resolve rounding errors by iteratively choosing the highest fractional
    # rounding errors to round up until the running total is correct
    new_splits.sort(key=lambda item: (-item["_amount_fractional"], item["amount"]))
    index = 0
    while running_total < price_in_usdc:
        new_splits[index]["amount"] += 1
        running_total += 1
        index = (index + 1) % len(new_splits)
    if running_total != price_in_usdc:
        raise Exception(
            f"Bad splits math: Expected {price_in_usdc} but got {running_total}. new_splits={new_splits}"
        )
    # sort back to original order
    new_splits.sort(key=lambda item: item["_index"])
    for s in new_splits:
        del s["_index"]
        del s["_amount_fractional"]

    # append network cut
    new_splits.append(
        {
            "percentage": network_take_rate,
            "amount": network_cut,
            "payout_wallet": staking_bridge_usdc_payout_wallet,
        }
    )
    return [cast(ExtendedSplit, split) for split in new_splits]


def add_wallet_info_to_splits(
    session: Session, splits: List[Split], timestamp: Optional[datetime]
):
    user_ids = [split["user_id"] for split in splits]

    max_block_timestamps = (
        session.query(
            UserPayoutWalletHistory.user_id,
            func.max(UserPayoutWalletHistory.block_timestamp).label("block_timestamp"),
        )
        .filter(UserPayoutWalletHistory.block_timestamp < timestamp)
        .filter(UserPayoutWalletHistory.user_id.in_(user_ids))
        .group_by(UserPayoutWalletHistory.user_id)
        .cte("max_block_timestamps")
    )
    RelevantTimestamps = aliased(max_block_timestamps)

    wallets_query = (
        session.query(
            User.user_id,
            User.wallet,
            UserPayoutWalletHistory.spl_usdc_payout_wallet,
            USDCUserBankAccount.bank_account,
        )
        .outerjoin(
            USDCUserBankAccount, USDCUserBankAccount.ethereum_address == User.wallet
        )
        .outerjoin(RelevantTimestamps, RelevantTimestamps.c.user_id == User.user_id)
        .outerjoin(
            UserPayoutWalletHistory,
            and_(
                UserPayoutWalletHistory.user_id == RelevantTimestamps.c.user_id,
                UserPayoutWalletHistory.block_timestamp
                == RelevantTimestamps.c.block_timestamp,
            ),
        )
        .filter(User.user_id.in_(user_ids))
    )
    wallets = wallets_query.all()
    new_splits: List[dict] = []
    for split in splits:
        user_id = split["user_id"]
        (user_id, eth_wallet, payout_wallet, usdc_bank_account) = next(
            (p for p in wallets if p[0] == user_id),
            (user_id, None, None, None),
        )
        new_split: Dict = cast(dict, split)
        new_split["eth_wallet"] = eth_wallet
        new_split["payout_wallet"] = (
            payout_wallet if payout_wallet else usdc_bank_account
        )
        new_splits.append(new_split)
    return splits


def to_wallet_amount_map(splits: List[ExtendedSplit]):
    return {
        split["payout_wallet"]: split["amount"]
        for split in splits
        if split["payout_wallet"] is not None
    }


def _get_extended_purchase_gate(session: Session, gate: PurchaseGate):
    price = gate.get("usdc_purchase", {}).get("price", None)
    original_splits = gate.get("usdc_purchase", {}).get("splits", [])
    splits = [orig.copy() for orig in original_splits]
    splits = add_wallet_info_to_splits(session, splits, datetime.now())
    extended_splits = calculate_split_amounts(price, splits)
    extended_gate: ExtendedPurchaseGate = {
        "usdc_purchase": {"price": price, "splits": extended_splits}
    }
    return extended_gate


def get_extended_purchase_gate(gate: AccessGate, session=None):
    if gate and "usdc_purchase" in gate:
        # mypy gets confused....
        gate = cast(PurchaseGate, gate)
        if session:
            return _get_extended_purchase_gate(session, gate)
        else:
            db: SessionManager = get_db_read_replica()
            with db.scoped_session() as session:
                return _get_extended_purchase_gate(session, gate)


def get_legacy_purchase_gate(gate: AccessGate, session=None):
    if gate and "usdc_purchase" in gate:
        # mypy gets confused....
        gate = cast(PurchaseGate, gate)
        if session:
            new_gate = _get_extended_purchase_gate(session, gate)
        else:
            db: SessionManager = get_db_read_replica()
            with db.scoped_session() as session:
                new_gate = _get_extended_purchase_gate(session, gate)
        extended_splits = new_gate["usdc_purchase"]["splits"]
        splits = to_wallet_amount_map(extended_splits)
        new_gate["usdc_purchase"]["splits"] = splits
        return new_gate
    return gate
