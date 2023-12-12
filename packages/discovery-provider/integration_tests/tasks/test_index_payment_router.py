import json
from unittest.mock import create_autospec, patch

from solders.rpc.responses import (
    GetTransactionResp,
    RpcConfirmedTransactionStatusWithSignature,
)
from solders.signature import Signature

from payment_router_mock_transactions import (
    mock_valid_track_purchase_single_recipient_tx
)

from integration_tests.utils import populate_mock_db
from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.cache_user_balance import get_immediate_refresh_user_ids
from src.tasks.index_spl_token import (
    decode_memo_and_extract_vendor,
    parse_memo_instruction,
    parse_sol_tx_batch,
    parse_spl_token_transaction,
)
from src.tasks.index_payment_router import (
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
            "signature": "unused",
            "ethereum_address": "0xbe21befeada45e089031429d8ddd52765e996133",
            "bank_account": "7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy",
        },
        {  # trackBuyer
            "signature": "unused",
            "ethereum_address": "0xe769dcccbfd4df3eb3758e6f4bf6043132906df8",
            "bank_account": "38YSndmPWVF3UdzczbB3UMYUgPQtZrgvvPVHa3M4yQVX",
        },
        {  # thirdParty
            "signature": "unused",
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


def test_process_payment_router_tx_details_valid_purchase():
    # TODO Expect a purchase and transfer record (recipient only)
    return

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
    #TODO: Still expect transfer records, just not as a purchase
    return

def test_process_payment_router_tx_details_transfer_multiple_users_without_purchase():
    #TODO: Expect a transaction_type=transfer, method=receive for the recipients
    return

def test_process_payment_router_txs_details_create_challenge_events_for_purchase():
    #TODO Expect a challenge event for the content owner and purchaser_user_id
    return

def test_process_payment_router_tx_details_skip_errors():
    #TODO
    return

# Don't process any transactions that aren't Route or TransferChecked transactions
def test_process_payment_router_txs_details_skip_unknown_instructions():
    #TODO: Create a transaction that uses an unknown instruction with a balance change
    return

# Source accounts for Route intructions must belong to Payment Router PDA
def test_process_payment_router_txs_details_skip_unknown_PDA_ATAs():
    #TODO Create Route instruction with a PDA that doesn't match the Payment Router PDA
    # (Is this test useful? The program itself won't allow this to happen)
    return





"""
Mock data in these test cases produced with:
from solana.rpc.api import Client
from solders.signature import Signature
c = Client("https://api.mainnet-beta.solana.com")
c.get_transaction(
    Signature.from_string(<signature>),
    'json'
).to_json()
"""

"""
Signature: 2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ
"""
mock_create_account_tx_info = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 123063101,
                "transaction": {
                    "signatures": [
                        "2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 6,
                        },
                        "accountKeys": [
                            "CgJhbUdHQNN5HBeNEN7J69Z89emh6BtyYX1CPEGwaeqi",
                            "AjMbFboAibXRH9vARK3KvDhnxuyCKjon2nmtbaC4UtnQ",
                            "Fipj4SLmTBmS7BSgDqeMPb7F86YWUUKajvDgQUWaHwWf",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "11111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "SysvarRent111111111111111111111111111111111",
                            "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
                        ],
                        "recentBlockhash": "4BNdtYfc8G1mSRFhwv7523CHCP3XPt92ASyV9kwvRMd3",
                        "instructions": [
                            {
                                "programIdIndex": 7,
                                "accounts": [0, 1, 2, 3, 4, 5, 6],
                                "data": "",
                                "stackHeight": None,
                            }
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        2713302404,
                        0,
                        3129270260,
                        260042654,
                        1,
                        953185920,
                        1009200,
                        898174080,
                    ],
                    "postBalances": [
                        2711258124,
                        2039280,
                        3129270260,
                        260042654,
                        1,
                        953185920,
                        1009200,
                        898174080,
                    ],
                    "innerInstructions": [
                        {
                            "index": 0,
                            "instructions": [
                                {
                                    "programIdIndex": 4,
                                    "accounts": [0, 1],
                                    "data": "3Bxs4h24hBtQy9rw",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 4,
                                    "accounts": [1],
                                    "data": "9krTDU2LzCSUJuVZ",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 4,
                                    "accounts": [1],
                                    "data": "SYXsBSQy3GeifSEQSGvTbrPNposbSAiSoh1YA85wcvGKSnYg",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 5,
                                    "accounts": [1, 3, 2, 6],
                                    "data": "2",
                                    "stackHeight": None,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
                        "Program log: Transfer 2039280 lamports to the associated token account",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        "Program log: Allocate space for the associated token account",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        "Program log: Assign the associated token account to the SPL Token program",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        "Program log: Initialize the associated token account",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: InitializeAccount",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3272 of 176939 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 27014 of 200000 compute units",
                        "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
                    ],
                    "preTokenBalances": [],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "Fipj4SLmTBmS7BSgDqeMPb7F86YWUUKajvDgQUWaHwWf",
                        }
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1646174251,
            },
            "id": 0,
        }
    )
)

