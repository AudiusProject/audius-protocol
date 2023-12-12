from datetime import datetime
import json
from unittest.mock import create_autospec, patch
import base58

from solders.rpc.responses import (
    GetTransactionResp,
    RpcConfirmedTransactionStatusWithSignature,
)
from solders.signature import Signature

from payment_router_mock_transactions import (
    mock_valid_track_purchase_single_recipient_tx,
)

from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.models.users.usdc_purchase import USDCPurchase
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.cache_user_balance import get_immediate_refresh_user_ids
from src.tasks.index_spl_token import (
    decode_memo_and_extract_vendor,
    parse_memo_instruction,
    parse_sol_tx_batch,
    parse_spl_token_transaction,
)
from src.tasks.index_payment_router import (
    process_payment_router_tx_details,
    process_payment_router_txs,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from src.utils.solana_indexing_logger import SolanaIndexingLogger


# TODO:
# 1. Get transactions into mock files
# 2. Make sure we override the PDA, mint, root account for tests
# 3. Make sure test db is set up with the 2 test users, test track, and user banks
# 4. tests:
#   - Transaction routing to 1 user with no memo (1 transfer transaction)
#   - Transaction routing to 2 users with no memo (2 transfer transactions)
#   - Transaction routing to 1 user with memo - valid purchase (1 transfer transaction, 1 purchase record)
#   - Transaction routing to 1 user with memo - has splits but not enough (1 transfer transaction, no purchase records)
#   - Transcation routing to 1 user with memo and pay extra - valid purchase (1 transfer transaction, 1 purchase record with pay extra field indicating the difference)
#   - Transactions with errors should be skipped


PAYMENT_ROUTER_PROGRAM = shared_config["solana"]["payment_router_program_address"]
USDC_MINT = shared_config["solana"]["usdc_mint"]


test_entries = {
    "users": [
        {
            "user_id": 1,
            "handle": "trackOwner",
            "wallet": "0xbe21befeada45e089031429d8ddd52765e996133",
        },
        {
            "user_id": 2,
            "handle": "trackBuyer",
            "wallet": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
        },
        {
            "user_id": 3,
            "handle": "thirdParty",
            "wallet": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
        },
    ],
    "usdc_user_bank_accounts": [
        {  # trackOwner
            "signature": "unused1",
            "ethereum_address": "0xbe21befeada45e089031429d8ddd52765e996133",
            "bank_account": "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
        },
        {  # trackBuyer
            "signature": "unused2",
            "ethereum_address": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
            "bank_account": "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
        },
        {  # thirdParty
            "signature": "unused3",
            "ethereum_address": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
            "bank_account": "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
        },
    ],
    "tracks": [
        {"track_id": 1, "title": "track 1", "owner_id": 1},
    ],
    "track_price_history": [
        {  # pay full price to trackOwner
            "track_id": 1,
            "splits": {"7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy": 1000000},
            "total_price_cents": 100,
        }
    ],
}


def test_process_payment_router_tx_details_valid_purchase(app):
    with app.app_context():
        db = get_db()

    transaction = (
        mock_valid_track_purchase_single_recipient_tx.value.transaction.transaction
    )

    tx_sig_str = str(transaction.signatures[0])

    challenge_event_bus = create_autospec(ChallengeEventBus)

    populate_mock_db(db, test_entries)

    with db.scoped_session() as session:
        process_payment_router_tx_details(
            session=session,
            tx_info=mock_valid_track_purchase_single_recipient_tx,
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

    # TODO Expect a purchase and transfer record (recipient only)


def test_process_payment_router_tx_details_valid_purchase_with_pay_extra():
    # TODO Expect a purchase record (w/ pay extra) and transfer record (recipient only)
    return


def test_process_payment_router_tx_details_valid_purchase_multiple_recipients():
    # TODO: Expect a purchase record and multiple transfer records (one for each recipient)
    return


def test_process_payment_router_tx_details_valid_purchase_multiple_recipients_pay_extra():
    # TODO: Expect a purchase record (w/ pay extra) and multiple transfer records (one for each recipient)
    return


def test_process_payment_router_tx_details_invalid_purchase_bad_splits():
    # TODO: Still expect transfer records, just not as a purchase
    return


def test_process_payment_router_tx_details_transfer_multiple_users_without_purchase():
    # TODO: Expect a transaction_type=transfer, method=receive for the recipients
    return


def test_process_payment_router_txs_details_create_challenge_events_for_purchase():
    # TODO Expect a challenge event for the content owner and purchaser_user_id
    return


def test_process_payment_router_tx_details_skip_errors():
    # TODO
    return


# Don't process any transactions that aren't Route or TransferChecked transactions
def test_process_payment_router_txs_details_skip_unknown_instructions():
    # TODO: Create a transaction that uses an unknown instruction with a balance change
    return


# Source accounts for Route intructions must belong to Payment Router PDA
def test_process_payment_router_txs_details_skip_unknown_PDA_ATAs():
    # TODO Create Route instruction with a PDA that doesn't match the Payment Router PDA
    # (Is this test useful? The program itself won't allow this to happen)
    return
