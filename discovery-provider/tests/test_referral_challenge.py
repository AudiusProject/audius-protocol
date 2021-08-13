from datetime import datetime

import redis
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.referral_challenge import (
    referral_challenge_manager,
    referred_challenge_manager,
)
from src.models.models import Block, User, UserChallenge
from src.models.user_events import UserEvents
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]


def create_user(offset: int) -> User:
    return User(
        blockhash="0x1",
        blocknumber=1,
        txhash="xyz",
        user_id=offset,
        is_current=True,
        handle=f"TestHandle-{offset}",
        handle_lc=f"testhandle-{offset}",
        wallet="0x1",
        is_creator=False,
        is_verified=False,
        name=f"test_name_{offset}",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


def create_user_referral(referrer: int, referred_user_id: int) -> UserEvents:
    return UserEvents(
        user_id=referred_user_id,
        is_current=True,
        blocknumber=1,
        blockhash="0x1",
        referrer=referrer,
    )


def dispatch_new_user_signup(
    referrer: int, referred_user_id: int, session: Session, bus: ChallengeEventBus
):
    session.add(create_user(referred_user_id))
    session.add(create_user_referral(referrer, referred_user_id))
    session.flush()
    bus.dispatch(
        ChallengeEvent.referral_signup,
        1,
        referrer,
        {"referred_user_id": referred_user_id},
    )
    bus.dispatch(ChallengeEvent.referred_signup, 1, referred_user_id)


def test_referral_challenge(app):
    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    with app.app_context():
        db = get_db()

    block = Block(blockhash="0x1", number=1)
    referrer = User(
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
            ChallengeEvent.referred_signup, referred_challenge_manager
        )
        bus.register_listener(
            ChallengeEvent.referral_signup, referral_challenge_manager
        )

        session.add(block)
        session.flush()
        session.add(referrer)
        session.flush()
        dispatch_new_user_signup(referrer.user_id, 2, session, bus)
        for _ in range(0, 4):
            bus.dispatch(
                ChallengeEvent.referral_signup,
                1,
                referrer.user_id,
                {"referred_user_id": 2},
            )
            bus.dispatch(ChallengeEvent.referred_signup, 1, 2)
        bus.flush()
        bus.process_events(session)

        challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == referrer.user_id)
            .all()
        )
        assert len(challenges) == 1

        dispatch_new_user_signup(referrer.user_id, 3, session, bus)
        dispatch_new_user_signup(referrer.user_id, 4, session, bus)
        dispatch_new_user_signup(referrer.user_id, 5, session, bus)
        dispatch_new_user_signup(referrer.user_id, 6, session, bus)
        dispatch_new_user_signup(referrer.user_id, 7, session, bus)
        dispatch_new_user_signup(referrer.user_id, 8, session, bus)
        dispatch_new_user_signup(referrer.user_id, 9, session, bus)
        dispatch_new_user_signup(referrer.user_id, 10, session, bus)
        dispatch_new_user_signup(referrer.user_id, 11, session, bus)
        bus.flush()
        bus.process_events(session)

        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == referrer.user_id,
                UserChallenge.challenge_id == "referrals",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 5

        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.challenge_id == "referred",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 10
