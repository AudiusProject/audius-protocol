from datetime import datetime

from sqlalchemy.sql.expression import or_

from src.challenges.audio_matching_challenge import (
    audio_matching_buyer_challenge_manager,
    audio_matching_seller_challenge_manager,
)
from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 1
AMOUNT_FIVE = 5
TRACK_ID = 1234


def test_referral_challenge(app):
    redis_conn = get_redis()

    with app.app_context():
        db = get_db()

    block = Block(blockhash="0x1", number=BLOCK_NUMBER)
    buyer = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=1,
        is_current=True,
        handle="Buyer",
        handle_lc="buyer",
        wallet="0x1",
        is_verified=False,
        name="buyer_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    seller_unverified = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=2,
        is_current=True,
        handle="Seller",
        handle_lc="seller",
        wallet="0x1",
        is_verified=False,
        name="seller_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    seller_verified = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=3,
        is_current=True,
        handle="Seller_unverified",
        handle_lc="seller_unverified",
        wallet="0x1",
        is_verified=True,
        name="seller_unverified_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        # Setup
        bus = ChallengeEventBus(redis_conn)
        bus.register_listener(
            ChallengeEvent.audio_matching_buyer, audio_matching_buyer_challenge_manager
        )
        bus.register_listener(
            ChallengeEvent.audio_matching_seller,
            audio_matching_seller_challenge_manager,
        )
        session.add(block)
        session.flush()
        session.add(buyer)
        session.add(seller_verified)
        session.flush()
        # set challenge as active for purposes of test
        session.query(Challenge).filter(
            or_(
                Challenge.id == "b",
                Challenge.id == "s",
            )
        ).update({"active": True, "starting_block": BLOCK_NUMBER})

        # Test: vanilla case
        bus.dispatch(
            ChallengeEvent.audio_matching_buyer,
            BLOCK_NUMBER,
            buyer.user_id,
            {"track_id": TRACK_ID, "amount": AMOUNT_FIVE},
        )
        bus.dispatch(
            ChallengeEvent.audio_matching_seller,
            BLOCK_NUMBER,
            seller_verified.user_id,
            {
                "track_id": TRACK_ID,
                "sender_user_id": buyer.user_id,
                "amount": AMOUNT_FIVE,
            },
        )
        bus.flush()
        bus.process_events(session)

        buyer_challenges = (
            session.query(UserChallenge.amount)
            .filter(UserChallenge.user_id == buyer.user_id)
            .all()
        )
        assert len(buyer_challenges) == 1
        assert buyer_challenges[0][0] == AMOUNT_FIVE
        seller_challenges = (
            session.query(UserChallenge.amount)
            .filter(UserChallenge.user_id == seller_verified.user_id)
            .all()
        )
        assert len(seller_challenges) == 1
        assert seller_challenges[0][0] == AMOUNT_FIVE

        # Test: unverified sellers don't get challenges
        bus.dispatch(
            ChallengeEvent.audio_matching_seller,
            BLOCK_NUMBER,
            seller_unverified.user_id,
            {
                "track_id": TRACK_ID,
                "sender_user_id": buyer.user_id,
                "amount": AMOUNT_FIVE,
            },
        )
        bus.flush()
        bus.process_events(session)

        seller_challenges = (
            session.query(UserChallenge.amount)
            .filter(UserChallenge.user_id == seller_unverified.user_id)
            .all()
        )
        assert len(seller_challenges) == 0
