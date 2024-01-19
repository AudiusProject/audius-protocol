from datetime import datetime
from unittest.mock import call, create_autospec

from user_bank_mock_transactions import (
    EXTERNAL_ACCOUNT_ADDRESS,
    RECIPIENT_ACCOUNT_ADDRESS,
    SENDER_ACCOUNT_ADDRESS,
    mock_failed_track_purchase_tx,
    mock_invalid_track_purchase_bad_splits_tx,
    mock_invalid_track_purchase_missing_splits_tx,
    mock_invalid_track_purchase_unknown_pda_tx,
    mock_unknown_instruction_tx,
    mock_valid_create_token_account_tx,
    mock_valid_track_purchase_pay_extra_tx,
    mock_valid_track_purchase_tx,
    mock_valid_transfer_without_purchase_tx,
)

from payment_router_mock_transactions import (
    mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx,
)

from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.users.usdc_purchase import PurchaseType, USDCPurchase
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user_bank import USDCUserBankAccount
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.index_user_bank import process_user_bank_tx_details
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

trackOwnerId = 1
trackOwnerUserBank = RECIPIENT_ACCOUNT_ADDRESS
trackOwnerEthAddress = "0xe66402f9a6714a874a539fb1689b870dd271dfb2"
trackBuyerId = 2
trackBuyerUserBank = SENDER_ACCOUNT_ADDRESS

test_entries = {
    "users": [
        {
            "user_id": trackOwnerId,
            "handle": "trackOwner",
            "wallet": trackOwnerEthAddress,
        },
        {
            "user_id": trackBuyerId,
            "handle": "trackBuyer",
            "wallet": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
        },
    ],
    "usdc_user_bank_accounts": [
        {  # trackOwner
            "signature": "unused1",
            "ethereum_address": trackOwnerEthAddress,
            "bank_account": trackOwnerUserBank,
        },
        {  # trackBuyer
            "signature": "unused2",
            "ethereum_address": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
            "bank_account": trackBuyerUserBank,
        },
    ],
    "tracks": [
        {"track_id": 1, "title": "track 1", "owner_id": 1},
        {"track_id": 2, "title": "track 2", "owner_id": 1},
    ],
    "track_price_history": [
        {  # pay full price to trackOwner
            "track_id": 1,
            "splits": {RECIPIENT_ACCOUNT_ADDRESS: 1000000},
            "total_price_cents": 100,
        },
        {  # pay $1 each to track owner and third party
            "track_id": 2,
            "splits": {
                RECIPIENT_ACCOUNT_ADDRESS: 1000000,
                EXTERNAL_ACCOUNT_ADDRESS: 1000000,
            },
            "total_price_cents": 200,
        },
    ],
}


def test_process_user_bank_tx_details_valid_purchase(app):
    tx_response = mock_valid_track_purchase_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            session=session,
            redis=redis,
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
        assert purchase.seller_user_id == 1
        assert purchase.buyer_user_id == 2
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 0
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1

        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert (
            owner_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1000000
        assert owner_transaction_record.tx_metadata == str(trackBuyerId)

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


def test_process_user_bank_tx_details_transfer_without_purchase(
    app,
):
    tx_response = mock_valid_transfer_without_purchase_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()
    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1000000
        assert owner_transaction_record.tx_metadata == trackBuyerUserBank

        buyer_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackBuyerUserBank)
            .first()
        )
        assert buyer_transaction_record is not None
        assert buyer_transaction_record.transaction_type == USDCTransactionType.transfer
        assert buyer_transaction_record.method == USDCTransactionMethod.send
        assert buyer_transaction_record.change == -1000000
        assert buyer_transaction_record.tx_metadata == trackOwnerUserBank


def test_process_user_bank_tx_details_valid_purchase_with_pay_extra(app):
    tx_response = mock_valid_track_purchase_pay_extra_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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
        assert purchase.seller_user_id == 1
        assert purchase.buyer_user_id == 2
        assert purchase.amount == 1000000
        assert purchase.extra_amount == 1000000
        assert purchase.content_type == PurchaseType.track
        assert purchase.content_id == 1

        owner_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert owner_transaction_record is not None
        assert (
            owner_transaction_record.transaction_type
            == USDCTransactionType.purchase_content
        )
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 2000000
        assert owner_transaction_record.tx_metadata == str(trackBuyerId)

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
        assert buyer_transaction_record.change == -2000000
        assert buyer_transaction_record.tx_metadata == str(trackOwnerId)


# Simulates buying a track for the correct price ($2) and allocating all of the
# amount to one address, with a missing split for the other
def test_process_user_bank_tx_details_invalid_purchase_missing_splits(app):
    tx_response = mock_invalid_track_purchase_missing_splits_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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
        # Regular transfer, not a purchase
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 2000000
        # For transfers, the metadata is the source address
        assert owner_transaction_record.tx_metadata == trackBuyerUserBank


