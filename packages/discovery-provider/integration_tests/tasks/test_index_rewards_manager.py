import json
from unittest.mock import create_autospec

from solders.rpc.responses import GetTransactionResp
from sqlalchemy import desc

from integration_tests.utils import populate_mock_db
from src.models.rewards.challenge_disbursement import ChallengeDisbursement
from src.models.rewards.reward_manager import RewardManagerTransaction
from src.models.users.audio_transactions_history import (
    AudioTransactionsHistory,
    TransactionMethod,
    TransactionType,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.tasks.index_rewards_manager import (
    fetch_and_parse_sol_rewards_transfer_instruction,
    parse_transfer_instruction_data,
    parse_transfer_instruction_id,
    process_batch_sol_reward_manager_txs,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]
REWARDS_MANAGER_ACCOUNT = shared_config["solana"]["rewards_manager_account"]


def test_decode_reward_manager_transfer_instruction():
    transfer_data = "4uzJ5EwVTSPet22fnLDyB9JaEMWSqopW7F5PYKjf65j76BGhtMR5LXfv3twbV7Bq3CSH2iMRr7fNJzyijZ7"
    decoded_data = parse_transfer_instruction_data(transfer_data)
    assert decoded_data == {
        "amount": 10000000000,
        "id": "profile-completion:123456789",
        "eth_recipient": "0x0403be3560116a12b467855cb29a393174a59876",
    }


def test_parse_transfer_instruction_id():
    transfer_id = "profile-completion:123456789"
    parsed_id = parse_transfer_instruction_id(transfer_id)
    assert parsed_id[0] == "profile-completion"
    assert parsed_id[1] == "123456789"

    # Returns None on invalid transfer_id
    transfer_id = "profile-completion_123456789"
    parsed_id = parse_transfer_instruction_id(transfer_id)
    assert parsed_id == None

    # Handles trending
    transfer_id = "tt:12-12-21:1"
    parsed_id = parse_transfer_instruction_id(transfer_id)
    assert parsed_id[0] == "tt"
    assert parsed_id[1] == "12-12-21:1"


mock_tx_info = GetTransactionResp.from_json(
    json.dumps(
        {
            "result": {
                "blockTime": 1628015818,
                "meta": {
                    "err": None,
                    "fee": 5000,
                    "innerInstructions": [
                        {
                            "index": 0,
                            "instructions": [
                                {
                                    "accounts": [0, 1, 6],
                                    "data": "6Tvirzk8jih7LmKk9jTesrZh8KkSo7qGfZJWP4yxBuegWSs3nE5RRNZkLVhGKKXB1ACu9"
                                    + "Zhi7LcUV9bFUo27Y3A87jvC4FCRSJrCWZp3bYMBzJ2hyZXcVHLp3Pquzc8khJJJSQsPMm3KrBzxG"
                                    + "jv93ZYbhrTh6XfLPJ",
                                    "programIdIndex": 9,
                                },
                                {
                                    "accounts": [1, 5, 6, 7],
                                    "data": "2",
                                    "programIdIndex": 8,
                                },
                            ],
                        },
                        {
                            "index": 1,
                            "instructions": [
                                {
                                    "accounts": [3, 1, 11],
                                    "data": "3DcCptZte3oM",
                                    "programIdIndex": 8,
                                },
                                {
                                    "accounts": [0, 4],
                                    "data": "111112GJ1Cfr4Mnah1YBPDnXiJkkj9hCSapxB3jXmcS24qFS88K64heDkWFb6rEYjBj9rr",
                                    "programIdIndex": 9,
                                },
                            ],
                        },
                    ],
                    "logMessages": [
                        "Program G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s invoke [1]",
                        "Program log: Instruction: CreateTokenAccount",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: InitializeAccount",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3920 of 178227 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s consumed 26357 of 200000 compute units",
                        "Program G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s success",
                        f"Program {REWARDS_MANAGER_PROGRAM} invoke [1]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
                        "Program log: Instruction: Transfer",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3402 of 185013 compute units",
                        "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
                        "Program 11111111111111111111111111111111 invoke [2]",
                        "Program 11111111111111111111111111111111 success",
                        f"Program {REWARDS_MANAGER_PROGRAM} consumed 31628 of 200000 compute units",
                        f"Program {REWARDS_MANAGER_PROGRAM} success",
                    ],
                    "postBalances": [
                        9325298880,
                        2039280,
                        0,
                        2039280,
                        890880,
                        1461600,
                        0,
                        1,
                        1130582400,
                        1,
                        1350240,
                        0,
                        1398960,
                        1141440,
                        1141440,
                    ],
                    "postTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                            "uiTokenAmount": {
                                "amount": "10000000000",
                                "decimals": 9,
                                "uiAmount": 10.0,
                                "uiAmountString": "10",
                            },
                        },
                        {
                            "accountIndex": 3,
                            "mint": "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                            "uiTokenAmount": {
                                "amount": "1009990000000000",
                                "decimals": 9,
                                "uiAmount": 1009990.0,
                                "uiAmountString": "1009990",
                            },
                        },
                    ],
                    "preBalances": [
                        9321260120,
                        0,
                        6973920,
                        2039280,
                        0,
                        1461600,
                        0,
                        1,
                        1130582400,
                        1,
                        1350240,
                        0,
                        1398960,
                        1141440,
                        1141440,
                    ],
                    "preTokenBalances": [
                        {
                            "accountIndex": 1,
                            "mint": "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                            "uiTokenAmount": {
                                "amount": "9000000000",
                                "decimals": 9,
                                "uiAmount": 9000000000.0,
                                "uiAmountString": "9000000000",
                            },
                        },
                        {
                            "accountIndex": 3,
                            "mint": "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                            "uiTokenAmount": {
                                "amount": "1010000000000000",
                                "decimals": 9,
                                "uiAmount": 1010000.0,
                                "uiAmountString": "1010000",
                            },
                        },
                    ],
                    "rewards": [],
                    "status": {"Ok": None},
                },
                "slot": 72131741,
                "transaction": {
                    "message": {
                        "accountKeys": [
                            REWARDS_MANAGER_ACCOUNT,
                            "54u7LVJhhbWaENGLzzgvTX72k9XSHSF3EhCcuvD9xMfk",
                            "3zKGHtF9aNjevZ2DETXzTDWiN65Fkwv9oeiScAfSVh3H",
                            "9ShGNjEm5repSKTkZMUXMj8cx31HAo363ovdm1AoLA8d",
                            "EnoXtBihkkRwLbp6LTjRfSw8NjQMptV2mxTm1uB6z556",
                            "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                            "6tz3kagxfjQrM2A5kbmnFQfSp4apcsP2pKaCw1SXMiPx",
                            "SysvarRent111111111111111111111111111111111",
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "11111111111111111111111111111111",
                            "3qvNmjbxmF9CDHzAEBvLSePRiMWtVcXPaRPiPtmrT29x",
                            "7s74jBb2Qn9RJyzGMatKfCFJf118B9yM7Uiyk3YnofC7",
                            "B5g2yyShAQeQSkTgAFyFN5UmNYWRnPAgvog6U2dazLkU",
                            "G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s",
                            REWARDS_MANAGER_PROGRAM,
                        ],
                        "header": {
                            "numReadonlySignedAccounts": 0,
                            "numReadonlyUnsignedAccounts": 10,
                            "numRequiredSignatures": 1,
                        },
                        "instructions": [
                            {
                                "accounts": [0, 5, 6, 1, 7, 8, 9],
                                "data": "14F9hNTcPWcxgSuHDYnP8XmmvUvZ",
                                "programIdIndex": 13,
                            },
                            {
                                "accounts": [2, 10, 11, 3, 1, 4, 12, 0, 7, 8, 9],
                                "data": "4uzJ5EwVTSPet22fnLDyB9JaEMWSqopW7F5PYKjf65j76BGhtMR5LXfv3twbV7Bq3CSH2iMRr7fNJzyijZ7",
                                "programIdIndex": 14,
                            },
                        ],
                        "recentBlockhash": "6yYGRT1rLjqH9fLK56uwEt5yYugntLrJwA3igJGzHrEA",
                    },
                    "signatures": [
                        "rnnNQ1N4eF4spVyAkgS1ef3KdW8uHb3J94aUAseMrJ3jE4mStoj8yMdYtAwzp9MpncYJrp8BcSPQNseHrqZDE1D"
                    ],
                },
            },
        }
    )
)