mock_confirmed_signature_for_address = Signature.from_string(
    "2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ"
)


def test_parse_spl_token_transaction_no_results():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = (
        mock_create_account_tx_info
    )
    tx_infos = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_infos == None


"""
Signature: 2qAJ4Rmf3GZ4ZK62wh2v3QaXmhtKviUym7aM1uJg2rJED2H7tBcjGoxwsMnzyt47Yy1B5je9guGpfpwoTGECVgRf
"""
mock_transfer_tx_info = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 123063718,
                "transaction": {
                    "signatures": [
                        "2qAJ4Rmf3GZ4ZK62wh2v3QaXmhtKviUym7aM1uJg2rJED2H7tBcjGoxwsMnzyt47Yy1B5je9guGpfpwoTGECVgRf"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 2,
                        },
                        "accountKeys": [
                            "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                            "9f79QvW5XQ1XCXGLeCCHjBZkPet51yAPxtU7fcaY6UxD",
                            "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "3G8aEDJmiNHANrsBw4Ac6wXJmdURRiLg1VtSoiWF9q2o",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [1, 3, 2, 0],
                                "data": "g7RNMm7FSEK3u",
                                "stackHeight": None,
                            }
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [109538424, 2039280, 2039280, 260042654, 953185920],
                    "postBalances": [109533424, 2039280, 2039280, 260042654, 953185920],
                    "innerInstructions": [],
                    "logMessages": [
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3383 of 200000 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 71.00000058,
                                "decimals": 8,
                                "amount": "7100000058",
                                "uiAmountString": "71.00000058",
                            },
                            "owner": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 2.0,
                                "decimals": 8,
                                "amount": "200000000",
                                "uiAmountString": "2",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 68.00000058,
                                "decimals": 8,
                                "amount": "6800000058",
                                "uiAmountString": "68.00000058",
                            },
                            "owner": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 5.0,
                                "decimals": 8,
                                "amount": "500000000",
                                "uiAmountString": "5",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1646174617,
            },
            "id": 0,
        }
    )
)


def test_parse_spl_token_transaction():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_transfer_tx_info
    tx_infos = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_infos[0]["user_bank"] == "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9"
    assert tx_infos[0]["root_accounts"] == [
        "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_infos[0]["token_accounts"] == [
        "9f79QvW5XQ1XCXGLeCCHjBZkPet51yAPxtU7fcaY6UxD",
        "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
    ]


"""
Signature: 2n4gYtnZLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw
"""
mock_purchase_tx_info_1 = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 155160519,
                "transaction": {
                    "signatures": [
                        "2n4gYtnZLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 3,
                        },
                        "accountKeys": [
                            "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                            "C4qrWm6kkLwUNExA2Ldt6uXLroRfcTGXJLx1zGvEt5DB",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "CChCbrfGJgYkqSf3FUHqMmhEd3TXxBoKDAk6ZZx9QGfZ",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [0],
                                "data": "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [2, 3, 1, 0],
                                "data": "iJsU9Sk8HPLQP",
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        2940160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "postBalances": [
                        2935160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "innerInstructions": [],
                    "logMessages": [
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 651 of 400000 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399349 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 5.0,
                                "decimals": 8,
                                "amount": "500000000",
                                "uiAmountString": "5",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 51.23032749,
                                "decimals": 8,
                                "amount": "5123032749",
                                "uiAmountString": "51.23032749",
                            },
                            "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 56.23032749,
                                "decimals": 8,
                                "amount": "5623032749",
                                "uiAmountString": "56.23032749",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1665685554,
            },
            "id": 0,
        }
    )
)

"""
Signature: iBTtH8W1ViHdnAzQYNKovYsBszHvikwUAG4V8Qk5HNWQRCYc468ugKnoYSqL6f7LLmbKa5ZYFSLaEbZuH42fbBM
"""
mock_purchase_tx_info_2 = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 158882288,
                "transaction": {
                    "signatures": [
                        "iBTtH8W1ViHdnAzQYNKovYsBszHvikwUAG4V8Qk5HNWQRCYc468ugKnoYSqL6f7LLmbKa5ZYFSLaEbZuH42fbBM"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 3,
                        },
                        "accountKeys": [
                            "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
                            "8aEJ32LCGaGbNbidd1Gg33yqvZ11AXfAzzEAXxAJEzA8",
                            "HTmKqU5T3uhzz6heG47awyVuzcbWu9o4rE1HtrXv5ACg",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "23SZfDKbmSqtHaR9F2UMkRzTvvoTo8NT7oRH5VB3D5xh",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [0],
                                "data": "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [1, 3, 2, 0],
                                "data": "iTUiLjKABVyv7",
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        2935160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "postBalances": [
                        2930160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "innerInstructions": [],
                    "logMessages": [
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 400000 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399412 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 10.25896376,
                                "decimals": 8,
                                "amount": "1025896376",
                                "uiAmountString": "10.25896376",
                            },
                            "owner": "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 117.54707634,
                                "decimals": 8,
                                "amount": "11754707634",
                                "uiAmountString": "117.54707634",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 127.8060401,
                                "decimals": 8,
                                "amount": "12780604010",
                                "uiAmountString": "127.8060401",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1667410823,
            },
            "id": 0,
        }
    )
)


