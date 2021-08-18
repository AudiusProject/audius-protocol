from typing import Dict, List, Optional
import redis
from sqlalchemy.orm.session import Session

from tests.test_get_challenges import DefaultUpdater
from tests.utils import populate_mock_db_blocks

from src.models import Challenge, UserChallenge, ChallengeType
from src.utils.db_session import get_db
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.utils.helpers import model_to_dictionary
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.utils.config import shared_config
from src.queries.get_challenges import get_challenges


def setup_challenges(app):
    with app.app_context():
        db = get_db()
        challenges = [
            Challenge(
                id="test_challenge_1",
                type=ChallengeType.numeric,
                amount=5,
                step_count=3,
                active=True,
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
                step_count=5,
                active=True,
                starting_block=100,
            ),
            Challenge(
                id="some_inactive_challenge",
                type=ChallengeType.numeric,
                amount=5,
                step_count=5,
                active=False,
                starting_block=0,
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
                challenge_id="test_challenge_1",
                user_id=3,
                specifier="3",
                current_step_count=2,
                is_complete=False,
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=4,
                specifier="4",
                is_complete=True,
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=5,
                specifier="5",
                is_complete=False,
                current_step_count=2,
            ),
        ]

        with db.scoped_session() as session:
            # Wipe any existing challenges in the DB from running migrations, etc
            session.query(Challenge).delete()
            session.add_all(challenges)
            session.flush()
            session.add_all(user_challenges)


class TestUpdater(ChallengeUpdater):
    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        for user_challenge in user_challenges:
            if step_count is not None and user_challenge.current_step_count is not None:
                user_challenge.current_step_count += 1
                if user_challenge.current_step_count >= step_count:
                    user_challenge.is_complete = True


def test_handle_event(app):
    setup_challenges(app)

    with app.app_context():
        db = get_db()

    populate_mock_db_blocks(db, 99, 110)

    with db.scoped_session() as session:

        my_challenge = ChallengeManager("test_challenge_1", TestUpdater())
        # First try an event with a insufficient block_number
        # to ensure that nothing happens
        my_challenge.process(
            session,
            "test_event",
            [
                {"user_id": 1, "block_number": 99, "extra": {}},
            ],
        )
        session.flush()
        actual = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "test_challenge_1",
                UserChallenge.user_id == 1,
            )
            .first()
        )
        expected = {
            "challenge_id": "test_challenge_1",
            "user_id": 1,
            "specifier": "1",
            "is_complete": False,
            "current_step_count": 1,
            "completed_blocknumber": None,
        }
        assert model_to_dictionary(actual) == expected

        # Now process events and make sure things change as expected
        my_challenge.process(
            session,
            "test_event",
            [
                {"user_id": 1, "block_number": 100, "extra": {}},
                {"user_id": 2, "block_number": 100, "extra": {}},
                {"user_id": 3, "block_number": 100, "extra": {}},
                # Attempt to add id 6 twice to
                # ensure that it doesn't cause a collision
                {"user_id": 6, "block_number": 100, "extra": {}},
                {"user_id": 6, "block_number": 100, "extra": {}},
            ],
        )
        session.flush()

        updated_complete = (
            session.query(UserChallenge)
            .filter(UserChallenge.challenge_id == "test_challenge_1")
            .all()
        )
        res_dicts = list(map(model_to_dictionary, updated_complete))
        expected = [
            # Should have incremented step count + 1
            {
                "challenge_id": "test_challenge_1",
                "user_id": 1,
                "specifier": "1",
                "is_complete": False,
                "current_step_count": 2,
                "completed_blocknumber": None,
            },
            # Should be unchanged b/c it was already complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 2,
                "specifier": "2",
                "is_complete": True,
                "current_step_count": 3,
                "completed_blocknumber": 100,
            },
            # Should be newly complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 3,
                "specifier": "3",
                "is_complete": True,
                "current_step_count": 3,
                "completed_blocknumber": 100,
            },
            # Should be untouched bc user 5 wasn't included
            {
                "challenge_id": "test_challenge_1",
                "user_id": 5,
                "specifier": "5",
                "is_complete": False,
                "current_step_count": 2,
                "completed_blocknumber": None,
            },
            # Should have created a brand new user 6
            {
                "challenge_id": "test_challenge_1",
                "user_id": 6,
                "specifier": "6",
                "is_complete": False,
                "current_step_count": 1,
                "completed_blocknumber": None,
            },
        ]
        assert expected == res_dicts


