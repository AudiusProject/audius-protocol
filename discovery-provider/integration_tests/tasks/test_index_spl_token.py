import json
from unittest.mock import create_autospec

from integration_tests.utils import populate_mock_db
from solders.rpc.responses import GetTransactionResp
from solders.signature import Signature
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
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from src.utils.solana_indexing_logger import SolanaIndexingLogger

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]


mock_create_account_tx_info = GetTransactionResp.from_json(
    json.dumps(
        {
            "result": {
                "blockTime": 1628015818,
                "meta": {
                    "err": None,
                    "fee": 5000,
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
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                            "owner": "Fipj4SLmTBmS7BSgDqeMPb7F86YWUUKajvDgQUWaHwWf",
                            "uiTokenAmount": {
                                "amount": "0",
                                "decimals": 8,
                                "uiAmount": "None",
                                "uiAmountString": "0",
                            },
                        }
                    ],
                    "preTokenBalances": [],
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
                },
                "slot": 72131741,
                "transaction": {
                    "message": {
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
                        "header": {
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 6,
                            "numRequiredSignatures": 1,
                        },
                        "instructions": [
                            {
                                "accounts": [0, 1, 2, 3, 4, 5, 6],
                                "data": "",
                                "programIdIndex": 7,
                            }
                        ],
                        "recentBlockhash": "4BNdtYfc8G1mSRFhwv7523CHCP3XPt92ASyV9kwvRMd3",
                    },
                    "signatures": [
                        "2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ"
                    ],
                },
            }
        }
    )
)

mock_confirmed_signature_for_address = Signature.from_json(
    json.dumps(
        {
            "err": None,
            "memo": None,
            "signature": "2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ",
            "slot": 123209431,
            "blockTime": 1646261596,
            "confirmationStatus": "finalized",
        }
    )
)


def test_parse_spl_token_transaction_no_results():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = (
        mock_create_account_tx_info
    )
    tx_info = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_info == None


mock_transfer_checked_meta = {
    "blockTime": 1646261596,
    "meta": {
        "err": None,
        "fee": 5000,
        "innerInstructions": [],
        "logMessages": [
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
            "Program log: Instruction: TransferChecked",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3383 of 200000 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        ],
        "postTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                "uiTokenAmount": {
                    "amount": "6800000058",
                    "decimals": 8,
                    "uiAmount": 68.00000058,
                    "uiAmountString": "68.00000058",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "500000000",
                    "decimals": 8,
                    "uiAmount": 5,
                    "uiAmountString": "5",
                },
            },
        ],
        "preTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                "uiTokenAmount": {
                    "amount": "7100000058",
                    "decimals": 8,
                    "uiAmount": 71.00000058,
                    "uiAmountString": "71.00000058",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "200000000",
                    "decimals": 8,
                    "uiAmount": 2,
                    "uiAmountString": "2",
                },
            },
        ],
        "rewards": [],
        "status": {"Ok": None},
    },
    "slot": 123063718,
    "transaction": {
        "message": {
            "accountKeys": [
                "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
                "9f79QvW5XQ1XCXGLeCCHjBZkPet51yAPxtU7fcaY6UxD",
                "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
                "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            ],
            "header": {
                "numReadonlySignedAccounts": 0,
                "numReadonlyUnsignedAccounts": 2,
                "numRequiredSignatures": 1,
            },
            "instructions": [
                {
                    "accounts": [1, 3, 2, 0],
                    "data": "g7RNMm7FSEK3u",
                    "programIdIndex": 4,
                }
            ],
            "recentBlockhash": "3G8aEDJmiNHANrsBw4Ac6wXJmdURRiLg1VtSoiWF9q2o",
        },
        "signatures": [
            "2qAJ4Rmf3GZ4ZK62wh2v3QaXmhtKviUym7aM1uJg2rJED2H7tBcjGoxwsMnzyt47Yy1B5je9guGpfpwoTGECVgRf"
        ],
    },
}

mock_transfer_tx_info = {
    "jsonrpc": "2.0",
    "result": mock_transfer_checked_meta,
    "id": 3,
}


def test_parse_spl_token_transaction():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_transfer_tx_info
    tx_info = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_info["user_bank"] == "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9"
    assert tx_info["root_accounts"] == [
        "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_info["token_accounts"] == [
        "9f79QvW5XQ1XCXGLeCCHjBZkPet51yAPxtU7fcaY6UxD",
        "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
    ]


