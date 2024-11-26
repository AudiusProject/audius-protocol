from typing import TypedDict

from sqlalchemy import desc, or_

from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.email import EmailEncryptionKey, EncryptedEmail
from src.models.users.usdc_purchase import PurchaseType, USDCPurchase
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user import User
from src.models.users.user_bank import USDCUserBankAccount
from src.solana.constants import USDC_DECIMALS
from src.utils.config import shared_config
from src.utils.csv_writer import write_csv_string
from src.utils.db_session import get_db_read_replica

env = shared_config["discprov"]["env"]

staking_bridge_usdc_payout_wallet = shared_config["solana"][
    "staking_bridge_usdc_payout_wallet"
]


class DownloadPurchasesArgs(TypedDict):
    buyer_user_id: int


class DownloadSalesArgs(TypedDict):
    seller_user_id: int


class DownloadWithdrawalsArgs(TypedDict):
    user_id: int


# Get all purchases or sales for a given artist.
def get_purchases_or_sales(user_id: int, is_purchases: bool):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if is_purchases:
            # Get all purchases for the given user and include the seller name and handle
            query = (
                session.query(
                    USDCPurchase.content_type.label("content_type"),
                    USDCPurchase.created_at.label("created_at"),
                    USDCPurchase.amount.label("amount"),
                    USDCPurchase.extra_amount.label("extra_amount"),
                    USDCPurchase.splits.label("splits"),
                    User.handle.label("seller_handle"),
                    User.name.label("seller_name"),
                    USDCPurchase.seller_user_id,
                )
                .join(User, User.user_id == USDCPurchase.seller_user_id)
                .filter(USDCPurchase.buyer_user_id == user_id)
                .filter(User.is_current == True)
            )
        else:
            # Get all sales for the given user and include the buyer name and encrypted email
            query = (
                session.query(
                    USDCPurchase.content_type.label("content_type"),
                    USDCPurchase.created_at.label("created_at"),
                    USDCPurchase.amount.label("amount"),
                    USDCPurchase.extra_amount.label("extra_amount"),
                    USDCPurchase.splits.label("splits"),
                    USDCPurchase.country.label("country"),
                    User.name.label("buyer_name"),
                    EncryptedEmail.encrypted_email.label("encrypted_email"),
                )
                .join(User, User.user_id == USDCPurchase.buyer_user_id)
                .outerjoin(  # Using outerjoin in case some users don't have encrypted emails
                    EncryptedEmail,
                    (EncryptedEmail.email_owner_user_id == User.user_id)
                    & (EncryptedEmail.primary_user_id == USDCPurchase.seller_user_id),
                )
                .filter(USDCPurchase.seller_user_id == user_id)
                .filter(User.is_current == True)
            )

        # Include playlist titles
        playlists_query = (
            query.filter(
                or_(
                    USDCPurchase.content_type == PurchaseType.playlist,
                    USDCPurchase.content_type == PurchaseType.album,
                )
            )
            .join(Playlist, Playlist.playlist_id == USDCPurchase.content_id)
            .join(PlaylistRoute, PlaylistRoute.playlist_id == USDCPurchase.content_id)
            .filter(Playlist.is_current == True)
            .add_columns(
                Playlist.playlist_name.label("content_title"),
                PlaylistRoute.slug.label("slug"),
            )
        )

        # Include track titles
        tracks_query = (
            query.filter(USDCPurchase.content_type == PurchaseType.track)
            .join(Track, Track.track_id == USDCPurchase.content_id)
            .join(TrackRoute, TrackRoute.track_id == USDCPurchase.content_id)
            .filter(Track.is_current == True)
            .add_columns(
                Track.title.label("content_title"),
                TrackRoute.slug.label("slug"),
            )
        )

        return (
            playlists_query.union(tracks_query)
            .order_by(desc(USDCPurchase.created_at))
            .all()
        )


# Get link of purchased content
def get_link(content_type: PurchaseType, handle: str, slug: str):
    domain = ""
    if env == "prod":
        domain = "https://audius.co"
    elif env == "stage":
        domain = "https://staging.audius.co"
    if content_type == PurchaseType.playlist:
        return f"{domain}/{handle}/playlist/{slug}"
    if content_type == PurchaseType.album:
        return f"{domain}/{handle}/album/{slug}"
    return f"{domain}/{handle}/{slug}"


# Get value of purchased content
def get_dollar_amount(amount: str):
    return int(amount) / 10**USDC_DECIMALS


