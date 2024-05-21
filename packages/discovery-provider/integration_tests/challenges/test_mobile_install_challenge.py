from datetime import datetime

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.mobile_install_challenge import mobile_install_challenge_manager
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 10
BLOCK_DATETIME = datetime.now()


def test_mobile_install_challenge(app):
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
        handle="Referrer",
        handle_lc="referrer",
        wallet="0x1",
        is_verified=False,
        name="referrer_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)

        # set challenge as active for purposes of test
        session.query(Challenge).filter(Challenge.id == "mobile-install").update(
            {"active": True, "starting_block": BLOCK_NUMBER}
        )
        bus.register_listener(
            ChallengeEvent.mobile_install, mobile_install_challenge_manager
        )
        session.add(block)
        session.flush()
        session.add(user)
        session.flush()
        bus.dispatch(
            ChallengeEvent.mobile_install, BLOCK_NUMBER, BLOCK_DATETIME, user.user_id
        )
        bus.dispatch(
            ChallengeEvent.mobile_install, BLOCK_NUMBER, BLOCK_DATETIME, user.user_id
        )
        bus.flush()
        bus.process_events(session)

        challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == user.user_id)
            .all()
        )
        assert len(challenges) == 1
        assert challenges[0].is_complete