mock_purchase_meta = {
    "blockTime": 1665685554,
    "meta": {
        "err": None,
        "fee": 5000,
        "innerInstructions": [],
        "loadedAddresses": {"readonly": None, "writable": None},
        "logMessages": [
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 651 of 400000 compute units",
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
            "Program log: Instruction: TransferChecked",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399349 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        ],
        "postBalances": [
            2935160,
            2039280,
            2039280,
            260042654,
            121159680,
            934087680,
        ],
        "postTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "5623032749",
                    "decimals": 8,
                    "uiAmount": 56.23032749,
                    "uiAmountString": "56.23032749",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "0",
                    "decimals": 8,
                    "uiAmount": None,
                    "uiAmountString": "0",
                },
            },
        ],
        "preBalances": [2940160, 2039280, 2039280, 260042654, 121159680, 934087680],
        "preTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "500000000",
                    "decimals": 8,
                    "uiAmount": 5.0,
                    "uiAmountString": "5",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "5123032749",
                    "decimals": 8,
                    "uiAmount": 51.23032749,
                    "uiAmountString": "51.23032749",
                },
            },
        ],
        "rewards": [],
        "status": {"Ok": None},
    },
    "slot": 155160519,
    "transaction": {
        "message": {
            "accountKeys": [
                "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
                "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
                "C4qrWm6kkLwUNExA2Ldt6uXLroRfcTGXJLx1zGvEt5DB",
                "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            ],
            "header": {
                "numReadonlySignedAccounts": 0,
                "numReadonlyUnsignedAccounts": 3,
                "numRequiredSignatures": 1,
            },
            "instructions": [
                {
                    "accounts": [0],
                    "data": "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz",
                    "programIdIndex": 4,
                },
                {
                    "accounts": [2, 3, 1, 0],
                    "data": "iJsU9Sk8HPLQP",
                    "programIdIndex": 5,
                },
            ],
            "recentBlockhash": "CChCbrfGJgYkqSf3FUHqMmhEd3TXxBoKDAk6ZZx9QGfZ",
        },
        "signatures": [
            "testtestLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw"
        ],
    },
}

mock_purchase_meta_different_ordering = {
    "blockTime": 1667410823,
    "meta": {
        "err": None,
        "fee": 5000,
        "innerInstructions": [],
        "loadedAddresses": {"readonly": None, "writable": None},
        "logMessages": [
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo invoke [1]",
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo consumed 588 of 400000 compute units",
            "Program Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo success",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
            "Program log: Instruction: TransferChecked",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6172 of 399412 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
        ],
        "postBalances": [2930160, 2039280, 2039280, 260042654, 121159680, 934087680],
        "postTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "0",
                    "decimals": 8,
                    "uiAmount": None,
                    "uiAmountString": "0",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "12780604010",
                    "decimals": 8,
                    "uiAmount": 127.8060401,
                    "uiAmountString": "127.8060401",
                },
            },
        ],
        "preBalances": [2935160, 2039280, 2039280, 260042654, 121159680, 934087680],
        "preTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "1025896376",
                    "decimals": 8,
                    "uiAmount": 10.25896376,
                    "uiAmountString": "10.25896376",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "uiTokenAmount": {
                    "amount": "11754707634",
                    "decimals": 8,
                    "uiAmount": 117.54707634,
                    "uiAmountString": "117.54707634",
                },
            },
        ],
        "rewards": [],
        "status": {"Ok": None},
    },
    "slot": 158882288,
    "transaction": {
        "message": {
            "header": {
                "numReadonlySignedAccounts": 0,
                "numReadonlyUnsignedAccounts": 3,
                "numRequiredSignatures": 1,
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
                    "accounts": [0],
                    "data": "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz",
                    "programIdIndex": 4,
                },
                {
                    "accounts": [1, 3, 2, 0],
                    "data": "iTUiLjKABVyv7",
                    "programIdIndex": 5,
                },
            ],
            "indexToProgramIds": {},
        },
        "signatures": [
            "iBTtH8W1ViHdnAzQYNKovYsBszHvikwUAG4V8Qk5HNWQRCYc468ugKnoYSqL6f7LLmbKa5ZYFSLaEbZuH42fbBM"
        ],
    },
}

