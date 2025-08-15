from datetime import datetime
from unittest.mock import call, create_autospec

from integration_tests.tasks.payment_router_mock_transactions import (
    mock_valid_transfer_from_user_bank_without_purchase_single_recipient_tx,
)
from integration_tests.tasks.user_bank_mock_transactions import (
    EXTERNAL_ACCOUNT_ADDRESS,
    RECEIVER_ACCOUNT_WAUDIO_ADDRESS,
    RECIPIENT_USDC_USER_BANK_ADDRESS,
    SENDER_ACCOUNT_WAUDIO_ADDRESS,
    SENDER_ROOT_WALLET_USDC_ACCOUNT_OWNER,
    SENDER_USDC_USER_BANK_ADDRESS,
    mock_failed_track_purchase_tx,
    mock_lookup_tables_tx,
    mock_unknown_instruction_tx,
    mock_valid_create_audio_token_account_tx,
    mock_valid_create_usdc_token_account_tx,
    mock_valid_transfer_prepare_withdrawal_tx,
    mock_valid_transfer_withdrawal_tx,
    mock_valid_transfer_without_purchase_tx,
    mock_valid_waudio_transfer_between_user_banks,
    mock_valid_waudio_transfer_from_user_bank_to_external_address,
)
from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.usdc_purchase import PurchaseAccessType, USDCPurchase
from src.models.users.usdc_transactions_history import (
    USDCTransactionMethod,
    USDCTransactionsHistory,
    USDCTransactionType,
)
from src.models.users.user_bank import USDCUserBankAccount, UserBankAccount
from src.models.users.user_tip import UserTip
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.index_user_bank import process_user_bank_tx_details
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

track_owner_id = 1
track_owner_usdc_user_bank = RECIPIENT_USDC_USER_BANK_ADDRESS
track_owner_eth_address = "0xe66402f9a6714a874a539fb1689b870dd271dfb2"
track_buyer_id = 2
track_buyer_user_bank = SENDER_USDC_USER_BANK_ADDRESS

sender_user_id = 3
sender_eth_address = "0x7d273271690538cf855e5b3002a0dd8c154bb060"
sender_waudio_user_bank = SENDER_ACCOUNT_WAUDIO_ADDRESS
receiver_user_id = 4
receiver_eth_address = "0x627D8D6D0f06C5663809d29905db7A88317C6240"
receiver_waudio_user_bank = RECEIVER_ACCOUNT_WAUDIO_ADDRESS

# Used as the source wallet for all the mock transactions
transactionSenderOwnerAccount = SENDER_ROOT_WALLET_USDC_ACCOUNT_OWNER

