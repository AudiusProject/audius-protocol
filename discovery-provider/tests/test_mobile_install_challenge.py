from datetime import datetime

import redis
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.challenges.mobile_install_challenge import mobile_install_challenge_manager
from src.models.models import Block, User, UserChallenge
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]


def test_referral_challenge(app):
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
        handle="Referrer",
        handle_lc="referrer",
        wallet="0x1",
        is_creator=False,
        is_verified=False,
        name="referrer_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)
        bus.register_listener(
            ChallengeEvent.mobile_install, mobile_install_challenge_manager
        )
        session.add(block)
        session.flush()
        session.add(user)
        session.flush()
        bus.dispatch(ChallengeEvent.mobile_install, 1, user.user_id)
        bus.dispatch(ChallengeEvent.mobile_install, 1, user.user_id)
        bus.flush()
        bus.process_events(session)

        challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == user.user_id)
            .all()
        )
        assert len(challenges) == 1
        assert challenges[0].is_complete