# Returns USDC purchases for a given user in a CSV format
def download_purchases(args: DownloadPurchasesArgs):
    buyer_user_id = args["buyer_user_id"]

    # Get purchases for user
    results = get_purchases_or_sales(buyer_user_id, is_purchases=True)

    # Build list of dictionary results
    contents = list(
        map(
            lambda result: {
                "title": result.content_title,
                "link": get_link(
                    result.content_type, result.seller_handle, result.slug
                ),
                "artist": result.seller_name,
                "date": result.created_at,
                "paid to artist": next(
                    (
                        get_dollar_amount(item["amount"])
                        for item in result.splits
                        if item["user_id"] == result.seller_user_id
                    ),
                    None,
                ),
                "network fee": next(
                    (
                        get_dollar_amount(item["amount"])
                        for item in result.splits
                        if item["payout_wallet"] == staking_bridge_usdc_payout_wallet
                    ),
                    None,
                ),
                "pay extra": get_dollar_amount(result.extra_amount),
                "total": next(
                    (
                        get_dollar_amount(
                            str(int(result.amount) + int(result.extra_amount))
                        )
                        for item in result.splits
                        if item["user_id"] == result.seller_user_id
                    ),
                    None,
                ),
            },
            results,
        )
    )

    # Get results in CSV format
    to_download = write_csv_string(contents)
    return to_download


def format_sale_for_download(
    result, seller_handle, seller_user_id, include_email=False
):
    """Format a sale result into a CSV-friendly dictionary format."""
    # Convert datetime to ISO format string
    created_at = result.created_at.isoformat() if result.created_at else None

    formatted_result = {
        "title": result.content_title,
        "link": get_link(result.content_type, seller_handle, result.slug),
        "purchased_by": result.buyer_name,
        "date": created_at,
        "sale_price": get_dollar_amount(result.amount),
        "network_fee": next(
            (
                0 - get_dollar_amount(item["amount"])
                for item in result.splits
                if item["payout_wallet"] == staking_bridge_usdc_payout_wallet
            ),
            None,
        ),
        "pay_extra": get_dollar_amount(result.extra_amount),
        "total": next(
            (
                get_dollar_amount(str(int(item["amount"]) + int(result.extra_amount)))
                for item in result.splits
                if item["user_id"] == seller_user_id
            ),
            None,
        ),
        "country": result.country,
    }

    # Only include encrypted_email if specifically requested (for JSON response)
    if include_email:
        formatted_result["encrypted_email"] = (
            result.encrypted_email if hasattr(result, "encrypted_email") else None
        )

    return formatted_result


# Returns USDC sales for a given artist in a CSV format
def download_sales(args: DownloadSalesArgs, return_json: bool = False):
    seller_user_id = args["seller_user_id"]

    # Get sales for artist
    results = get_purchases_or_sales(seller_user_id, is_purchases=False)

    # Get artist handle and encryption key
    db = get_db_read_replica()
    with db.scoped_session() as session:
        seller_data = (
            session.query(User.handle, EmailEncryptionKey.encrypted_key)
            .filter(User.user_id == seller_user_id)
            .filter(User.is_current == True)
            .outerjoin(
                EmailEncryptionKey, EmailEncryptionKey.primary_user_id == User.user_id
            )
            .first()
        )

        seller_handle, encryption_key = seller_data

    # Build list of dictionary results
    contents = list(
        map(
            lambda result: format_sale_for_download(
                result,
                seller_handle,
                seller_user_id,
                include_email=return_json,  # Only include email for JSON response
            ),
            results,
        )
    )

    # Return JSON if requested
    if return_json:
        return {"decryption_key": encryption_key, "sales": contents}

    # Get results in CSV format
    to_download = write_csv_string(contents)
    return to_download


def download_withdrawals(args: DownloadWithdrawalsArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Get USDC withdrawals for user
        results = (
            session.query(USDCTransactionsHistory)
            .select_from(User)
            .filter(User.user_id == args["user_id"])
            .filter(User.is_current == True)
            .join(
                USDCUserBankAccount, USDCUserBankAccount.ethereum_address == User.wallet
            )
            .join(
                USDCTransactionsHistory,
                USDCTransactionsHistory.user_bank == USDCUserBankAccount.bank_account,
            )
            .filter(
                USDCTransactionsHistory.transaction_type == USDCTransactionType.transfer
            )
            .filter(USDCTransactionsHistory.method == USDCTransactionMethod.send)
            .order_by(desc(USDCTransactionsHistory.transaction_created_at))
            .all()
        )

        # Build list of dictionary results
        contents = list(
            map(
                lambda result: {
                    "destination wallet": result.tx_metadata,
                    "date": result.transaction_created_at,
                    "amount": get_dollar_amount(result.change),
                },
                results,
            )
        )

        # Get results in CSV format
        to_download = write_csv_string(contents)
        return to_download
