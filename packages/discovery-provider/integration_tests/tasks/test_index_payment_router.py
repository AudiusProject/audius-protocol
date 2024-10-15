from datetime import datetime
from unittest.mock import call, create_autospec

from integration_tests.tasks.payment_router_mock_transactions import (
    mock_failed_track_purchase_single_recipient_tx,
    mock_invalid_track_purchase_bad_PDA_account_single_recipient_tx,
    mock_invalid_track_purchase_insufficient_split_tx,
    mock_invalid_track_purchase_missing_split_tx,
    mock_non_route_transfer_purchase_single_recipient_tx,
    mock_valid_album_purchase_single_recipient_tx,
    mock_valid_track_purchase_download_access,
    mock_valid_track_purchase_from_user_bank_single_recipient_tx,
    mock_valid_track_purchase_multi_recipient_pay_extra_tx,
    mock_valid_track_purchase_multi_recipient_tx,
    mock_valid_track_purchase_single_recipient_pay_extra_tx,
    mock_valid_track_purchase_single_recipient_tx,
    mock_valid_track_purchase_stream_access,
    mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx,
    mock_valid_transfer_single_recipient_recovery_tx,
    mock_valid_transfer_without_purchase_multi_recipient_tx,
    mock_valid_transfer_without_purchase_single_recipient_tx,
)
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.users.usdc_purchase import (
    PurchaseAccessType,
    PurchaseType,
    USDCPurchase,
)
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.tasks.index_payment_router import process_payment_router_tx_details
from src.utils.db_session import get_db

trackOwnerId = 1
trackOwnerUserBank = "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy"
trackBuyerId = 2
trackBuyerUserBank = "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX"
thirdPartyId = 3
thirdPartyUserBank = "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556"

# Used as the source wallet for all the mock transactions
transactionSenderOwnerAccount = "HKeSPzkRKok3G7Et6yzF6myDjz7ximk4iyPdqtFE15Pm"

test_entries = {
    "users": [
        {
            "user_id": trackOwnerId,
            "handle": "trackOwner",
            "wallet": "0xbe21befeada45e089031429d8ddd52765e996133",
        },
        {
            "user_id": trackBuyerId,
            "handle": "trackBuyer",
            "wallet": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
        },
        {
            "user_id": thirdPartyId,
            "handle": "thirdParty",
            "wallet": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
        },
    ],
    "usdc_user_bank_accounts": [
        {  # trackOwner
            "signature": "unused1",
            "ethereum_address": "0xbe21befeada45e089031429d8ddd52765e996133",
            "bank_account": trackOwnerUserBank,
        },
        {  # trackBuyer
            "signature": "unused2",
            "ethereum_address": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
            "bank_account": trackBuyerUserBank,
        },
        {  # thirdParty
            "signature": "unused3",
            "ethereum_address": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
            "bank_account": thirdPartyUserBank,
        },
    ],
    "tracks": [
        {"track_id": 1, "title": "track 1", "owner_id": 1},
        {"track_id": 2, "title": "track 2", "owner_id": 1},
        {"track_id": 3, "title": "track 3", "owner_id": 1},
    ],
    "playlists": [
        {"playlist_id": 1, "title": "playlist 1", "owner_id": 1},
    ],
    "track_price_history": [
        {  # pay full price to trackOwner
            "track_id": 1,
            "splits": [{"user_id": 1, "amount": 1000000, "percentage": 100}],
            "total_price_cents": 100,
            "access": PurchaseAccessType.stream,
        },
        {  # pay half to each the track owner and third party
            "track_id": 2,
            "splits": [
                {"user_id": 1, "percentage": 50},
                {"user_id": 3, "percentage": 50},
            ],
            "total_price_cents": 100,
        },
        {  # download access type
            "track_id": 3,
            "splits": [{"user_id": 1, "percentage": 100}],
            "total_price_cents": 100,
            "access": PurchaseAccessType.download,
        },
    ],
    "album_price_history": [
        {  # pay full price to albumOwner
            "playlist_id": 1,
            "splits": [{"user_id": 1, "percentage": 100}],
            "total_price_cents": 100,
        },
    ],
}