"""
Signature: 2n4gYtnZLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw
"""
mock_purchase_tx_info_invalid = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 155160519,
                "transaction": {
                    "signatures": [
                        # not real
                        "3Vq94guk3pRLy1do3f3eFP3uWfUHaBznVXqG56aBij5nunD5NvXfq8H8cUNsJp6J3uSaJTpRthbvAahSJZ69NPsz"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 3,
                        },
                        "accountKeys": [
                            "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            # not real account
                            "badmj9d5PHqyJgPpzSHEmZuMoy8cUBPDAztsFNSW6AB",
                            "C4qrWm6kkLwUNExA2Ldt6uXLroRfcTGXJLx1zGvEt5DB",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        ],
                        "recentBlockhash": "CChCbrfGJgYkqSf3FUHqMmhEd3TXxBoKDAk6ZZx9QGfZ",
                        "instructions": [
                            {
                                "programIdIndex": 4,
                                "accounts": [0],
                                "data": "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 5,
                                "accounts": [2, 3, 1, 0],
                                "data": "iJsU9Sk8HPLQP",
                                "stackHeight": None,
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5000,
                    "preBalances": [
                        2940160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "postBalances": [
                        2935160,
                        2039280,
                        2039280,
                        260042654,
                        121159680,
                        934087680,
                    ],
                    "innerInstructions": [],
                    "logMessages": [
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 651 of 400000 compute units",
                        "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399349 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 5.0,
                                "decimals": 8,
                                "amount": "500000000",
                                "uiAmountString": "5",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 51.23032749,
                                "decimals": 8,
                                "amount": "5123032749",
                                "uiAmountString": "51.23032749",
                            },
                            "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 56.23032749,
                                "decimals": 8,
                                "amount": "5623032749",
                                "uiAmountString": "56.23032749",
                            },
                            "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 2,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {"writable": [], "readonly": []},
                },
                "blockTime": 1665685554,
            },
            "id": 0,
        }
    )
)


mock_confirmed_signature_spl_tx_info_v0 = Signature.from_string(
    "2ML2h2YwBmRqgmF86EvxdZMJCBwBDtspaqANpqdm4ajuKCnL7K7nXuHK7AMeBe9Zk7yJp3KR4V28WZ8tPApaQB6t"
)