test_entries = {
    "users": [
        {
            "user_id": track_owner_id,
            "handle": "trackOwner",
            "wallet": track_owner_eth_address,
        },
        {
            "user_id": track_buyer_id,
            "handle": "trackBuyer",
            "wallet": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
        },
        {
            "user_id": sender_user_id,
            "handle": "waudio_sender",
            "wallet": sender_eth_address,
        },
        {
            "user_id": receiver_user_id,
            "handle": "waudio_receiver",
            "wallet": receiver_eth_address,
        },
    ],
    "usdc_user_bank_accounts": [
        {  # trackOwner
            "signature": "unused1",
            "ethereum_address": track_owner_eth_address,
            "bank_account": track_owner_usdc_user_bank,
        },
        {  # trackBuyer
            "signature": "unused2",
            "ethereum_address": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
            "bank_account": track_buyer_user_bank,
        },
    ],
    "user_bank_accounts": [
        {  # Sender
            "signature": "unused1",
            "ethereum_address": sender_eth_address,
            "bank_account": sender_waudio_user_bank,
        },
        {  # Receiver
            "signature": "unused2",
            "ethereum_address": receiver_eth_address,
            "bank_account": receiver_waudio_user_bank,
        },
    ],
    "tracks": [
        {"track_id": 1, "title": "track 1", "owner_id": 1},
        {"track_id": 2, "title": "track 2", "owner_id": 1},
    ],
    "playlists": [
        {"playlist_id": 1, "title": "playlist 1", "owner_id": 1},
    ],
    "track_price_history": [
        {  # pay full price to trackOwner
            "track_id": 1,
            "splits": {RECIPIENT_USDC_USER_BANK_ADDRESS: 1000000},
            "total_price_cents": 100,
        },
        {  # pay $1 each to track owner and third party
            "track_id": 2,
            "splits": {
                RECIPIENT_USDC_USER_BANK_ADDRESS: 1000000,
                EXTERNAL_ACCOUNT_ADDRESS: 1000000,
            },
            "total_price_cents": 200,
        },
        {  # download access type
            "track_id": 3,
            "splits": {RECIPIENT_USDC_USER_BANK_ADDRESS: 1000000},
            "total_price_cents": 100,
            "access": PurchaseAccessType.download,
        },
    ],
    "album_price_history": [
        {  # pay full price to albumOwner
            "playlist_id": 1,
            "splits": {RECIPIENT_USDC_USER_BANK_ADDRESS: 1000000},
            "total_price_cents": 100,
        },
    ],
}


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
            .filter(USDCTransactionsHistory.user_bank == track_owner_usdc_user_bank)
            .first()
        )
        assert owner_transaction_record is not None
        assert owner_transaction_record.transaction_type == USDCTransactionType.transfer
        assert owner_transaction_record.method == USDCTransactionMethod.receive
        assert owner_transaction_record.change == 1000000
        assert owner_transaction_record.tx_metadata == track_buyer_user_bank

        buyer_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == track_buyer_user_bank)
            .first()
        )
        assert buyer_transaction_record is not None
        assert buyer_transaction_record.transaction_type == USDCTransactionType.transfer
        assert buyer_transaction_record.method == USDCTransactionMethod.send
        assert buyer_transaction_record.change == -1000000
        assert buyer_transaction_record.tx_metadata == track_owner_usdc_user_bank


def test_process_user_bank_txs_details_create_usdc_user_bank(app):
    tx_response = mock_valid_create_usdc_token_account_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    test_entries_without_userbanks = test_entries.copy()
    test_entries_without_userbanks.pop("usdc_user_bank_accounts")

    populate_mock_db(db, test_entries_without_userbanks)

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
        assert user_bank.bank_account == RECIPIENT_USDC_USER_BANK_ADDRESS
        assert user_bank.ethereum_address == track_owner_eth_address


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


def test_process_user_bank_tx_details_prepare_withdrawal(
    app,
):
    tx_response = mock_valid_transfer_prepare_withdrawal_tx
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

        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == track_buyer_user_bank)
            .first()
        )
        assert transaction_record is not None
        assert (
            transaction_record.transaction_type
            == USDCTransactionType.prepare_withdrawal
        )
        assert transaction_record.method == USDCTransactionMethod.send
        assert transaction_record.change == -1000000
        assert transaction_record.tx_metadata == transactionSenderOwnerAccount


def test_process_user_bank_tx_details_withdrawal(
    app,
):
    tx_response = mock_valid_transfer_withdrawal_tx
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

        transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == track_buyer_user_bank)
            .first()
        )
        assert transaction_record is not None
        assert transaction_record.transaction_type == USDCTransactionType.withdrawal
        assert transaction_record.method == USDCTransactionMethod.send
        assert transaction_record.change == -1000000


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
            .filter(USDCTransactionsHistory.user_bank == track_owner_usdc_user_bank)
            .first()
        )
        assert receiver_transaction_record is None

        sender_transaction_record = (
            session.query(USDCTransactionsHistory)
            .filter(USDCTransactionsHistory.signature == tx_sig_str)
            .filter(USDCTransactionsHistory.user_bank == track_buyer_user_bank)
            .first()
        )
        assert sender_transaction_record is None