def test_process_payment_router_tx_details_valid_purchase(app):
    tx_response = mock_valid_track_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1

        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is not None
        assert transaction_record.user_bank == trackOwnerUserBank
        assert (
            transaction_record.transaction_type == USDCTransactionType.purchase_content
        )
        assert transaction_record.method == USDCTransactionMethod.receive
        # 10% went to staking bridge
        assert transaction_record.change == 900000
        assert transaction_record.tx_metadata == str(trackBuyerId)


def test_process_payment_router_tx_details_valid_purchase_with_location_data(app):
    tx_response = mock_valid_track_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction
    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)
    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1
        assert purchase.city == "Nashville"
        assert purchase.region == "TN"
        assert purchase.country == "United States"


def test_process_payment_router_tx_details_valid_purchase_album(app):
    tx_response = mock_valid_album_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.album
        assert purchase.content_id == 1

        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is not None
        assert transaction_record.user_bank == trackOwnerUserBank
        assert (
            transaction_record.transaction_type == USDCTransactionType.purchase_content
        )
        assert transaction_record.method == USDCTransactionMethod.receive
        # 10% went to staking bridge
        assert transaction_record.change == 900000
        assert transaction_record.tx_metadata == str(trackBuyerId)


def test_process_payment_router_tx_details_valid_purchase_from_user_bank(app):
    tx_response = mock_valid_track_purchase_from_user_bank_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1

        seller_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert seller_transaction_record is not None
        assert (
            seller_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert seller_transaction_record.method == USDCTransactionMethod.receive
        # 10% went to staking bridge
        assert seller_transaction_record.change == 900000
        assert seller_transaction_record.tx_metadata == str(trackBuyerId)

        buyer_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackBuyerUserBank)
            .first()
        )
        assert buyer_transaction_record is not None
        assert (
            buyer_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert buyer_transaction_record.method == USDCTransactionMethod.send
        assert buyer_transaction_record.change == -1000000
        assert buyer_transaction_record.tx_metadata == str(trackOwnerId)


def test_process_payment_router_tx_details_transfer_without_purchase(
    app,
):
    tx_response = mock_valid_transfer_without_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # We do still expect the transfers to get indexed, but as regular transfers
        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert transaction_record is not None
        assert transaction_record.user_bank == trackOwnerUserBank
        # Regular transfer, not a purchase
        assert transaction_record.transaction_type == USDCTransactionType.transfer
        assert transaction_record.method == USDCTransactionMethod.receive
        # The test tx sends 10% to the staking bridge, so only $0.90 is "transferred"
        assert transaction_record.change == 900000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert transaction_record.tx_metadata == transactionSenderOwnerAccount


def test_process_payment_router_tx_details_transfer_from_user_bank_without_purchase(
    app,
):
    tx_response = (
        mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx
    )
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # We do still expect the transfers to get indexed, but as regular transfers
        receiver_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert receiver_transaction_record is not None
        assert receiver_transaction_record.user_bank == trackOwnerUserBank
        # Regular transfer, not a purchase
        assert (
            receiver_transaction_record.transaction_type == USDCTransactionType.transfer
        )
        assert receiver_transaction_record.method == USDCTransactionMethod.receive
        assert receiver_transaction_record.change == 1000000
        assert receiver_transaction_record.tx_metadata == trackBuyerUserBank

        sender_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackBuyerUserBank)
            .first()
        )
        assert sender_transaction_record is not None
        # Regular transfer, not a purchase
        assert (
            sender_transaction_record.transaction_type == USDCTransactionType.transfer
        )
        assert sender_transaction_record.method == USDCTransactionMethod.send
        assert sender_transaction_record.change == -1000000
        assert sender_transaction_record.tx_metadata == trackOwnerUserBank


