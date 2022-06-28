from unittest.mock import create_autospec

from integration_tests.utils import populate_mock_db
from src.models.indexing.spl_token_transaction import SPLTokenTransaction
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.cache_user_balance import get_immediate_refresh_user_ids
from src.tasks.index_spl_token import (
    get_token_balance_change_owners,
    parse_sol_tx_batch,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis
from src.utils.solana_indexing_logger import SolanaIndexingLogger

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]


transfer_meta = {
    "meta": {
        "postTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "100000000",
                    "decimals": 8,
                    "uiAmount": 1.0,
                    "uiAmountString": "1",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "700000000",
                    "decimals": 8,
                    "uiAmount": 7.0,
                    "uiAmountString": "7",
                },
            },
        ],
        "preTokenBalances": [
            {
                "accountIndex": 1,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "600000000",
                    "decimals": 8,
                    "uiAmount": 6.0,
                    "uiAmountString": "6",
                },
            },
            {
                "accountIndex": 2,
                "mint": "9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM",
                "owner": "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "uiTokenAmount": {
                    "amount": "200000000",
                    "decimals": 8,
                    "uiAmount": 2.0,
                    "uiAmountString": "2",
                },
            },
        ],
    },
    "transaction": {
        "message": {
            "accountKeys": [
                "CgJhbUdHQNN5HBeNEN7J69Z89emh6BtyYX1CPEGwaeqi",
                "3fh1U93FEtZJK3uRtRuQ2ocYQApRZQ7g1AmVr9WcrHHv",
                "2mDP3qspXi1wJUdnaFf2Xa3oSQJZUzqfPZ69zZtee3Sb",
                "E4rr6UXzeVoaA8Ae7Fm6sEV1dXEuWeuHDBwRnvicUcbu",
                "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
                "SysvarRent111111111111111111111111111111111",
                "Sysvar1nstructions1111111111111111111111111",
                "11111111111111111111111111111111",
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                "KeccakSecp256k11111111111111111111111111111",
                "Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ",
            ],
            "recentBlockhash": "FZbtQTxcSnhyLALk6SFXGrE2omGhhyCns8yFWDvpGYFw",
        },
        "signatures": [
            "arAQYgyyHVG2CS5PZuQC1G83vfi5HmHVWMchC1tXg1S9qebC2jdsbqyLfmX1cfjefk3S5NLhoE8r3pTzvCthxUc"
        ],
    },
}


def test_get_token_balance_change_owners_bank_accts():
    (root_accounts, token_accounts) = get_token_balance_change_owners(transfer_meta)
    assert root_accounts == set(["5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx"])
    assert token_accounts == set(
        [
            "3fh1U93FEtZJK3uRtRuQ2ocYQApRZQ7g1AmVr9WcrHHv",
            "2mDP3qspXi1wJUdnaFf2Xa3oSQJZUzqfPZ69zZtee3Sb",
        ]
    )


mock_create_account_meta = {
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
    },
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
                {"accounts": [0, 1, 2, 3, 4, 5, 6], "data": "", "programIdIndex": 7}
            ],
            "recentBlockhash": "4BNdtYfc8G1mSRFhwv7523CHCP3XPt92ASyV9kwvRMd3",
        },
        "signatures": [
            "2DUH6nXnS4EXCqPdgxGvAiLyemZ8WkB69VyjhiGgE3HZxsbXWdk8SuZbGCkyV7oN6b7DHHVggaB8QSCKp5YNk7QJ"
        ],
    },
}


def test_get_token_balance_change_owners_no_results():
    (root_accounts, token_accounts) = get_token_balance_change_owners(
        mock_create_account_meta
    )
    assert root_accounts == set()
    assert token_accounts == set()


mock_transfer_checked_meta = {
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


def test_get_token_balance_change_owners():
    (root_accounts, token_accounts) = get_token_balance_change_owners(
        mock_transfer_checked_meta
    )
    assert root_accounts == set(
        [
            "5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx",
            "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4",
        ]
    )
    assert token_accounts == set(
        [
            "9f79QvW5XQ1XCXGLeCCHjBZkPet51yAPxtU7fcaY6UxD",
            "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
        ]
    )


mock_tx_info = {
    "jsonrpc": "2.0",
    "result": mock_transfer_checked_meta,
    "id": 3,
}


def test_fetch_and_parse_sol_rewards_transfer_instruction(app):  # pylint: disable=W0621
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_tx_info

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
        ],
        "user_bank_accounts": [
            {  # user 1
                "signature": "doesntmatter",
                "ethereum_address": "0x0403be3560116a12b467855cb29a393174a59876",
                "bank_account": "7CyoHxibpPrTVc2AsmoSq7gRoDwnwN7LRnHDcR4yWVf9",
            },
        ],
        "associated_wallets": [
            {"user_id": 2, "wallet": "iVsXfN4oZnARo6AYwm8FFXBnDQYnwhkPxJiuPHDzfJ4"}
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