mock_purchase_tx_info_1 = {
    "jsonrpc": "2.0",
    "result": mock_purchase_meta,
    "id": 4,
}

mock_purchase_tx_info_2 = {
    "jsonrpc": "2.0",
    "result": mock_purchase_meta_different_ordering,
    "id": 4,
}


def test_parse_memo_instruction():
    memo = parse_memo_instruction(mock_transfer_checked_meta)
    assert not memo
    memo = parse_memo_instruction(mock_purchase_meta)
    assert memo == "Bs2CZBUGWJZV5kqF3ecfJisidP9WQtCpeeWCzk6AUyYLQWgLdHPz"
    vendor = decode_memo_and_extract_vendor(memo)
    assert vendor == "Link by Stripe"


def test_parse_spl_token_purchase_transactions():
    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_purchase_tx_info_1
    tx_info = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_info["user_bank"] == "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556"
    assert tx_info["root_accounts"] == [
        "GNkt1SGkdzvfaCYVpSKs7yjLxeyLJFKZv32cVYJ3GyHX",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_info["token_accounts"] == [
        "C4qrWm6kkLwUNExA2Ldt6uXLroRfcTGXJLx1zGvEt5DB",
        "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556",
    ]
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_purchase_tx_info_2
    tx_info = parse_spl_token_transaction(
        solana_client_manager_mock, mock_confirmed_signature_for_address
    )
    assert tx_info["user_bank"] == "HTmKqU5T3uhzz6heG47awyVuzcbWu9o4rE1HtrXv5ACg"
    assert tx_info["root_accounts"] == [
        "AEty8wg5HqCJz7a8U8FS9sYXtCudYH93JLZgMfjCAR6u",
        "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
    ]
    assert tx_info["token_accounts"] == [
        "8aEJ32LCGaGbNbidd1Gg33yqvZ11AXfAzzEAXxAJEzA8",
        "HTmKqU5T3uhzz6heG47awyVuzcbWu9o4rE1HtrXv5ACg",
    ]


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
    mock_confirmed_signature_for_address = {
        "err": None,
        "memo": None,
        "signature": "4mRtFjexnGFLimCQesk1eTYSphzmEz2rPt6dmfeBd6uEWALL4addY4mzULyxfKG7DVvsYNmxWNNsm9m8jHBjmE7J",
        "slot": 123209431,
        "blockTime": 1646261596,
        "confirmationStatus": "finalized",
    }
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
            spl_token_tx.last_scanned_slot
            == mock_confirmed_signature_for_address["slot"]
        )
        assert (
            spl_token_tx.signature == mock_confirmed_signature_for_address["signature"]
        )

        # Verify that user 1 and 2 were added to the redis refresh queue
        refresh_user_ids = get_immediate_refresh_user_ids(redis)
        refresh_user_ids.sort()
        assert len(refresh_user_ids) == 2
        assert refresh_user_ids == [1, 2]

    mock_confirmed_signature_for_address = {
        "err": None,
        "memo": None,
        "signature": "testtestLFjEnv3gSEoTHwoUsi5pbj4xu1LmETex1P5tbrSafCEkBDNXM9hmBGBb7AH5VUJtMsYDoeo8TpskJ7pw",
        "slot": 155160519,
        "blockTime": 1665685554,
        "confirmationStatus": "finalized",
    }
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
                == mock_purchase_meta["transaction"]["signatures"][0]
            )
            .first()
        )

        assert audio_tx.user_bank == "7dw7W4Yv7F1uWb9dVH1CFPm39mePyypuCji2zxcFA556"
        assert audio_tx.balance == 5623032749
        assert audio_tx.change == 5123032749
        assert audio_tx.transaction_type == TransactionType.purchase_stripe
        assert audio_tx.method == TransactionMethod.receive

    # Verify that a non-userbank tx won't get indexed.
    mock_purchase_meta["transaction"]["message"]["accountKeys"][1] = "somegarbage"
    mock_confirmed_signature_for_address["signature"] = "somegarbage"
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
            .filter(AudioTransactionsHistory.signature == "somegarbage")
            .first()
        )
        assert not audio_tx