# Should index recoveries with the correct transaction type
def test_process_payment_router_tx_details_transfer_recovery(app):
    tx_response = mock_valid_transfer_single_recipient_recovery_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    test_entries_with_transaction = test_entries.copy()
    test_entries_with_transaction["usdc_transactions_history"] = [
        {
            "user_bank": trackOwnerUserBank,
            "signature": "existingWithdrawal",
            "transaction_type": USDCTransactionType.transfer,
            "method": USDCTransactionMethod.send,
            "change": -1000000,
            "balance": 0,
            "tx_metadata": transactionSenderOwnerAccount,
        }
    ]

    populate_mock_db(db, test_entries_with_transaction)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect a recovery transaction record
        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert transaction_record.method == USDCTransactionMethod.receive
        assert (
            transaction_record.transaction_type
            == USDCTransactionType.recover_withdrawal
        )
        assert transaction_record.change == 1000000
        assert transaction_record.balance == 1000000
        assert transaction_record.tx_metadata == transactionSenderOwnerAccount


def test_process_payment_router_tx_details_valid_purchase_with_pay_extra(app):
    tx_response = mock_valid_track_purchase_single_recipient_pay_extra_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 1500000
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1

        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is not None
        assert transaction_record.user_bank == trackOwnerUserBank
        assert (
            transaction_record.transaction_type == USDCTransactionType.purchase_content
        )
        assert transaction_record.method == USDCTransactionMethod.receive
        # 10% went to staking bridge
        assert transaction_record.change == 2400000
        assert transaction_record.tx_metadata == str(trackBuyerId)


def test_process_payment_router_tx_details_valid_purchase_multiple_recipients(app):
    tx_response = mock_valid_track_purchase_multi_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 2

        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.user_bank == trackOwnerUserBank
        assert (
            owner_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        # 10% went to the staking bridge, 90c left to split
        assert owner_transaction_record.change == 450000
        assert owner_transaction_record.tx_metadata == str(trackBuyerId)

        third_party_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == thirdPartyUserBank)
            .first()
        )
        assert third_party_transaction_record is not None
        assert (
            third_party_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert third_party_transaction_record.method == USDCTransactionMethod.receive
        # 10% went to the staking bridge, 90c left to split
        assert third_party_transaction_record.change == 450000
        assert third_party_transaction_record.tx_metadata == str(trackBuyerId)


def test_process_payment_router_tx_details_valid_purchase_multiple_recipients_pay_extra(
    app,
):
    tx_response = mock_valid_track_purchase_multi_recipient_pay_extra_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is not None
        assert purchase.seller_user_id == trackOwnerId
        assert purchase.buyer_user_id == trackBuyerId
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 2000000
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 2

        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.user_bank == trackOwnerUserBank
        assert (
            owner_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        # 10% of the price went to staking bridge, $1.90 to split
        assert owner_transaction_record.change == 1450000
        assert owner_transaction_record.tx_metadata == str(trackBuyerId)

        third_party_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == thirdPartyUserBank)
            .first()
        )
        assert third_party_transaction_record is not None
        assert (
            third_party_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert third_party_transaction_record.method == USDCTransactionMethod.receive
        # 10% of the price went to staking bridge, $1.90 to split
        assert third_party_transaction_record.change == 1450000
        assert third_party_transaction_record.tx_metadata == str(trackBuyerId)


def test_process_payment_router_tx_details_invalid_purchase_bad_splits(app):
    tx_response = mock_invalid_track_purchase_insufficient_split_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # We do still expect the transfers to get indexed, but as regular transfers
        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.user_bank == trackOwnerUserBank
        # Regular transfer, not a purchase
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1000000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert owner_transaction_record.tx_metadata == transactionSenderOwnerAccount

        third_party_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == thirdPartyUserBank)
            .first()
        )
        assert third_party_transaction_record is not None
        # Regular transfer, not a purchase
        assert (
            third_party_transaction_record.transaction_type
            == USDCTransactionType.transfer
        )
        assert third_party_transaction_record.method == USDCTransactionMethod.receive
        assert third_party_transaction_record.change == 500000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert (
            third_party_transaction_record.tx_metadata == transactionSenderOwnerAccount
        )


# Transaction is for the correct amount, but one of the splits is missing
# Should index as a transfer with no purchase
def test_process_payment_router_tx_details_invalid_purchase_missing_splits(app):
    tx_response = mock_invalid_track_purchase_missing_split_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # We do still expect the transfers to get indexed, but as regular transfers
        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.user_bank == trackOwnerUserBank
        # Regular transfer, not a purchase
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 2000000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert owner_transaction_record.tx_metadata == transactionSenderOwnerAccount


