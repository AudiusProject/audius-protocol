import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy.orm.session import Session

from integration_tests.queries.test_get_challenges import DefaultUpdater
from integration_tests.utils import populate_mock_db_blocks
from src.challenges.challenge import (
    ChallengeManager,
    ChallengeUpdater,
    FullEventMetadata,
)
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge, ChallengeType
from src.models.rewards.user_challenge import UserChallenge
from src.queries.get_challenges import get_challenges
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.helpers import model_to_dictionary
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

AGGREGATE_CHALLENGE_REWARD_AMOUNT = 5
AGGREGATE_CHALLENGE_STEP_COUNT = 5
TEST_BLOCK_DATETIME = datetime.now()


def get_created_at():
    return datetime.strptime(
        "2023-10-13 11:15:10.627328+00", "%Y-%m-%d %H:%M:%S.%f+00"
    ).replace(tzinfo=timezone.utc)


def setup_challenges(app):
    with app.app_context():
        db = get_db()
        challenges = [
            Challenge(
                id="test_challenge_1",
                type=ChallengeType.numeric,
                amount="5",
                step_count=3,
                active=True,
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
                amount=str(AGGREGATE_CHALLENGE_REWARD_AMOUNT),
                step_count=AGGREGATE_CHALLENGE_REWARD_AMOUNT
                * AGGREGATE_CHALLENGE_STEP_COUNT,
                active=True,
                starting_block=100,
            ),
            Challenge(
                id="some_inactive_challenge",
                type=ChallengeType.numeric,
                amount="5",
                step_count=5,
                active=False,
                starting_block=0,
            ),
        ]
        user_challenges = [
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=1,
                specifier="7eP5n",
                is_complete=False,
                current_step_count=1,
                amount=5,
                created_at=get_created_at(),
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=2,
                specifier="ML51L",
                is_complete=True,
                completed_at=TEST_BLOCK_DATETIME,
                current_step_count=3,
                completed_blocknumber=100,
                amount=5,
                created_at=get_created_at(),
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=3,
                specifier="lebQD",
                current_step_count=2,
                is_complete=False,
                amount=5,
                created_at=get_created_at(),
            ),
            UserChallenge(
                challenge_id="test_challenge_2",
                user_id=4,
                specifier="ELKzn",
                is_complete=True,
                completed_at=TEST_BLOCK_DATETIME,
                amount=5,
                created_at=get_created_at(),
            ),
            UserChallenge(
                challenge_id="test_challenge_1",
                user_id=5,
                specifier="pnagD",
                is_complete=False,
                current_step_count=2,
                amount=5,
                created_at=get_created_at(),
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
                {
                    "user_id": 1,
                    "block_number": 99,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
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
            "specifier": "7eP5n",
            "is_complete": False,
            "completed_at": None,
            "current_step_count": 1,
            "completed_blocknumber": None,
            "amount": 5,
            "created_at": get_created_at(),
        }
        assert model_to_dictionary(actual) == expected

        # Now process events and make sure things change as expected
        my_challenge.process(
            session,
            "test_event",
            [
                {
                    "user_id": 1,
                    "block_number": 100,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
                {
                    "user_id": 2,
                    "block_number": 100,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
                {
                    "user_id": 3,
                    "block_number": 100,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
                # Attempt to add id 6 twice to
                # ensure that it doesn't cause a collision
                {
                    "user_id": 6,
                    "block_number": 100,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
                {
                    "user_id": 6,
                    "block_number": 100,
                    "block_datetime": TEST_BLOCK_DATETIME,
                    "extra": {},
                },
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
                "specifier": "7eP5n",
                "is_complete": False,
                "completed_at": None,
                "current_step_count": 2,
                "completed_blocknumber": None,
                "amount": 5,
                "created_at": get_created_at(),
            },
            # Should be unchanged b/c it was already complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 2,
                "specifier": "ML51L",
                "is_complete": True,
                "completed_at": TEST_BLOCK_DATETIME,
                "current_step_count": 3,
                "completed_blocknumber": 100,
                "amount": 5,
                "created_at": get_created_at(),
            },
            # Should be newly complete
            {
                "challenge_id": "test_challenge_1",
                "user_id": 3,
                "specifier": "lebQD",
                "is_complete": True,
                "completed_at": TEST_BLOCK_DATETIME,
                "current_step_count": 3,
                "completed_blocknumber": 100,
                "amount": 5,
                "created_at": get_created_at(),
            },
            # Should be untouched bc user 5 wasn't included
            {
                "challenge_id": "test_challenge_1",
                "user_id": 5,
                "specifier": "pnagD",
                "is_complete": False,
                "completed_at": None,
                "current_step_count": 2,
                "completed_blocknumber": None,
                "amount": 5,
                "created_at": get_created_at(),
            },
            # Should have created a brand new user 6
            {
                "challenge_id": "test_challenge_1",
                "user_id": 6,
                "specifier": "AnlGe",
                "is_complete": False,
                "completed_at": None,
                "current_step_count": 1,
                "completed_blocknumber": None,
                "amount": 5,
            },
        ]
        # the last challenge was just created so we don't know the created_at time
        del res_dicts[-1]["created_at"]
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

    redis_conn = get_redis()

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
        bus.dispatch(
            TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 2, "amount": 4}
        )
        bus.dispatch(
            TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 3, "amount": 6}
        )
        bus.flush()
        bus.process_events(session)
        state = agg_challenge.get_user_challenge_state(session, ["1-2", "1-3"])
        assert len(state) == 2
        # Test different amounts for the same challenge
        assert state[0].amount == 4
        assert state[1].amount == 6

        # Also make sure the thing is incomplete
        res = get_challenges(1, False, session, bus)
        agg_chal = {c["challenge_id"]: c for c in res}["test_challenge_3"]
        assert agg_chal["is_complete"] == False

        # - Multiple events with the same specifier get deduped
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 4})
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 4})
        bus.flush()
        bus.process_events(session)
        state = agg_challenge.get_user_challenge_state(session, ["1-4"])
        state = agg_challenge.get_user_challenge_state(session, ["1-4"])
        assert len(state) == 1

        def get_user_challenges():
            return (
                session.query(UserChallenge)
                .filter(
                    UserChallenge.challenge_id == "test_challenge_3",
                    UserChallenge.user_id == 1,
                )
                .all()
            )

        # - If we've maxed the # of challenges, don't create any more
        # (AGGREGATE_CHALLENGE_STEP_COUNT = 5)
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 5})
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 6})
        bus.flush()
        bus.process_events(session)
        assert len(get_user_challenges()) == AGGREGATE_CHALLENGE_STEP_COUNT
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 7})
        bus.flush()
        bus.process_events(session)
        assert len(get_user_challenges()) == AGGREGATE_CHALLENGE_STEP_COUNT

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

    redis_conn = get_redis()

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
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 2})
        bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {"referred_id": 3})
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

    redis_conn = get_redis()


