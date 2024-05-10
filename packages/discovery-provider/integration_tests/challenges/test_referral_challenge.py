from datetime import datetime

from sqlalchemy.orm.session import Session
from sqlalchemy.sql.expression import or_

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.referral_challenge import (
    referral_challenge_manager,
    referred_challenge_manager,
    verified_referral_challenge_manager,
)
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.models.users.user_events import UserEvent
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 1
BLOCK_DATETIME = datetime.now()


def create_user(offset: int) -> User:
    return User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=offset,
        is_current=True,
        handle=f"TestHandle-{offset}",
        handle_lc=f"testhandle-{offset}",
        wallet="0x1",
        is_verified=False,
        name=f"test_name_{offset}",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


def create_user_referral(referrer: int, referred_user_id: int) -> UserEvent:
    return UserEvent(
        user_id=referred_user_id,
        is_current=True,
        blocknumber=BLOCK_NUMBER,
        blockhash="0x1",
        referrer=referrer,
        is_mobile_user=False,
    )


def dispatch_new_user_signup(
    referrer: int, referred_user_id: int, session: Session, bus: ChallengeEventBus
):
    session.add(create_user(referred_user_id))
    session.add(create_user_referral(referrer, referred_user_id))
    session.flush()
    bus.dispatch(
        ChallengeEvent.referral_signup,
        BLOCK_NUMBER,
        BLOCK_DATETIME,
        referrer,
        {"referred_user_id": referred_user_id},
    )
    bus.dispatch(
        ChallengeEvent.referred_signup, BLOCK_NUMBER, BLOCK_DATETIME, referred_user_id
    )


def test_referral_challenge(app):
    redis_conn = get_redis()

    with app.app_context():
        db = get_db()

    block = Block(blockhash="0x1", number=BLOCK_NUMBER)
    referrer = User(
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
        # Setup
        bus = ChallengeEventBus(redis_conn)
        bus.register_listener(
            ChallengeEvent.referred_signup, referred_challenge_manager
        )
        bus.register_listener(
            ChallengeEvent.referral_signup, referral_challenge_manager
        )
        bus.register_listener(
            ChallengeEvent.referral_signup, verified_referral_challenge_manager
        )
        session.add(block)
        session.flush()
        session.add(referrer)
        session.flush()
        # set challenge as active for purposes of test
        session.query(Challenge).filter(
            or_(
                Challenge.id == "referred",
                Challenge.id == "referrals",
                Challenge.id == "ref-v",
            )
        ).update({"active": True, "starting_block": BLOCK_NUMBER})

        # Test:
        # Ensure a single referral from single signup
        # despite many challenge events
        dispatch_new_user_signup(referrer.user_id, 2, session, bus)
        for _ in range(0, 4):
            bus.dispatch(
                ChallengeEvent.referral_signup,
                BLOCK_NUMBER,
                BLOCK_DATETIME,
                referrer.user_id,
                {"referred_user_id": 2},
            )
            bus.dispatch(
                ChallengeEvent.referred_signup, BLOCK_NUMBER, BLOCK_DATETIME, 2
            )
        bus.flush()
        bus.process_events(session)

        challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == referrer.user_id)
            .all()
        )
        assert len(challenges) == 1

        # Test:
        # Multiple signups
        # - Referrer is capped at 5
        # - Referred can keep going
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

        # Test:
        # Ensure there are no verified user referrals created yet

        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == referrer.user_id,
                UserChallenge.challenge_id == "ref-v",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 0

        # Test: verified users
        # - Ensure that verified user referrals aren't counted
        #   for referrer credit
        # - Ensure that a verified user challenge exists

        verified_user = User(
            blockhash="0x1",
            blocknumber=BLOCK_NUMBER,
            txhash="xyz",
            user_id=12,
            is_current=True,
            handle="VerifiedReferrer",
            handle_lc="verifiedreferrer",
            wallet="0x1",
            is_verified=True,
            name="referrer_name",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        session.add(verified_user)
        session.flush()

        dispatch_new_user_signup(verified_user.user_id, 13, session, bus)
        bus.flush()
        bus.process_events(session)

        # Ensure no regular referral created
        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == verified_user.user_id,
                UserChallenge.challenge_id == "referrals",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 0

        # Ensure one verified referral created
        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == verified_user.user_id,
                UserChallenge.challenge_id == "ref-v",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 1

        # Test: verified max count
        #  - Ensure with > 5000 verified referrals, we cap at 5000
        #  - No regular referrals are made

        for i in range(5010):
            dispatch_new_user_signup(verified_user.user_id, 14 + i, session, bus)
            if i % 500 == 0:
                bus.flush()
                bus.process_events(session)

        bus.flush()
        bus.process_events(session)

        # Ensure 5000 verified referral created
        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == verified_user.user_id,
                UserChallenge.challenge_id == "ref-v",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 5000

        # Ensure no regular referral created
        challenges = (
            session.query(UserChallenge)
            .filter(
                UserChallenge.user_id == verified_user.user_id,
                UserChallenge.challenge_id == "referrals",
                UserChallenge.is_complete == True,
            )
            .all()
        )
        assert len(challenges) == 0