# Simulates buying a track for the correct price ($2) but giving one of the recipients
# an insufficient amount. track owner receives $1.50 and second split receives $0.50 when
# they should both receive $1
def test_process_user_bank_tx_details_invalid_purchase_bad_splits(app):
    tx_response = mock_invalid_track_purchase_bad_splits_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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
        # Regular transfer, not a purchase
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1500000
        # For transfers, the metadata is the source address
        assert owner_transaction_record.tx_metadata == trackBuyerUserBank

        buyer_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackBuyerUserBank)
            .first()
        )
        assert buyer_transaction_record is not None
        # Regular transfer, not a purchase
        # This is a little odd in that we index one transfer of $2 out of the sender
        # account with just the track owner user bank as a destination. Technically
        # since it's just metadata, this should be fine. But we eventually should include
        # all addresses, or register a separate transaction for each transfer.
        assert buyer_transaction_record.transaction_type == USDCTransactionType.transfer
        assert buyer_transaction_record.method == USDCTransactionMethod.send
        assert buyer_transaction_record.change == -2000000
        # For transfers, the metadata is the dest address
        assert buyer_transaction_record.tx_metadata == trackOwnerUserBank


def test_process_user_bank_txs_details_create_challenge_events_for_purchase(app):
    tx_response = mock_valid_track_purchase_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )
    # Note: Challenge amounts are 1 per dollar of USDC
    calls = [
        call(
            ChallengeEvent.audio_matching_buyer,
            tx_response.value.slot,
            trackBuyerId,
            {"track_id": 1, "amount": 1},
        ),
        call(
            ChallengeEvent.audio_matching_seller,
            tx_response.value.slot,
            trackOwnerId,
            {"track_id": 1, "sender_user_id": trackBuyerId, "amount": 1},
        ),
    ]
    challenge_event_bus.dispatch.assert_has_calls(
        calls,
        any_order=True,
    )


def test_process_user_bank_txs_details_create_usdc_user_bank(app):
    tx_response = mock_valid_create_token_account_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    test_entires_without_userbanks = test_entries.copy()
    test_entires_without_userbanks.pop("usdc_user_bank_accounts")

    populate_mock_db(db, test_entires_without_userbanks)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            session=session,
            redis=redis,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        user_bank = (
            session.query(USDCUserBankAccount)
            .filter(USDCUserBankAccount.signature == tx_sig_str)
            .first()
        )

        assert user_bank is not None
        assert user_bank.bank_account == RECIPIENT_ACCOUNT_ADDRESS
        assert user_bank.ethereum_address == trackOwnerEthAddress


def test_process_user_bank_tx_details_skip_errors(app):
    tx_response = mock_failed_track_purchase_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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


# Transfers must reference accounts belonging to the Claimable Tokens PDA
def test_process_user_bank_txs_details_skip_unknown_PDA_ATAs(app):
    # This transaction does everything a valid transaction would for
    # a purchase, but uses an ATA that we don't recognize as the source.
    tx_response = mock_invalid_track_purchase_unknown_pda_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
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


# Don't process any transactions that aren't CreateAccount or Transfer instructions
def test_process_user_bank_txs_details_skip_unknown_instructions(app):
    # This transaction results in a balance change but doesn't reference an
    # instruction we recognize. So we'll ignore it
    tx_response = mock_unknown_instruction_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            redis=redis,
            solana_client_manager=solana_client_manager_mock,
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


def test_process_user_bank_txs_details_ignore_payment_router_transfers(app):
    # Payment router transaction, should be ignored by user bank indexer
    tx_response = (
        mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx
    )
    with app.app_context():
        db = get_db()
        redis = get_redis()
    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_user_bank_tx_details(
            solana_client_manager=solana_client_manager_mock,
            redis=redis,
            session=session,
            tx_info=tx_response,
            tx_sig=tx_sig_str,
            timestamp=datetime.now(),
            challenge_event_bus=challenge_event_bus,
        )

        # We expect no transactions to be logged for sender or receiver
        receiver_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackOwnerUserBank)
            .first()
        )
        assert receiver_transaction_record is None

        sender_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == trackBuyerUserBank)
            .first()
        )
        assert sender_transaction_record is None


# TODO: https://linear.app/audius/issue/PAY-2314/add-user-bank-indexer-tests-for-audio-operations


# Creation WAUDIO user bank
def test_process_user_bank_txs_details_create_audio_token_acct_tx(app):
    # TODO
    return


# Transfer of WAUDIO between two user banks (tipping)
def test_process_user_bank_txs_details_transfer_audio_tip_tx(app):
    # TODO
    return


# Transfer of WAUDIO to a non-userbank (external transfer)
def test_process_user_bank_txs_details_transfer_audio_external_tx(app):
    # TODO
    return


# Creation of challenge event for tipping
def test_process_user_bank_txs_details_transfer_audio_tip_challenge_event(app):
    # TODO
    return