def test_inactive_challenge(app):
    setup_challenges(app)
    with app.app_context():
        db = get_db()

    redis_conn = get_redis()

    bus = ChallengeEventBus(redis_conn)
    with db.scoped_session() as session:
        mgr = ChallengeManager("some_inactive_challenge", DefaultUpdater())
        TEST_EVENT = "TEST_EVENT"
        bus.register_listener(TEST_EVENT, mgr)
        with bus.use_scoped_dispatch_queue():
            bus.dispatch(TEST_EVENT, 100, TEST_BLOCK_DATETIME, 1, {})
        bus.process_events(session)
        state = mgr.get_user_challenge_state(session, ["1"])
        # We should not have any UserChallenges created for the
        # inactive challenge!!
        assert len(state) == 0


def test_rejects_invalid_events(app):
    setup_challenges(app)
    with app.app_context():
        db = get_db()

    redis_conn = get_redis()

    bus = ChallengeEventBus(redis_conn)
    with db.scoped_session() as session:
        mgr = ChallengeManager("test_challenge_1", DefaultUpdater())
        TEST_EVENT = "TEST_EVENT"
        bus.register_listener(TEST_EVENT, mgr)
        with bus.use_scoped_dispatch_queue():
            bus.dispatch(TEST_EVENT, None, TEST_BLOCK_DATETIME, 1)
            bus.dispatch(TEST_EVENT, 1, TEST_BLOCK_DATETIME, None)
            bus.dispatch(TEST_EVENT, 1, TEST_BLOCK_DATETIME, 1, 1)
        (count, did_error) = bus.process_events(session)
        assert count == 0
        assert did_error == False


