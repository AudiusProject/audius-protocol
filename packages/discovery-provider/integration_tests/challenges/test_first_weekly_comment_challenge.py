import logging
from datetime import datetime, timedelta

from sqlalchemy.orm.session import Session

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.first_weekly_comment_challenge import (
    first_weekly_comment_challenge_manager,
)
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 10


def create_comment(day_offset: int, comment_id: int = 1) -> dict:
    """Create a comment with the given day offset and comment ID"""
    delta = timedelta(days=day_offset)
    comment_time = datetime.now() + delta

    return {
        "comment_id": comment_id,
        "entity_id": 1,  # Track ID
        "entity_type": "Track",
        "user_id": 1,  # User ID
        "created_at": comment_time.timestamp(),
        "body": "Test comment for weekly challenge",
    }


def dispatch_comment(
    day_offset: int,
    session: Session,
    bus: ChallengeEventBus,
    comment_id: int = 1,
    user_id: int = 1,
):
    """Dispatch a comment event with the given day offset"""
    comment = create_comment(day_offset, comment_id)
    comment["user_id"] = user_id  # Set the user ID

    # Dispatch the first_weekly_comment event
    bus.dispatch(
        ChallengeEvent.first_weekly_comment,
        BLOCK_NUMBER,
        datetime.now(),
        user_id,
        comment,
    )


def setup_challenges(session):
    """Set up the necessary database records for testing"""
    block = Block(blockhash="0x1", number=BLOCK_NUMBER)
    user = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=1,
        is_current=True,
        handle="TestHandle",
        handle_lc="testhandle",
        wallet="0x1",
        is_verified=False,
        name="test_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    # Add a second user for multi-user tests
    user2 = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=2,
        is_current=True,
        handle="TestHandle2",
        handle_lc="testhandle2",
        wallet="0x2",
        is_verified=False,
        name="test_name2",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    session.add(block)
    session.flush()
    session.add(user)
    session.add(user2)
    session.flush()
    session.query(Challenge).filter(Challenge.id == "c").update(
        {"active": True, "starting_block": BLOCK_NUMBER}
    )


# Wrapper function to call use_scoped_dispatch_queue,
# and then process when it goes out of scope
def make_scope_and_process(bus, session):
    def inner(fn):
        with bus.use_scoped_dispatch_queue():
            fn()
        bus.process_events(session)

    return inner


def test_first_weekly_comment_challenge(app):
    """Test that the first weekly comment challenge works correctly"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    # Register events with the bus
    bus.register_listener(
        ChallengeEvent.first_weekly_comment, first_weekly_comment_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)

        # wrapped dispatch comment
        def dc(offset, comment_id=1, user_id=1):
            return dispatch_comment(offset, session, bus, comment_id, user_id)

        scope_and_process = make_scope_and_process(bus, session)

        # Make a comment in the first week
        scope_and_process(lambda: dc(0, 1))

        # Check that the challenge is completed
        state = first_weekly_comment_challenge_manager.get_user_challenge_state(session)
        assert len(state) == 1
        assert state[0].is_complete == True

        # Make another comment in the same week
        scope_and_process(lambda: dc(1, 2))

        # Check that no new challenge is created
        state = first_weekly_comment_challenge_manager.get_user_challenge_state(session)
        assert len(state) == 1
        assert state[0].is_complete == True

        # Make a comment in the next week (7 days later)
        scope_and_process(lambda: dc(7, 3))

        # Check that a new challenge is created and completed
        state = first_weekly_comment_challenge_manager.get_user_challenge_state(session)
        assert len(state) == 2
        assert state[0].is_complete == True
        assert state[1].is_complete == True


def test_multiple_users_weekly_comment(app):
    """Test that the challenge works correctly with multiple users"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(
        ChallengeEvent.first_weekly_comment, first_weekly_comment_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)
        scope_and_process = make_scope_and_process(bus, session)

        # User 1 makes a comment
        scope_and_process(lambda: dispatch_comment(0, session, bus, 1, 1))

        # User 2 makes a comment
        scope_and_process(lambda: dispatch_comment(0, session, bus, 2, 2))

        # Check that both users have completed challenges
        challenge_state = (
            first_weekly_comment_challenge_manager.get_user_challenge_state(session)
        )

        assert len(challenge_state) == 2
        assert challenge_state[0].is_complete == True
        assert challenge_state[1].is_complete == True

        # Verify different specifiers for different users
        assert challenge_state[0].specifier != challenge_state[1].specifier


def test_comment_across_weeks(app):
    """Test that comments across different weeks create separate challenges"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(
        ChallengeEvent.first_weekly_comment, first_weekly_comment_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)
        scope_and_process = make_scope_and_process(bus, session)

        # Week 1
        scope_and_process(lambda: dispatch_comment(0, session, bus, 1))

        # Week 2
        scope_and_process(lambda: dispatch_comment(7, session, bus, 2))

        # Week 3
        scope_and_process(lambda: dispatch_comment(14, session, bus, 3))

        # Check that we have three separate challenges
        state = first_weekly_comment_challenge_manager.get_user_challenge_state(session)

        assert len(state) == 3
        assert all(challenge.is_complete for challenge in state)

        # Verify different specifiers for different weeks
        assert state[0].specifier != state[1].specifier
        assert state[1].specifier != state[2].specifier
        assert state[0].specifier != state[2].specifier