def test_process_payment_router_tx_details_transfer_multiple_users_without_purchase(
    app,
):
    tx_response = mock_valid_transfer_without_purchase_multi_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # We do still expect the transfers to get indexed, but as regular transfers
        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.user_bank == trackOwnerUserBank
        # Regular transfer, not a purchase
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1000000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert owner_transaction_record.tx_metadata == transactionSenderOwnerAccount

        third_party_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == thirdPartyUserBank)
            .first()
        )
        assert third_party_transaction_record is not None
        # Regular transfer, not a purchase
        assert (
            third_party_transaction_record.transaction_type
            == USDCTransactionType.transfer
        )
        assert third_party_transaction_record.method == USDCTransactionMethod.receive
        assert third_party_transaction_record.change == 1000000
        # For transfers, source is the owning wallet unless it's a transfer from a user bank
        assert (
            third_party_transaction_record.tx_metadata == transactionSenderOwnerAccount
        )


def test_process_payment_router_txs_details_create_challenge_events_for_purchase(app):
    tx_response = mock_valid_track_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.fromtimestamp(tx_response.value.block_time),
            challenge_event_bus=challenge_event_bus,
        )
    # Note: Challenge amounts are 1 per dollar of USDC
    calls = [
        call(
            ChallengeEvent.audio_matching_buyer,
            tx_response.value.slot,
            datetime.fromtimestamp(tx_response.value.block_time),
            trackBuyerId,
            {"track_id": 1, "amount": 1},
        ),
        call(
            ChallengeEvent.audio_matching_seller,
            tx_response.value.slot,
            datetime.fromtimestamp(tx_response.value.block_time),
            trackOwnerId,
            {"track_id": 1, "sender_user_id": trackBuyerId, "amount": 1},
        ),
    ]
    challenge_event_bus.dispatch.assert_has_calls(
        calls,
        any_order=True,
    )


def test_process_payment_router_tx_details_skip_errors(app):
    tx_response = mock_failed_track_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )
        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # Expect no transfer record
        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is None


# Don't process any transactions that aren't Route or TransferChecked transactions
def test_process_payment_router_txs_details_skip_unknown_instructions(app):
    # This transaction does everything a payment router transaction would for
    # a purchase, but uses a different program to do the routing. We ignore it.
    tx_response = mock_non_route_transfer_purchase_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )
        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # Expect no transfer record
        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is None


# Source accounts for Route intructions must belong to Payment Router PDA
def test_process_payment_router_txs_details_skip_unknown_PDA_ATAs(app):
    # This transaction does everything a payment router transaction would for
    # a purchase, but uses an ATA that we don't recognize as the source.
    tx_response = mock_invalid_track_purchase_bad_PDA_account_single_recipient_tx
    with app.app_context():
        db = get_db()

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )
        # Expect no purchase record
        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )
        assert purchase is None

        # Expect no transfer record
        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .first()
        )
        assert transaction_record is None


# Index tx with stream access in memo correctly
def test_process_payment_router_tx_details_stream_access(app):
    with app.app_context():
        db = get_db()
    populate_mock_db(db, test_entries)
    challenge_event_bus = create_autospec(ChallengeEventBus)

    tx_response = mock_valid_track_purchase_stream_access
    transaction = tx_response.value.transaction.transaction
    tx_sig_str = str(transaction.signatures[0])

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )

        assert purchase is not None
        assert purchase.access == PurchaseAccessType.stream


# Index tx with download access in memo correctly
def test_process_payment_router_tx_details_download_access(app):
    with app.app_context():
        db = get_db()
    populate_mock_db(db, test_entries)
    challenge_event_bus = create_autospec(ChallengeEventBus)

    tx_response = mock_valid_track_purchase_download_access
    transaction = tx_response.value.transaction.transaction
    tx_sig_str = str(transaction.signatures[0])

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        purchase = (
            session.query(USDCPurchase)
            .filter(USDCPurchase.signature == tx_sig_str)
            .first()
        )

        assert purchase is not None
        assert purchase.access == PurchaseAccessType.download