class BrokenUpdater(ChallengeUpdater):
    # This should trigger a postgres exceptions
    def on_after_challenge_creation(self, session, metadatas: List[FullEventMetadata]):
        block1 = Block(blockhash="0x99", number=1)
        block2 = Block(blockhash="0x99", number=1)
        session.add_all([block1, block2])
        session.flush()


def test_catches_exceptions_in_single_processor(app):
    """Ensure that if a single processor fails, the others still succeed"""
    with app.app_context():
        db = get_db()

    redis_conn = get_redis()

    bus = ChallengeEventBus(redis_conn)
    with db.scoped_session() as session:
        session.add_all(
            [
                Challenge(
                    id="test_challenge_1",
                    type=ChallengeType.numeric,
                    amount="5",
                    step_count=3,
                    active=True,
                ),
                Challenge(
                    id="test_challenge_2",
                    type=ChallengeType.numeric,
                    amount="5",
                    step_count=3,
                    active=True,
                ),
            ]
        )
        session.commit()

        correct_manager = ChallengeManager("test_challenge_1", DefaultUpdater())
        broken_manager = ChallengeManager("test_challenge_2", BrokenUpdater())
        TEST_EVENT = "TEST_EVENT"
        TEST_EVENT_2 = "TEST_EVENT_2"
        bus.register_listener(TEST_EVENT, correct_manager)
        bus.register_listener(TEST_EVENT_2, broken_manager)

        with bus.use_scoped_dispatch_queue():
            # dispatch the broken one first
            bus.dispatch(TEST_EVENT_2, 101, TEST_BLOCK_DATETIME, 1)
            bus.dispatch(TEST_EVENT, 101, TEST_BLOCK_DATETIME, 1)
        try:
            bus.process_events(session)
        except:
            # pylint: disable=W0707
            raise Exception("Shouldn't have propogated error!")
        challenge_1_state = correct_manager.get_user_challenge_state(session, ["7eP5n"])
        # Make sure that the 'correct_manager' still executes
        assert len(challenge_1_state) == 1
        assert challenge_1_state[0].current_step_count == 1
        # Make sure broken manager didn't do anything
        challenge_2_state = broken_manager.get_user_challenge_state(session, ["7eP5n"])
        assert len(challenge_2_state) == 0

        # Try the other order
        with bus.use_scoped_dispatch_queue():
            # dispatch the correct one first
            bus.dispatch(TEST_EVENT, 101, TEST_BLOCK_DATETIME, 1)
            bus.dispatch(TEST_EVENT_2, 101, TEST_BLOCK_DATETIME, 1)
        try:
            bus.process_events(session)
        except:
            # pylint: disable=W0707
            raise Exception("Shouldn't have propogated error!")
        challenge_1_state = correct_manager.get_user_challenge_state(session, ["7eP5n"])
        assert len(challenge_1_state) == 1
        assert challenge_1_state[0].current_step_count == 2
        # Make sure broken manager didn't do anything
        challenge_2_state = broken_manager.get_user_challenge_state(session, ["7eP5n"])
        assert len(challenge_2_state) == 0
