from datetime import datetime

from integration_tests.utils import populate_mock_db_blocks
from src.models.rewards.challenge import Challenge, ChallengeType
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.queries.get_undisbursed_challenges import get_undisbursed_challenges
from src.utils.db_session import get_db


def setup_challenges(app):
    with app.app_context():
        db = get_db()
        populate_mock_db_blocks(db, 99, 110)
        challenges = [
            Challenge(
                id="test_challenge_1",
                type=ChallengeType.numeric,
                amount="5",
                step_count=3,
                active=False,
                starting_block=100,
            ),
            Challenge(
                id="test_challenge_2",
                type=ChallengeType.boolean,
                amount="5",
                active=True,
                starting_block=100,
            ),
            Challenge(
                id="test_challenge_3",
                type=ChallengeType.aggregate,
                amount="5",
                active=True,
                starting_block=100,
            ),
        ]

        users = [
            User(
                blockhash=hex(99),
                blocknumber=99,
                txhash=f"xyz{i}",
                user_id=i,
                is_current=True,
                handle=f"TestHandle{i}",
                handle_lc=f"testhandle{i}",
                wallet=f"0x{i}",
                is_verified=False,
                name=f"test_name{i}",
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            for i in range(7)
        ]
        user_bank_accounts = [
            UserBankAccount(
                signature=f"0x{i}",
                ethereum_address=users[i].wallet,
                bank_account=f"0x{i}",
                created_at=datetime.now(),
            )
            for i in range(7)
        ]

        user_challenges = [
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=1,
                specifier="1",
                is_complete=False,
                current_step_count=1,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=2,
                specifier="2",
                is_complete=True,
                current_step_count=3,
                completed_blocknumber=100,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=3,
                specifier="3",
                is_complete=False,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=4,
                specifier="4",
                is_complete=True,
                completed_blocknumber=102,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=5,
                specifier="5",
                is_complete=True,
                completed_blocknumber=102,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
            UserChallenge(
                challenge_id="test_challenge_3",
                user_id=6,
                specifier="6",
                is_complete=True,
                completed_blocknumber=100,
                amount=5,
                created_at="2023-10-16 17:51:31.105065+00",
            ),
        ]

        with db.scoped_session() as session:
            session.add_all(challenges)
            session.flush()
            session.add_all(users)
            session.add_all(user_bank_accounts)
            session.add_all(user_challenges)


def test_undisbursed_challenges(app):
    setup_challenges(app)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        # Test that all undisbursed challenges are returned in order
        undisbursed = get_undisbursed_challenges(
            session,
            {"user_id": None, "limit": 10, "offset": 0, "completed_blocknumber": 99},
        )

        expected = [
            {
                "challenge_id": "test_challenge_3",
                "user_id": 6,
                "specifier": "6",
                "amount": "5",
                "completed_blocknumber": 100,
                "handle": "TestHandle6",
                "wallet": "0x6",
                "created_at": "2023-10-16 17:51:31.105065+00:00",
                "cooldown_days": None,
            },
            {
                "challenge_id": "test_challenge_2",
                "user_id": 4,
                "specifier": "4",
                "amount": "5",
                "completed_blocknumber": 102,
                "handle": "TestHandle4",
                "wallet": "0x4",
                "created_at": "2023-10-16 17:51:31.105065+00:00",
                "cooldown_days": None,
            },
            {
                "challenge_id": "test_challenge_2",
                "user_id": 5,
                "specifier": "5",
                "amount": "5",
                "completed_blocknumber": 102,
                "handle": "TestHandle5",
                "wallet": "0x5",
                "created_at": "2023-10-16 17:51:31.105065+00:00",
                "cooldown_days": None,
            },
        ]
        assert expected == undisbursed

        # Test that it filters correctly by user_id
        undisbursed = get_undisbursed_challenges(
            session,
            {"user_id": 6, "limit": 10, "offset": 0, "completed_blocknumber": 99},
        )

        expected = [
            {
                "challenge_id": "test_challenge_3",
                "user_id": 6,
                "specifier": "6",
                "amount": "5",
                "completed_blocknumber": 100,
                "handle": "TestHandle6",
                "wallet": "0x6",
                "created_at": "2023-10-16 17:51:31.105065+00:00",
                "cooldown_days": None,
            },
        ]
        assert expected == undisbursed

        # Test that it filters correctly by user_id & completed blocknumber
        undisbursed = get_undisbursed_challenges(
            session,
            {"user_id": 6, "limit": 10, "offset": 0, "completed_blocknumber": 101},
        )

        expected = []
        assert expected == undisbursed
