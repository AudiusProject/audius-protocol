import pytest

from integration_tests.utils import populate_mock_db
from src.models.users.usdc_transactions_history import USDCTransactionMethod
from src.queries.get_usdc_transactions_history import (
    GetUSDCTransactionsArgs,
    GetUSDCTransactionsCountArgs,
    get_usdc_transactions_history,
    get_usdc_transactions_history_count,
)
from src.queries.query_helpers import SortDirection, TransactionSortMethod
from src.utils.db_session import get_db

user1_id = 10
user1_name = "user1"
user1_eth_address = "0xe66402f9a6714a874a539fb1689b870dd271dfb2"
user1_user_bank_address = "7G1angvMtUZLFMyrMDGj7bxsduB4bjLD7VXRR7N4FXqe"

external_recipient_address = "3nmLmEzwBBjERiV9UU1a4JXzESwDjrKZdSjP1KG4M9Mc"
internal_recipient_address = "HXLN9UWwAjMPgHaFZDfgabT79SmLSdTeu2fUha2xHz9W"


@pytest.fixture
def test_entities():
    return {
        "users": [
            {"user_id": 1, "handle": "user1", "wallet": user1_eth_address},
        ],
        "usdc_user_bank_accounts": [
            {
                "signature": "unused1",
                "ethereum_address": user1_eth_address,
                "bank_account": user1_user_bank_address,
            }
        ],
        "usdc_transactions_history": [
            {
                "user_bank": user1_user_bank_address,
                "signature": "manualTransferSignature",
                "transaction_type": "transfer",
                "method": "send",
                "change": -1000000,
                "balance": 1000000,
                "tx_metadata": external_recipient_address,
            },
            {
                "user_bank": user1_user_bank_address,
                "signature": "firstPrepareWithdrawalSignature",
                "transaction_type": "prepare_withdrawal",
                "method": "send",
                "change": -1000000,
                "balance": 0,
                "tx_metadata": internal_recipient_address,
            },
            {
                "user_bank": user1_user_bank_address,
                "signature": "recoverWithdrawalSignature",
                "transaction_type": "recover_withdrawal",
                "method": "send",
                "change": 1000000,
                "balance": 1000000,
                "tx_metadata": internal_recipient_address,
            },
            {
                "user_bank": user1_user_bank_address,
                "signature": "secondPrepareWithdrawalSignature",
                "transaction_type": "prepare_withdrawal",
                "method": "send",
                "change": -1000000,
                "balance": 0,
                "tx_metadata": internal_recipient_address,
            },
            {
                "user_bank": user1_user_bank_address,
                "signature": "withdrawalSignature",
                "transaction_type": "withdrawal",
                "method": "send",
                "change": -1000000,
                "balance": 0,
                "tx_metadata": external_recipient_address,
            },
        ],
    }


def test_get_usdc_transactions_history_default_excludes_system_transactions(
    app, test_entities
):
    with app.test_request_context(
        # Request context and args are required for passing
        # pagination info into paginate_query inside the query function
        data={"limit": 10, "offset": 0},
    ):
        db = get_db()
        populate_mock_db(db, test_entities)
        transactions = get_usdc_transactions_history(
            GetUSDCTransactionsArgs(
                user_id=1,
                transaction_method=USDCTransactionMethod.send,
                sort_method=TransactionSortMethod.date,
                sort_direction=SortDirection.asc,
            )
        )
        count = get_usdc_transactions_history_count(
            GetUSDCTransactionsCountArgs(
                user_id=1,
                transaction_method=USDCTransactionMethod.send,
            )
        )
        assert len(transactions) == 2
        assert count == 2
        assert transactions[0]["signature"] == "manualTransferSignature"
        assert transactions[1]["signature"] == "withdrawalSignature"


def test_get_usdc_transactions_including_system_transactions(app, test_entities):
    with app.test_request_context(
        # Request context and args are required for passing
        # pagination info into paginate_query inside the query function
        data={"limit": 10, "offset": 0},
    ):
        db = get_db()
        populate_mock_db(db, test_entities)
        transactions = get_usdc_transactions_history(
            GetUSDCTransactionsArgs(
                user_id=1,
                transaction_method=USDCTransactionMethod.send,
                sort_method=TransactionSortMethod.date,
                sort_direction=SortDirection.asc,
                include_system_transactions=True,
            )
        )
        count = get_usdc_transactions_history_count(
            GetUSDCTransactionsCountArgs(
                user_id=1,
                transaction_method=USDCTransactionMethod.send,
                include_system_transactions=True,
            )
        )
        assert len(transactions) == 5
        assert count == 5
        assert transactions[0]["signature"] == "manualTransferSignature"
        assert transactions[1]["signature"] == "firstPrepareWithdrawalSignature"
        assert transactions[2]["signature"] == "recoverWithdrawalSignature"
        assert transactions[3]["signature"] == "secondPrepareWithdrawalSignature"
        assert transactions[4]["signature"] == "withdrawalSignature"