# Creation WAUDIO user bank
def test_process_user_bank_txs_details_create_audio_token_acct_tx(app):
    tx_response = mock_valid_create_audio_token_account_tx
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)

    transaction = tx_response.value.transaction.transaction

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    test_entries_without_userbanks = test_entries.copy()
    test_entries_without_userbanks.pop("user_bank_accounts")

    populate_mock_db(db, test_entries_without_userbanks)

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
            session.query(UserBankAccount)
            .filter(UserBankAccount.signature == tx_sig_str)
            .first()
        )

        assert user_bank is not None
        assert user_bank.bank_account == SENDER_ACCOUNT_WAUDIO_ADDRESS
        assert user_bank.ethereum_address == sender_eth_address


# Transfer of WAUDIO between two user banks (tipping)
def test_process_user_bank_txs_details_transfer_audio_tip_tx(app):
    tx_response = mock_valid_waudio_transfer_between_user_banks
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

        tip = session.query(UserTip).filter(UserTip.signature == tx_sig_str).first()
        assert tip is not None
        assert tip.sender_user_id == 3
        assert tip.receiver_user_id == 4
        assert tip.amount == 10000000000

        sender_transaction_record = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == tx_sig_str)
            .filter(AudioTransactionsHistory.user_bank == sender_waudio_user_bank)
            .first()
        )
        assert sender_transaction_record is not None
        assert sender_transaction_record.transaction_type == TransactionType.tip
        assert sender_transaction_record.method == TransactionMethod.send
        assert sender_transaction_record.change == -10000000000

        receiver_transaction_record = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == tx_sig_str)
            .filter(AudioTransactionsHistory.user_bank == receiver_waudio_user_bank)
            .first()
        )
        assert receiver_transaction_record is not None
        assert receiver_transaction_record.transaction_type == TransactionType.tip
        assert receiver_transaction_record.method == TransactionMethod.receive
        assert receiver_transaction_record.change == 10000000000


# Transfer of WAUDIO to a non-userbank (external transfer)
def test_process_user_bank_txs_details_transfer_audio_external_tx(app):
    tx_response = mock_valid_waudio_transfer_from_user_bank_to_external_address
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

        tip = session.query(UserTip).filter(UserTip.signature == tx_sig_str).first()
        assert tip is None

        sender_transaction_record = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == tx_sig_str)
            .filter(AudioTransactionsHistory.user_bank == sender_waudio_user_bank)
            .first()
        )
        assert sender_transaction_record is not None
        assert sender_transaction_record.transaction_type == TransactionType.transfer
        assert sender_transaction_record.method == TransactionMethod.send
        assert sender_transaction_record.change == -10000000000

        receiver_transaction_record = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == tx_sig_str)
            .filter(AudioTransactionsHistory.user_bank == receiver_waudio_user_bank)
            .first()
        )
        assert receiver_transaction_record is None


# Creation of challenge event for tipping
def test_process_user_bank_txs_details_transfer_audio_tip_challenge_event(app):
    tx_response = mock_valid_waudio_transfer_between_user_banks
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
            timestamp=datetime.fromtimestamp(tx_response.value.block_time),
            challenge_event_bus=challenge_event_bus,
        )

        calls = [
            call(
                ChallengeEvent.send_tip,
                tx_response.value.slot,
                datetime.fromtimestamp(tx_response.value.block_time),
                sender_user_id,
            )
        ]
        challenge_event_bus.dispatch.assert_has_calls(calls)


def test_process_user_bank_tx_with_lookup_tables(app):
    tx_response = mock_lookup_tables_tx

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
            timestamp=datetime.fromtimestamp(tx_response.value.block_time),
            challenge_event_bus=challenge_event_bus,
        )
        sender_transaction_record = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == tx_sig_str)
            .filter(AudioTransactionsHistory.user_bank == sender_waudio_user_bank)
            .first()
        )
        assert sender_transaction_record is not None
        assert sender_transaction_record.transaction_type == TransactionType.transfer
        assert sender_transaction_record.method == TransactionMethod.send
        assert sender_transaction_record.change == -100000000
        assert (
            sender_transaction_record.tx_metadata
            == "42pcdG2k1SiZPbDDYsieJkRptSKQ8qqRZvVuotEKKyu3"
        )
