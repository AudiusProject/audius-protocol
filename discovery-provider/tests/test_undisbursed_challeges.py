from src.models import Challenge, UserChallenge, ChallengeType
from src.utils.db_session import get_db
from src.queries.get_undisbursed_challenges import get_undisbursed_challenges
from tests.utils import populate_mock_db_blocks, clean_up_db


def setup_challenges(app):
    with app.app_context():
        db = get_db()
        clean_up_db(db)
        populate_mock_db_blocks(db, 99, 110)
        challenges = [
            Challenge(
                id="test_challenge_1",
                type=ChallengeType.numeric,
                amount=5,
                step_count=3,
                active=False,
                starting_block=100,
            ),
            Challenge(
                id="test_challenge_2",
                type=ChallengeType.boolean,
                amount=5,
                active=True,
                starting_block=100,
            ),
            Challenge(
                id="test_challenge_3",
                type=ChallengeType.aggregate,
                amount=5,
                active=True,
                starting_block=100,
            ),
        ]
        user_challenges = [
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=1,
                specifier="1",
                is_complete=False,
                current_step_count=1,
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=2,
                specifier="2",
                is_complete=True,
                current_step_count=3,
                completed_blocknumber=100,
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=3,
                specifier="3",
                is_complete=False,
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=4,
                specifier="4",
                is_complete=True,
                completed_blocknumber=102,
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=5,
                specifier="5",
                is_complete=True,
                completed_blocknumber=102,
            ),
            UserChallenge(
                challenge_id="test_challenge_3",
                user_id=6,
                specifier="6",
                is_complete=True,
                completed_blocknumber=100,
            ),
            UserChallenge(
                challenge_id="test_challenge_3",
                user_id=6,
                specifier="7",
                is_complete=True,
                completed_blocknumber=100,
            ),
        ]

        with db.scoped_session() as session:
            session.add_all(challenges)
            session.flush()
            session.add_all(user_challenges)


def test_handle_event(app):
    setup_challenges(app)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:

        # Test that all undisbursed challenges are returned in order
        undisbursed = get_undisbursed_challenges(
            session, {"user_id": None, "limit": 10, "completed_blocknumber": 99}
        )

        expected = [
            {
                "challenge_id": "test_challenge_3",
                "user_id": 6,
                "specifier": "",
                "amount": "5",
                "completed_blocknumber": 100,
            },
            {
                "challenge_id": "test_challenge_2",
                "user_id": 4,
                "specifier": "4",
                "amount": "5",
                "completed_blocknumber": 102,
            },
            {
                "challenge_id": "test_challenge_2",
                "user_id": 5,
                "specifier": "5",
                "amount": "5",
                "completed_blocknumber": 102,
            },
        ]
        assert expected == undisbursed

        # Test that it filters correctly by user_id
        undisbursed = get_undisbursed_challenges(
            session, {"user_id": 6, "limit": 10, "completed_blocknumber": 99}
        )

        expected = [
            {
                "challenge_id": "test_challenge_3",
                "user_id": 6,
                "specifier": "",
                "amount": "5",
                "completed_blocknumber": 100,
            }
        ]
        assert expected == undisbursed

        # Test that it filters correctly by user_id & completed blocknumber
        undisbursed = get_undisbursed_challenges(
            session, {"user_id": 6, "limit": 10, "completed_blocknumber": 101}
        )

        expected = []
        assert expected == undisbursed
