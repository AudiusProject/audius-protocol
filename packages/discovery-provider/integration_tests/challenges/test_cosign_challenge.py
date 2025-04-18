import logging
from datetime import datetime, timedelta

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.cosign_challenge import cosign_challenge_manager
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 10


def dispatch_cosign(
    bus: ChallengeEventBus,
    track_id: int,
    original_track_owner_id: int,
    track_owner_id: int,
    date: datetime,
):
    """Dispatch a cosign event"""
    bus.dispatch(
        ChallengeEvent.cosign,
        BLOCK_NUMBER,
        date,
        track_owner_id,
        {
            "original_track_owner_id": original_track_owner_id,
            "remix_track_id": track_id,
            "cosign_date": date.timestamp(),
        },
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

    session.add(block)
    session.flush()
    session.add(user)
    session.flush()
    session.query(Challenge).filter(Challenge.id == "cs").update(
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


def test_cosign_challenge(app):
    """Test that the cosign challenge works correctly"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    # Register events with the bus
    bus.register_listener(ChallengeEvent.cosign, cosign_challenge_manager)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)

        def dc(
            track_id: int,
            original_track_owner_id: int,
            remixer_user_id: int,
            date: datetime,
        ):
            return dispatch_cosign(
                bus, track_id, original_track_owner_id, remixer_user_id, date
            )

        scope_and_process = make_scope_and_process(bus, session)

        # limited to 5 verified cosigns per month
        for track_id in range(1, 10):
            scope_and_process(
                lambda: dc(track_id, 2, 1, datetime.now() - timedelta(days=50))
            )

        scope_and_process(lambda: dc(11, 2, 1, datetime.now()))

        # Check that the challenge is completed
        state = cosign_challenge_manager.get_user_challenge_state(session)
        assert len(state) == 6
        assert state[0].is_complete == True
