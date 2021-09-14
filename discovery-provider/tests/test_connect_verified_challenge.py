import logging
from datetime import datetime
import redis

from src.models import User, Block
from src.utils.db_session import get_db
from src.challenges.connect_verified_challenge import connect_verified_challenge_manager
from src.challenges.challenge_event_bus import ChallengeEventBus, ChallengeEvent
from src.utils.config import shared_config

REDIS_URL = shared_config["redis"]["url"]
logger = logging.getLogger(__name__)


def test_connect_verified_challenge(app):
    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    with app.app_context():
        db = get_db()

    block = Block(blockhash="0x1", number=1)
    user = User(
        blockhash="0x1",
        blocknumber=1,
        txhash="xyz",
        user_id=1,
        is_current=True,
        handle="TestHandle",
        handle_lc="testhandle",
        wallet="0x1",
        is_creator=False,
        is_verified=False,
        name="test_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)

        # Register events with the bus
        bus.register_listener(
            ChallengeEvent.connect_verified, connect_verified_challenge_manager
        )

        session.add(block)
        session.flush()
        session.add(user)
        session.flush()

        bus.dispatch(
            ChallengeEvent.connect_verified,
            1,  # block_number
            1,  # user_id
            {},
        )
        bus.flush()
        bus.process_events(session)
        session.flush()

        state = connect_verified_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.is_complete
