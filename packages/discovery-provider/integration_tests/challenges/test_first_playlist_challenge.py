import logging
from datetime import datetime

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.first_playlist_challenge import first_playlist_challenge_manager
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 10
BLOCK_DATETIME = datetime.now()
logger = logging.getLogger(__name__)


def test_first_playlist_challenge(app):
    redis_conn = get_redis()

    with app.app_context():
        db = get_db()

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

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)
        session.query(Challenge).filter(Challenge.id == "first-playlist").update(
            {"active": True, "starting_block": BLOCK_NUMBER}
        )

        # Register events with the bus
        bus.register_listener(
            ChallengeEvent.first_playlist, first_playlist_challenge_manager
        )

        session.add(block)
        session.flush()
        session.add(user)
        session.flush()

        bus.dispatch(
            ChallengeEvent.first_playlist,
            BLOCK_NUMBER,
            BLOCK_DATETIME,
            user.user_id,
            {},
        )

        bus.flush()
        bus.process_events(session)
        session.flush()

        state = first_playlist_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]

        assert state.is_complete
