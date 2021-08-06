from unittest.mock import MagicMock
import pytest
import src
from src.models import ChallengeDisbursement
from src.tasks.index_rewards_manager import (
    parse_transfer_instruction_data,
    parse_transfer_instruction_id,
    process_sol_rewards_transfer_instruction,
)
from src.utils.db_session import get_db
from src.utils.config import shared_config
from tests.utils import populate_mock_db

REWARDS_MANAGER_PROGRAM = shared_config["solana"]["rewards_manager_program_address"]


def test_decode_reward_manager_transfer_instruction():
    transfer_data = "4uzJ5EwVTSPet22fnLDyB9JaEMWSqopW7F5PYKjf65j76BGhtMR5LXfv3twbV7Bq3CSH2iMRr7fNJzyijZ7"
    decoded_data = parse_transfer_instruction_data(transfer_data)
    assert decoded_data == {
        "amount": 10000000000,
        "id": "profile-completion:123456789",
        "eth_recipient": "0x7698a57431399ab25c8567b4126a116035be0304",
    }


def test_parse_transfer_instruction_id():
    transfer_id = "profile-completion:123456789"
    parsed_id = parse_transfer_instruction_id(transfer_id)
    assert parsed_id[0] == "profile-completion"
    assert parsed_id[1] == "123456789"

    # Throws an error on invalid transfer_id
    with pytest.raises(Exception):
        transfer_id = "profile-completion_123456789"
        parsed_id = parse_transfer_instruction_id(transfer_id)

    # Throws an error on invalid transfer_id
    with pytest.raises(Exception):
        transfer_id = "profile-completion:123456789:"
        parsed_id = parse_transfer_instruction_id(transfer_id)


mock_tx_info = {
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
                        {"accounts": [1, 5, 6, 7], "data": "2", "programIdIndex": 8},
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
                    "accountIndex": 3,
                    "mint": "Hid8t4E7R6b6JCVHdiGcwYYq2s7gB9nfVjRZYr9YUTPp",
                    "uiTokenAmount": {
                        "amount": "1010000000000000",
                        "decimals": 9,
                        "uiAmount": 1010000.0,
                        "uiAmountString": "1010000",
                    },
                }
            ],
            "rewards": [],
            "status": {"Ok": None},
        },
        "slot": 72131741,
        "transaction": {
            "message": {
                "accountKeys": [
                    "2HYDf9XvHRKhquxK1z4ETJ8ywueZcqEazyFZdRfLqGcT",
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
    }
}


@pytest.fixture
def get_sol_tx_info_mock(monkeypatch):
    mock_get_sol_tx_info = MagicMock()

    def get_sol_tx_info(client, signature):
        return mock_get_sol_tx_info(client, signature)

    monkeypatch.setattr(
        src.tasks.index_rewards_manager, "get_sol_tx_info", get_sol_tx_info
    )
    return mock_get_sol_tx_info


def test_process_sol_rewards_transfer_instruction(
    app, get_sol_tx_info_mock
):  # pylint: disable=W0621
    get_sol_tx_info_mock.return_value = mock_tx_info

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        with pytest.raises(Exception):
            # Should Raise exeption for no matching user
            process_sol_rewards_transfer_instruction(session, {}, "tx_sig_one")

        # Insert block and user

        with pytest.raises(Exception):
            # Should Raise exeption for no matching user
            process_sol_rewards_transfer_instruction(session, {}, "tx_sig_one")

    test_entries = {
        "users": [
            {
                "user_id": 1,
                "handle": "piazza",
                "wallet": "0x7698a57431399ab25c8567b4126a116035be0304",
            },
        ],
        "user_challenges": [
            {
                "challenge_id": "profile-completion",
                "user_id": 1,
                "specifier": "123456789",
            }
        ],
    }
    populate_mock_db(db, test_entries)
    with db.scoped_session() as session:
        process_sol_rewards_transfer_instruction(session, {}, "tx_sig_one")
        disbursments = session.query(ChallengeDisbursement).all()
        assert len(disbursments) == 1
        disbursment = disbursments[0]
        assert disbursment.challenge_id == "profile-completion"
        assert disbursment.user_id == 1
        assert disbursment.signature == "tx_sig_one"
        assert disbursment.slot == 72131741
        assert disbursment.specifier == "123456789"

        # Check that the challenge disbursment is present
