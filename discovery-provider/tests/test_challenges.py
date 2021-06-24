from src.models import Challenge, UserChallenge, ChallengeType
from src.utils.db_session import get_db
from src.challenges.challenge import ChallengeManager, ChallengeUpdater
from src.utils.helpers import model_to_dictionary

def setup_challenges(app):
    with app.app_context():
        db = get_db()
        challenges = [
            Challenge(
                id='test_challenge_1',
                type=ChallengeType.numeric,
                amount=5,
                step_count=3,
                active=True,
                starting_block=100
            ),
            Challenge(
                id='test_challenge_2',
                type=ChallengeType.boolean,
                amount=5,
                active=True,
                starting_block=100
            )
        ]
        user_challenges = [
            UserChallenge(
                challenge_id='test_challenge_1',
                user_id=1,
                specifier='1',
                is_complete=False,
                current_step_count=1
            ),
            UserChallenge(
                challenge_id='test_challenge_1',
                user_id=2,
                specifier='2',
                is_complete=True,
                current_step_count=3
            ),
            UserChallenge(
                challenge_id='test_challenge_1',
                user_id=3,
                specifier='3',
                current_step_count=2,
                is_complete=False
            ),
            UserChallenge(
                challenge_id='test_challenge_2',
                user_id=4,
                specifier='4',
                is_complete=True
            ),
            UserChallenge(
                challenge_id='test_challenge_1',
                user_id=5,
                specifier='5',
                is_complete=False,
                current_step_count=2
            )
        ]

        with db.scoped_session() as session:
            session.add_all(challenges)
            session.flush()
            session.add_all(user_challenges)

class TestUpdater(ChallengeUpdater):
    def update_user_challenges(self, session, event, user_challenges, step_count):
        for user_challenge in user_challenges:
            user_challenge.current_step_count += 1
            if user_challenge.current_step_count >= step_count:
                user_challenge.is_complete = True
        return user_challenges

def test_handle_event(app):
    setup_challenges(app)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:

        my_challenge = ChallengeManager('test_challenge_1', TestUpdater())
        # First try an event with a insufficient block_number
        # to ensure that nothing happens
        my_challenge.process(session, "test_event", [
            {
                "user_id": 1,
                "block_number": 99
            },
        ])
        session.flush()
        actual = session.query(UserChallenge).filter(
            UserChallenge.challenge_id == 'test_challenge_1',
            UserChallenge.user_id == 1
        ).first()
        expected = {
            "challenge_id": "test_challenge_1",
            "user_id": 1,
            "specifier": '1',
            "is_complete": False,
            "current_step_count": 1
        }
        assert model_to_dictionary(actual) == expected

        # Now process events and make sure things change as expected
        my_challenge.process(session, "test_event", [
            {
                "user_id": 1,
                "block_number": 100
            },
            {
                "user_id": 2,
                "block_number": 100
            },
            {
                "user_id": 3,
                "block_number": 100
            },
            # Attempt to add id 6 twice to
            # ensure that it doesn't cause a collision
            {
                "user_id": 6,
                "block_number": 100
            },
            {
                "user_id": 6,
                "block_number": 100
            }
        ])
        session.flush()

        updated_complete = session.query(UserChallenge).filter(
            UserChallenge.challenge_id == 'test_challenge_1'
        ).all()
        res_dicts = list(map(model_to_dictionary, updated_complete))
        expected = [
            # Should have incremented step count + 1
            {
                "challenge_id": "test_challenge_1",
                "user_id": 1,
                "specifier": '1',
                "is_complete": False,
                "current_step_count": 2
            },
            # Should be unchanged b/c it was already complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 2,
                "specifier": '2',
                "is_complete": True,
                "current_step_count": 3
            },
            # Should be newly complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 3,
                "specifier": '3',
                "is_complete": True,
                "current_step_count": 3
            },
            # Should be untouched bc user 5 wasn't included
            {
                "challenge_id": "test_challenge_1",
                "user_id": 5,
                "specifier": '5',
                "is_complete": False,
                "current_step_count": 2
            },
            # Should have created a brand new user 6
            {
                "challenge_id": "test_challenge_1",
                "user_id": 6,
                "specifier": '6',
                "is_complete": False,
                "current_step_count": 1
            }
        ]
        assert expected == res_dicts