"""
Signature: 2ML2h2YwBmRqgmF86EvxdZMJCBwBDtspaqANpqdm4ajuKCnL7K7nXuHK7AMeBe9Zk7yJp3KR4V28WZ8tPApaQB6t
"""
mock_spl_tx_info_v0 = GetTransactionResp.from_json(
    json.dumps(
        {
            "jsonrpc": "2.0",
            "result": {
                "slot": 209280836,
                "transaction": {
                    "signatures": [
                        "2ML2h2YwBmRqgmF86EvxdZMJCBwBDtspaqANpqdm4ajuKCnL7K7nXuHK7AMeBe9Zk7yJp3KR4V28WZ8tPApaQB6t"
                    ],
                    "message": {
                        "header": {
                            "numRequiredSignatures": 1,
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 6,
                        },
                        "accountKeys": [
                            "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
                            "JSvtokJbtGsYhneKomFBjnJh4djEQLdHV2kAeS43bBZ",
                            "24oqQXbKb3o4s7uekMienV5g3UePtYjB4xxtkMWJSLTd",
                            "2VLv56bYGyzahopzj9ZcBD2YUseadwVuthAsVva2k2Er",
                            "2Wg45BET6HwsPpTE5titBtchk97jZe2Ed3MhAfJ4SQvF",
                            "7WqjtUUrZntXiWz5gQZyAMyL6iMRdQ2o8u27HRdCFnB6",
                            "9WyYVAkVmfnEWJsTrWgCGXSzrkBCq4XpczBRnFa1yKoS",
                            "FcHUTdSScVovLiu7qZxD78N3xDGSFGGBcDco1959DZXg",
                            "H1qQ6Hent1C5wa4Hc3GK2V1sgg4grvDBbmKd5H8dsTmo",
                            "HWRNE1CVdbPWeB6DPAt6JT3Me3KqaMwm9ZHo2Qf1UFst",
                            "ComputeBudget111111111111111111111111111111",
                            "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
                            "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
                        ],
                        "recentBlockhash": "CAyU8PZGwGwH1rcdGrt3nmkEsPWUANTGN4W96g2A44e9",
                        "instructions": [
                            {
                                "programIdIndex": 10,
                                "accounts": [],
                                "data": "K1FDJ7",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 10,
                                "accounts": [],
                                "data": "3F8aKq24k59R",
                                "stackHeight": None,
                            },
                            {
                                "programIdIndex": 11,
                                "accounts": [
                                    33,
                                    13,
                                    0,
                                    6,
                                    7,
                                    3,
                                    9,
                                    14,
                                    12,
                                    11,
                                    11,
                                    15,
                                    11,
                                    36,
                                    33,
                                    16,
                                    35,
                                    17,
                                    18,
                                    19,
                                    37,
                                    20,
                                    16,
                                    16,
                                    16,
                                    16,
                                    16,
                                    16,
                                    7,
                                    1,
                                    13,
                                    39,
                                    40,
                                    25,
                                    13,
                                    8,
                                    1,
                                    26,
                                    24,
                                    33,
                                    34,
                                    33,
                                    13,
                                    23,
                                    8,
                                    21,
                                    1,
                                    22,
                                    2,
                                    4,
                                    5,
                                    38,
                                    34,
                                    33,
                                    13,
                                    30,
                                    8,
                                    27,
                                    3,
                                    32,
                                    28,
                                    31,
                                    29,
                                    41,
                                ],
                                "data": "BWAry1sSeCvqdziXQaXVDhBChgzF17MtpZ98KRv2XBUmtsUkMwct2rr1rnh5P216T8hNuM",
                                "stackHeight": None,
                            },
                        ],
                        "addressTableLookups": [
                            {
                                "accountKey": "77GdiNCiB2vsrGnfBDBAy31WKUC1BsnpPVqobNArysdn",
                                "writableIndexes": [56, 58, 59, 60, 62],
                                "readonlyIndexes": [1, 15, 3, 0, 7],
                            },
                            {
                                "accountKey": "5nuw6XREo7Z1yrbx2uTfBQqfW5jrHajJt7KKsxLouW1Y",
                                "writableIndexes": [3, 4, 2],
                                "readonlyIndexes": [8],
                            },
                            {
                                "accountKey": "BTvBcTswkqpgbuKMU2zCdAhnXQsevXjM7ASXe4smm8ct",
                                "writableIndexes": [73, 71, 72],
                                "readonlyIndexes": [63, 64],
                            },
                            {
                                "accountKey": "sSfUTVBAhFLsePUpvwiWpszanjic6Y9oQGHZ1vLMprN",
                                "writableIndexes": [89, 91, 93, 88, 92, 90],
                                "readonlyIndexes": [94],
                            },
                        ],
                    },
                },
                "meta": {
                    "err": None,
                    "status": {"Ok": None},
                    "fee": 5014,
                    "preBalances": [
                        5738474176,
                        2039280,
                        70407360,
                        2039280,
                        70407360,
                        70407360,
                        2039280,
                        2039280,
                        30058239,
                        2039280,
                        1,
                        1141440,
                        1745924130,
                        0,
                        260042654,
                        0,
                        6124800,
                        23357760,
                        2039280,
                        2039280,
                        3591360,
                        5090627106578,
                        2039280,
                        5435760,
                        2039280,
                        11996367360,
                        2159469039280,
                        16733670319,
                        70407360,
                        70407360,
                        5435760,
                        70407360,
                        2039280,
                        934087680,
                        1141440,
                        283356390,
                        1141440,
                        1141440,
                        0,
                        1141440,
                        0,
                        0,
                    ],
                    "postBalances": [
                        5738469162,
                        2039280,
                        70407360,
                        2039280,
                        70407360,
                        70407360,
                        2039280,
                        2039280,
                        30058239,
                        2039280,
                        1,
                        1141440,
                        1745924130,
                        0,
                        260042654,
                        0,
                        6124800,
                        23357760,
                        2039280,
                        2039280,
                        3591360,
                        5090360343509,
                        2039280,
                        5435760,
                        2039280,
                        11996367360,
                        2157069039280,
                        19400433388,
                        70407360,
                        70407360,
                        5435760,
                        70407360,
                        2039280,
                        934087680,
                        1141440,
                        283356390,
                        1141440,
                        1141440,
                        0,
                        1141440,
                        0,
                        0,
                    ],
                    "innerInstructions": [
                        {
                            "index": 2,
                            "instructions": [
                                {
                                    "programIdIndex": 33,
                                    "accounts": [6, 14, 7, 0],
                                    "data": "huuGbDMUEyoU3",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 36,
                                    "accounts": [
                                        33,
                                        16,
                                        35,
                                        17,
                                        18,
                                        19,
                                        37,
                                        20,
                                        16,
                                        16,
                                        16,
                                        16,
                                        16,
                                        16,
                                        7,
                                        1,
                                        13,
                                    ],
                                    "data": "6D4dbMCz2KJYHkVUEiz5GL7",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [7, 18, 13],
                                    "data": "3dEigAqSvsFu",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [19, 1, 35],
                                    "data": "3MxTJ5HLsT4j",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 11,
                                    "accounts": [15],
                                    "data": "QMqFu4fYGGeUEysFnenhAvR83g86EDDNxzUskfkWKYCBPWe1hqgD6jgKAXr6aYoEQcEzbgh6RmXznjrXchceoAj7c6e3cM5E1N25UmdUeSoYBhwvZieJUCJ9YnNyhphDK3bPuPErASve98pS753DiHe7WML9b9eg9uFaGgT5wA7eCYf",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 39,
                                    "accounts": [39, 40, 25, 13, 8, 1, 26, 24, 33],
                                    "data": "1AMTAauCh9UPEJKN7DQMVso49cnfiKCGS4pPj7dsJf6JRkn1C6YxPcb6kAdCDVcFb1Y5Qb8ACf",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [26, 8, 26],
                                    "data": "3DUUTySPf5RH",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [1, 24, 13],
                                    "data": "3Gb1qKegUuwm",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 39,
                                    "accounts": [40],
                                    "data": "9bruwfMBFHpjNCHMjjxyRXnKsgBqMBstxdM9Bo4JZwZVUrB3eT5smqk6BsdmhpMnGtvV5q1voNNE7enFskXydQdAqkL7nxjmoje9TtzYBoTMm4qyVbtUkfMye1ZJSs8xoiN8oCEbxc8c6Tq8Y1yfYq8b221h6wqSfipPim5XLmYXkLm32Rizkt9oN16XXGWw2DcUiK9zMWd1aF88XJyNR61WMbjnVHTdAPoVwjE8mgoSZyw6wYBwUejQ63PUb5YD62EsUjHYxZZvbm1PEDD4s",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 11,
                                    "accounts": [15],
                                    "data": "QMqFu4fYGGeUEysFnenhAvByRXZbTme1qDxf1F3AKLUXRXgSbHSGSyxqbH3GFRxnJ6SVB39MxAtu4iRaTJwgcDLeiToZ2svgbbCzgANxJtg5acZHK9RPeJbP8PwHMSuwL4pMfBE3oJKtW3boo8E1EyfdyGZf7TYAqvxu4RapNmAJ7jm",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 34,
                                    "accounts": [33, 13, 23, 8, 21, 1, 22, 2, 4, 5, 38],
                                    "data": "59p8WydnSZtUGoS81cETFegvkXfPyLMpr6tGfNMHxioBMeskZXqWPtv1j5",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [1, 22, 13],
                                    "data": "3XfqZdF51cvK",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [21, 8, 23],
                                    "data": "3Pk2xCrxJPDy",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 11,
                                    "accounts": [15],
                                    "data": "QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqkMXcsUXJG1WLwjdCWzNTL6957kdfWSD7SPFG2av5YHKd6bCLS2tNXnMxCtTYryFEE4iakv6cTBps9vDbNGdjSRohyrvHrzQbG6P8kf2nNyNxCX",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 34,
                                    "accounts": [
                                        33,
                                        13,
                                        30,
                                        8,
                                        27,
                                        3,
                                        32,
                                        28,
                                        31,
                                        29,
                                        41,
                                    ],
                                    "data": "59p8WydnSZtTCnBx72GzogsiKBnuuMq3oFwENEskTq63krQp1XKVYCwDDS",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [8, 27, 13],
                                    "data": "3PkwpVMU9UB1",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [32, 3, 30],
                                    "data": "3n72Fyiht5BM",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 11,
                                    "accounts": [15],
                                    "data": "QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqiFwoETYwdqiPRSaEKSWpjDuenVF1jJfDrxNf9W2BiSt1egQSKJNtM56BLeVXnY9yzgeADV2dNuaRfdzXtFwrApfnCr38YcvdrdAtNS9V7uHm2P",
                                    "stackHeight": None,
                                },
                                {
                                    "programIdIndex": 33,
                                    "accounts": [3, 12, 9, 13],
                                    "data": "ib3JCSHiEeRNm",
                                    "stackHeight": None,
                                },
                            ],
                        }
                    ],
                    "logMessages": [
                        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
                        "Program ComputeBudget111111111111111111111111111111 success",
                        "Program ComputeBudget111111111111111111111111111111 invoke [1]",
                        "Program ComputeBudget111111111111111111111111111111 success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]",
                        "Program log: Instruction: SharedAccountsRoute",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 1379190 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [2]",
                        "Program log: ray_log: A44pqEoIAAAAAAAAAAAAAAACAAAAAAAAAI4pqEoIAAAAx3C3ffesAAD5kEgSSwAAADLOlgMAAAAA",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1333929 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1326364 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 29770 of 1350768 compute units",
                        "Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1318175 compute units",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY invoke [2]",
                        "Program log: Discriminant for phoenix::program::accounts::MarketHeader is 8167313896524341111",
                        "Program log: PhoenixInstruction::Swap",
                        "Program consumption: 1292774 units remaining",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1276231 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1268823 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program log: Sending batch 1 with header and 2 market events, total events sent: 2",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY invoke [3]",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY consumed 582 of 1261695 compute units",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY success",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY consumed 37180 of 1297755 compute units",
                        "Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1258086 compute units",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]",
                        "Program log: Instruction: Swap",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1209112 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 1201565 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 47734 of 1240505 compute units",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1190090 compute units",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]",
                        "Program log: Instruction: Swap",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 1132456 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1124821 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 56393 of 1172511 compute units",
                        "Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1113437 compute units",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: TransferChecked",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 1108028 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 300634 of 1400000 compute units",
                        "Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 wy1ELh0AAAA=",
                        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success",
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 2.998004,
                                "decimals": 6,
                                "amount": "2998004",
                                "uiAmountString": "2.998004",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 6,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 356.12273038,
                                "decimals": 8,
                                "amount": "35612273038",
                                "uiAmountString": "356.12273038",
                            },
                            "owner": "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 7,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 8,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 0.028018959,
                                "decimals": 9,
                                "amount": "28018959",
                                "uiAmountString": "0.028018959",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 9,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": 594827.986351,
                                "decimals": 6,
                                "amount": "594827986351",
                                "uiAmountString": "594827.986351",
                            },
                            "owner": "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 18,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 1901789.66073543,
                                "decimals": 8,
                                "amount": "190178966073543",
                                "uiAmountString": "1901789.66073543",
                            },
                            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 19,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 322429.292793,
                                "decimals": 6,
                                "amount": "322429292793",
                                "uiAmountString": "322429.292793",
                            },
                            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 21,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 5090.625067298,
                                "decimals": 9,
                                "amount": "5090625067298",
                                "uiAmountString": "5090.625067298",
                            },
                            "owner": "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 22,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 30213.573619,
                                "decimals": 6,
                                "amount": "30213573619",
                                "uiAmountString": "30213.573619",
                            },
                            "owner": "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 24,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 32162.493746,
                                "decimals": 6,
                                "amount": "32162493746",
                                "uiAmountString": "32162.493746",
                            },
                            "owner": "3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 26,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 2159.467,
                                "decimals": 9,
                                "amount": "2159467000000",
                                "uiAmountString": "2159.467",
                            },
                            "owner": "8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 27,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 16.731631039,
                                "decimals": 9,
                                "amount": "16731631039",
                                "uiAmountString": "16.731631039",
                            },
                            "owner": "Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 32,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": 974341.597038,
                                "decimals": 6,
                                "amount": "974341597038",
                                "uiAmountString": "974341.597038",
                            },
                            "owner": "Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 3.01252,
                                "decimals": 6,
                                "amount": "3012520",
                                "uiAmountString": "3.01252",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 3,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 6,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 6,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 7,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": None,
                                "decimals": 8,
                                "amount": "0",
                                "uiAmountString": "0",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 8,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 0.028018959,
                                "decimals": 9,
                                "amount": "28018959",
                                "uiAmountString": "0.028018959",
                            },
                            "owner": "2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 9,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": 720158.258034,
                                "decimals": 6,
                                "amount": "720158258034",
                                "uiAmountString": "720158.258034",
                            },
                            "owner": "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 18,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "uiTokenAmount": {
                                "uiAmount": 1902145.78346581,
                                "decimals": 8,
                                "amount": "190214578346581",
                                "uiAmountString": "1902145.78346581",
                            },
                            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 19,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 322369.077959,
                                "decimals": 6,
                                "amount": "322369077959",
                                "uiAmountString": "322369.077959",
                            },
                            "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 21,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 5090.358304229,
                                "decimals": 9,
                                "amount": "5090358304229",
                                "uiAmountString": "5090.358304229",
                            },
                            "owner": "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 22,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 30219.595103,
                                "decimals": 6,
                                "amount": "30219595103",
                                "uiAmountString": "30219.595103",
                            },
                            "owner": "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 24,
                            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                            "uiTokenAmount": {
                                "uiAmount": 32216.67258,
                                "decimals": 6,
                                "amount": "32216672580",
                                "uiAmountString": "32216.67258",
                            },
                            "owner": "3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 26,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 2157.067,
                                "decimals": 9,
                                "amount": "2157067000000",
                                "uiAmountString": "2157.067",
                            },
                            "owner": "8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 27,
                            "mint": "So11111111111111111111111111111111111111112",
                            "uiTokenAmount": {
                                "uiAmount": 19.398394108,
                                "decimals": 9,
                                "amount": "19398394108",
                                "uiAmountString": "19.398394108",
                            },
                            "owner": "Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                        {
                            "accountIndex": 32,
                            "mint": "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
                            "uiTokenAmount": {
                                "uiAmount": 849011.325355,
                                "decimals": 6,
                                "amount": "849011325355",
                                "uiAmountString": "849011.325355",
                            },
                            "owner": "Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP",
                            "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                        },
                    ],
                    "rewards": [],
                    "loadedAddresses": {
                        "writable": [
                            "4EbdAfaShVDNeHm6GbXZX3xsKccRHdTbR5962Bvya8xt",
                            "7uvYqyiiqEw3vKkFdnRUbmZgMNSsDXZMo57ZmEeDUavg",
                            "CmMV3U4QYsykzM1fEYi3zoZh6A3ktmTKQpJxgignK1YR",
                            "DD3baZQb3PFkk7NmJXRj9Ab7o1oq2h1mUae2FmEnJCs3",
                            "FxquLRmVMPXiS84FFSp8q5fbVExhLkX85yiXucyu7xSC",
                            "6mQ8xEaHdTikyMvvMxUctYch6dUjnKgfoeib2msyMMi1",
                            "AQ36QRk3HAe6PHqBCtKTQnYKpt2kAagq9YoeTqUPMGHx",
                            "FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q",
                            "3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ",
                            "4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg",
                            "8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG",
                            "6wLM5GfteP3uzyeapfjAAZwcHF5gQjXJ2J4Ed4DYjDnN",
                            "8LaSXrX7BxMXnh6A3JvSwNQoVifC36Bc8hbMGTW8Swi7",
                            "8X8U4iy379gGLcLpdH41uRw2skTDBdy9EiaqdRMVqZad",
                            "Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP",
                            "GAYVeqmm6xeEQp5154hTruzgoDw1KbFmbXnzzPsxnFqW",
                            "HVBuRsZHAGHL8xKp4DmJFVhLsSDXaDVsxbCykPvnUmHL",
                        ],
                        "readonly": [
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
                            "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
                            "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
                            "923j69hYbT5Set5kYfiQr1D8jPL6z15tbfTbVLSwUWJD",
                            "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
                            "7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR",
                            "H8oVxtJnyN81BjE5wZTz4DkX53k1BNRNyC9eT61q2bRH",
                        ],
                    },
                    "returnData": {
                        "programId": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
                        "data": ["wy1ELh0=", "base64"],
                    },
                    "computeUnitsConsumed": 300634,
                },
                "version": 0,
                "blockTime": 1691102059,
            },
            "id": 0,
        }
    )
)