def test_fetch_and_parse_sol_rewards_transfer_instruction(app):  # pylint: disable=W0621
    with app.app_context():
        db = get_db()
        redis = get_redis()

    solana_client_manager_mock = create_autospec(SolanaClientManager)
    solana_client_manager_mock.get_sol_tx_info.return_value = mock_tx_info

    first_tx_sig = "tx_sig_one"
    second_tx_sig = "tx_sig_two"
    parsed_tx = fetch_and_parse_sol_rewards_transfer_instruction(
        solana_client_manager_mock, first_tx_sig, redis
    )
    assert (
        parsed_tx["transfer_instruction"]["amount"]  # pylint: disable=E1136
        == 10000000000
    )
    assert (
        parsed_tx["transfer_instruction"]["eth_recipient"]  # pylint: disable=E1136
        == "0x0403be3560116a12b467855cb29a393174a59876"
    )
    assert (
        parsed_tx["transfer_instruction"]["challenge_id"]  # pylint: disable=E1136
        == "profile-completion"
    )
    assert parsed_tx["tx_sig"] == first_tx_sig
    assert parsed_tx["slot"] == 72131741

    test_user_entries = {
        "users": [
            {
                "user_id": 1,
                "handle": "piazza",
                "wallet": "0x0403be3560116a12b467855cb29a393174a59876",
            },
        ],
        "user_bank_accounts": [
            {
                "ethereum_address": "0x0403be3560116a12b467855cb29a393174a59876",
                "bank_account": "6ws9TtJrsRhCfMkhZqT1zULFxhasyPgGpKER4GfDhN9R",
            }
        ],
    }

    with db.scoped_session() as session:
        process_batch_sol_reward_manager_txs(session, [parsed_tx], redis)
        disbursments = session.query(ChallengeDisbursement).all()
        assert len(disbursments) == 1
        disbursement = disbursments[0]
        # Assert that this invalid user was set to user_id 0
        assert disbursement.user_id == 0
        reward_manager_tx_1 = (
            session.query(RewardManagerTransaction)
            .filter(RewardManagerTransaction.signature == first_tx_sig)
            .all()
        )
        assert len(reward_manager_tx_1) == 1
        audio_tx_history_tx_1 = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == first_tx_sig)
            .all()
        )
        assert len(audio_tx_history_tx_1) == 1
        # Assert that this invalid user's bank account was set 0
        assert audio_tx_history_tx_1[0].user_bank == "0"

    populate_mock_db(db, test_user_entries)
    parsed_tx["tx_sig"] = second_tx_sig
    next_slot = parsed_tx["slot"] + 1
    parsed_tx["slot"] = next_slot
    parsed_tx["transfer_instruction"]["challenge_id"] = "tt"
    with db.scoped_session() as session:
        process_batch_sol_reward_manager_txs(session, [parsed_tx], redis)
        disbursments = (
            session.query(ChallengeDisbursement)
            .order_by(desc(ChallengeDisbursement.slot))
            .all()
        )
        reward_manager_tx_1 = (
            session.query(RewardManagerTransaction)
            .filter(RewardManagerTransaction.signature == second_tx_sig)
            .all()
        )
        assert len(reward_manager_tx_1) == 1
        assert len(disbursments) == 2
        disbursment = disbursments[0]
        assert disbursment.challenge_id == "tt"
        assert disbursment.user_id == 1
        assert disbursment.signature == second_tx_sig
        assert disbursment.slot == next_slot
        assert disbursment.specifier == "123456789"
        reward_manager_tx_2 = (
            session.query(RewardManagerTransaction)
            .filter(RewardManagerTransaction.signature == second_tx_sig)
            .all()
        )
        assert len(reward_manager_tx_2) == 1
        audio_tx_history_tx_2 = (
            session.query(AudioTransactionsHistory)
            .filter(AudioTransactionsHistory.signature == second_tx_sig)
            .all()
        )
        assert len(audio_tx_history_tx_2) == 1
        audio_tx_history = audio_tx_history_tx_2[0]
        assert (
            audio_tx_history.user_bank == "6ws9TtJrsRhCfMkhZqT1zULFxhasyPgGpKER4GfDhN9R"
        )
        assert audio_tx_history.transaction_type == TransactionType.trending_reward
        assert audio_tx_history.method == TransactionMethod.receive
        assert audio_tx_history.tx_metadata == "tt"
        assert audio_tx_history.balance == 10000000000
        assert audio_tx_history.change == 1000000000
        assert audio_tx_history.slot == next_slot