class AggregateUpdater(ChallengeUpdater):
    def update_user_challenges(
        self,
        session: Session,
        event: str,
        user_challenges: List[UserChallenge],
        step_count: Optional[int],
        event_metadatas: List[FullEventMetadata],
        starting_block: Optional[int],
    ):
        pass

    def generate_specifier(self, user_id: int, extra: Dict) -> str:
        return f"{user_id}-{extra['referred_id']}"


REDIS_URL = shared_config["redis"]["url"]


def test_aggregates(app):

    setup_challenges(app)

    with app.app_context():
        db = get_db()

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)
        agg_challenge = ChallengeManager("test_challenge_3", AggregateUpdater())
        agg_challenge.process(session, "test_event", [])
        TEST_EVENT = "TEST_EVENT"

        bus.register_listener(
            TEST_EVENT, ChallengeManager("test_challenge_1", DefaultUpdater())
        )
        bus.register_listener(
            TEST_EVENT, ChallengeManager("test_challenge_2", DefaultUpdater())
        )
        # - Multiple events with the same user_id but diff specifiers get created
        bus.register_listener(TEST_EVENT, agg_challenge)
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 2})
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 3})
        bus.flush()
        bus.process_events(session)
        state = agg_challenge.get_user_challenge_state(session, ["1-2", "1-3"])
        assert len(state) == 2
        # Also make sure the thing is incomplete
        res = get_challenges(1, False, session, bus)
        agg_chal = {c["challenge_id"]: c for c in res}["test_challenge_3"]
        assert agg_chal["is_complete"] == False

        # - Multiple events with the same specifier get deduped
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 4})
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 4})
        bus.flush()
        bus.process_events(session)
        state = agg_challenge.get_user_challenge_state(session, ["1-4"])
        assert len(state) == 1

        # - If we've maxed the # of challenges, don't create any more
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 5})
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 6})
        bus.flush()
        bus.process_events(session)

        def get_user_challenges():
            return (
                session.query(UserChallenge)
                .filter(
                    UserChallenge.challenge_id == "test_challenge_3",
                    UserChallenge.user_id == 1,
                )
                .all()
            )

        assert len(get_user_challenges()) == 5
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 7})
        bus.flush()
        bus.process_events(session)
        assert len(get_user_challenges()) == 5

        # Test get_challenges
        res = get_challenges(1, False, session, bus)
        agg_chal = {c["challenge_id"]: c for c in res}["test_challenge_3"]
        assert agg_chal["is_complete"] == True
        # Assert all user challenges have proper finishing block #
        user_challenges = get_user_challenges()
        for uc in user_challenges:
            assert uc.completed_blocknumber == 100


def test_in_memory_queue(app):
    setup_challenges(app)

    with app.app_context():
        db = get_db()

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    bus = ChallengeEventBus(redis_conn)
    with db.scoped_session() as session, bus.use_scoped_dispatch_queue():
        agg_challenge = ChallengeManager("test_challenge_3", AggregateUpdater())
        agg_challenge.process(session, "test_event", [])
        TEST_EVENT = "TEST_EVENT"

        bus.register_listener(
            TEST_EVENT, ChallengeManager("test_challenge_1", DefaultUpdater())
        )
        bus.register_listener(
            TEST_EVENT, ChallengeManager("test_challenge_2", DefaultUpdater())
        )
        # - Multiple events with the same user_id but diff specifiers get created
        bus.register_listener(TEST_EVENT, agg_challenge)
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 2})
        bus.dispatch(TEST_EVENT, 100, 1, {"referred_id": 3})
        bus.process_events(session)

        # no events should be processed because we haven't dispatched yet
        state = agg_challenge.get_user_challenge_state(session, ["1-2", "1-3"])
        assert len(state) == 0

    bus.process_events(session)
    state = agg_challenge.get_user_challenge_state(session, ["1-2", "1-3"])
    assert len(state) == 2
    # Also make sure the thing is incomplete
    res = get_challenges(1, False, session, bus)
    agg_chal = {c["challenge_id"]: c for c in res}["test_challenge_3"]
    assert agg_chal["is_complete"] == False

    redis_conn = redis.Redis.from_url(url=REDIS_URL)


def test_inactive_challenge(app):
    setup_challenges(app)
    with app.app_context():
        db = get_db()

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    bus = ChallengeEventBus(redis_conn)
    with db.scoped_session() as session:
        mgr = ChallengeManager("some_inactive_challenge", DefaultUpdater())
        TEST_EVENT = "TEST_EVENT"
        bus.register_listener(TEST_EVENT, mgr)
        with bus.use_scoped_dispatch_queue():
            bus.dispatch(TEST_EVENT, 100, 1, {})
        bus.process_events(session)
        state = mgr.get_user_challenge_state(session, ["1"])
        # We should not have any UserChallenges created for the
        # inactive challenge!!
        assert len(state) == 0