def test_parse_memo_instruction():
    memo = parse_memo_instruction(
        mock_transfer_tx_info.value.transaction.transaction.message
    )
    assert not memo
    memo = parse_memo_instruction(
        mock_purchase_tx_info_2.value.transaction.transaction.message
    )
    assert memo == "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz"
    vendor = decode_memo_and_extract_vendor(memo)
    assert vendor == "Link by Stripe"


def test_parse_spl_token_purchase_transactions():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_purchase_tx_info_1
    tx_infos = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_infos[0]["user_bank"] == "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556"
    assert tx_infos[0]["root_accounts"] == [
        "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_infos[0]["token_accounts"] == [
        "C4qrWm6kkLwUNExA2Ldt6uXLroRfcTGXJLx1zGvEt5DB",
        "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
    ]
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_purchase_tx_info_2
    tx_infos = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_infos[0]["user_bank"] == "HTmKqU5T3uhzz6heG47awyVuzcbWu9o4rE1HtrXv5ACg"
    assert tx_infos[0]["root_accounts"] == [
        "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_infos[0]["token_accounts"] == [
        "8aEJ32LCGaGbNbidd1Gg33yqvZ11AXfAzzEAXxAJEzA8",
        "HTmKqU5T3uhzz6heG47awyVuzcbWu9o4rE1HtrXv5ACg",
    ]


@patch(
    "src.tasks.index_spl_token.WAUDIO_MINT",
    "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
)
def test_parse_spl_token_v0_transaction():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_spl_tx_info_v0
    tx_infos = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_spl_tx_info_v0
    )
    assert tx_infos[0]["user_bank"] == "CmMV3U4QYsykzM1fEYi3zoZh6A3ktmTKQpJxgignK1YR"
    assert tx_infos[0]["root_accounts"] == [
        "8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt",
        "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    ]
    assert tx_infos[0]["token_accounts"] == [
        "9WyYVAkVmfnEWJsTrWgCGXSzrkBCq4XpczBRnFa1yKoS",
        "CmMV3U4QYsykzM1fEYi3zoZh6A3ktmTKQpJxgignK1YR",
    ]
    assert tx_infos[0]["sender_wallet"] == None


def test_fetch_and_parse_sol_rewards_transfer_instruction(app):  # pylint: disable=W0621
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_transfer_tx_info

    test_entries = {
        "users": [
            {
                "user_id": 1,
                "handle": "piazza",
                "wallet": "0x0403be3560116a12b467855cb29a393174a59876",
            },
            {
                "user_id": 2,
                "handle": "piazzatron",
                "wallet": "0x0403be3560116a12b467855cb29a393174a59875",
            },
            {
                "user_id": 3,
                "handle": "asdf33",
                "wallet": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
            },
        ],
        "user_bank_accounts": [
            {  # user 1
                "signature": "doesntmatter",
                "ethereum_address": "0x0403be3560116a12b467855cb29a393174a59876",
                "bank_account": "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
            },
            {
                "signature": "hellothere",
                "ethereum_address": "0x7d12457bd24ce79b62e66e915dbc0a469a6b59ba",
                "bank_account": "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
            },
        ],
        "associated_wallets": [
            {"user_id": 2, "wallet": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4"},
        ],
    }

    mock_confirmed_signature_for_address = RpcConfirmedTransactionStatusWithSignature.from_json(
        json.dumps(
            {
                "err": None,
                "memo": None,
                "signature": "4mRtFjexnGFLimCQesk1eTYSphzmEz2rPt6dmfeBd6uEWALL4addY4mzULyxfKG7DVvsYNmxWNNsm9m8jHBjmE7J",
                "slot": 123209431,
                "blockTime": 1646261596,
                "confirmationStatus": "finalized",
            }
        )
    )
    solana_logger = SolanaIndexingLogger("test")

    populate_mock_db(db, test_entries)
    parse_sol_tx_batch(
        db,
        solana_client_manager_mock,
        redis,
        [mock_confirmed_signature_for_address],
        solana_logger,
    )
    with db.scoped_session() as session:
        # Verify that the latest signature and slot were updated
        spl_token_tx = session.query(SPLTokenTransaction).first()
        assert (
            spl_token_tx.last_scanned_slot == mock_confirmed_signature_for_address.slot
        )
        assert spl_token_tx.signature == str(
            mock_confirmed_signature_for_address.signature
        )

        # Verify that user 1 and 2 were added to the redis refresh queue
        refresh_user_ids = get_immediate_refresh_user_ids(redis)
        refresh_user_ids.sort()
        assert len(refresh_user_ids) == 2
        assert refresh_user_ids == [1, 2]

    mock_confirmed_signature_for_address = RpcConfirmedTransactionStatusWithSignature.from_json(
        json.dumps(
            {
                "err": None,
                "memo": None,
                "signature": "2n4gYtnZLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw",
                "slot": 155160519,
                "blockTime": 1665685554,
                "confirmationStatus": "finalized",
            }
        )
    )
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_purchase_tx_info_1
    parse_sol_tx_batch(
        db,
        solana_client_manager_mock,
        redis,
        [mock_confirmed_signature_for_address],
        solana_logger,
    )

    with db.scoped_session() as session:
        audio_tx = (
            session.query(
                AudioTransactionsHistory.user_bank,
                AudioTransactionsHistory.transaction_type,
                AudioTransactionsHistory.balance,
                AudioTransactionsHistory.change,
                AudioTransactionsHistory.method,
            )
            .filter(
                AudioTransactionsHistory.signature
                == str(
                    mock_purchase_tx_info_1.value.transaction.transaction.signatures[0]
                )
            )
            .first()
        )

        assert audio_tx.user_bank == "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556"
        assert audio_tx.balance == 5623032749
        assert audio_tx.change == 5123032749
        assert audio_tx.transaction_type == TransactionType.purchase_stripe
        assert audio_tx.method == TransactionMethod.receive

    # Verify that a non-userbank tx won't get indexed.
    mock_confirmed_signature_for_address = RpcConfirmedTransactionStatusWithSignature.from_json(
        json.dumps(
            {
                "err": None,
                "memo": None,
                "signature": "3Vq94guk3pRLy1do3f3eFP3uWfUHaBznVXqG56aBij5nunD5NvXfq8H8cUNsJp6J3uSaJTpRthbvAahSJZ69NPsz",
                "slot": 155160519,
                "blockTime": 1665685554,
                "confirmationStatus": "finalized",
            }
        )
    )
    solana_client_manager_mock.get_sol_tx_info.return_value = (
        mock_purchase_tx_info_invalid
    )
    parse_sol_tx_batch(
        db,
        solana_client_manager_mock,
        redis,
        [mock_confirmed_signature_for_address],
        solana_logger,
    )

    with db.scoped_session() as session:
        audio_tx = (
            session.query(
                AudioTransactionsHistory.user_bank,
            )
            .filter(
                AudioTransactionsHistory.signature
                == "3Vq94guk3pRLy1do3f3eFP3uWfUHaBznVXqG56aBij5nunD5NvXfq8H8cUNsJp6J3uSaJTpRthbvAahSJZ69NPsz"
            )
            .first()
        )
        assert not audio_tx
