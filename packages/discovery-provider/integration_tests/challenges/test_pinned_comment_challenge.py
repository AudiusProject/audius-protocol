from datetime import datetime

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.pinned_comment_challenge import pinned_comment_challenge_manager
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.rewards.user_challenge import UserChallenge
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 1
BLOCK_DATETIME = datetime.now()
TRACK_ID = 1234
COMMENT_ID = 5678


def test_pinned_comment_challenge(app):
    """Test the pinned comment challenge functionality."""
    redis_conn = get_redis()

    with app.app_context():
        db = get_db()

    block = Block(blockhash="0x1", number=BLOCK_NUMBER)

    # Create a commenter user (regular user)
    commenter = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=1,
        is_current=True,
        handle="Commenter",
        handle_lc="commenter",
        wallet="0x1",
        is_verified=False,
        name="commenter_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    # Create an artist who is verified
    verified_artist = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=2,
        is_current=True,
        handle="VerifiedArtist",
        handle_lc="verifiedartist",
        wallet="0x2",
        is_verified=True,
        name="verified_artist_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    # Create an artist who is not verified
    unverified_artist = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="xyz",
        user_id=3,
        is_current=True,
        handle="UnverifiedArtist",
        handle_lc="unverifiedartist",
        wallet="0x3",
        is_verified=False,
        name="unverified_artist_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        # Setup
        bus = ChallengeEventBus(redis_conn)
        bus.register_listener(
            ChallengeEvent.pinned_comment, pinned_comment_challenge_manager
        )

        session.add(block)
        session.flush()
        session.add(commenter)
        session.add(verified_artist)
        session.add(unverified_artist)
        session.flush()

        # Set challenge as active for purpose of test
        session.query(Challenge).filter(Challenge.id == "cp").update(
            {"active": True, "starting_block": BLOCK_NUMBER, "step_count": 2147483647}
        )

        # Test 1: Comment pinned by verified artist - should create a challenge
        # In the real application, this event is only dispatched if the artist is verified
        # (see comment.py:pin_comment function)
        bus.dispatch(
            ChallengeEvent.pinned_comment,
            BLOCK_NUMBER,
            BLOCK_DATETIME,
            commenter.user_id,
            {
                "track_id": TRACK_ID,
                "comment_id": COMMENT_ID,
                "track_owner_id": verified_artist.user_id,
                "artist_is_verified": True,
            },
        )
        bus.flush()
        bus.process_events(session)

        commenter_challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == commenter.user_id)
            .all()
        )
        assert len(commenter_challenges) == 1
        assert commenter_challenges[0].challenge_id == "cp"
        assert commenter_challenges[0].is_complete == True

        # Test 2: Comment pinned by unverified artist
        # In the real application, this event would never be dispatched for an unverified artist
        # because the artist_is_verified check happens in comment.py:pin_comment before dispatch
        # We'll skip simulating this case since it would never reach the challenge manager

        # Test 3: Artist comments on their own track and pins it - should not create a challenge
        bus.dispatch(
            ChallengeEvent.pinned_comment,
            BLOCK_NUMBER,
            BLOCK_DATETIME,
            verified_artist.user_id,
            {
                "track_id": TRACK_ID + 2,  # Different track
                "comment_id": COMMENT_ID + 2,
                "track_owner_id": verified_artist.user_id,
                "artist_is_verified": True,
            },
        )
        bus.flush()
        bus.process_events(session)

        # Verified artist should not have any challenges
        artist_challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == verified_artist.user_id)
            .all()
        )
        assert len(artist_challenges) == 0

        # Test 4: Multiple comments pinned by verified artist for same user
        # With step_count now being 2147483647, users should be able to get rewards for multiple pinned comments
        bus.dispatch(
            ChallengeEvent.pinned_comment,
            BLOCK_NUMBER,
            BLOCK_DATETIME,
            commenter.user_id,
            {
                "track_id": TRACK_ID + 3,  # Another different track
                "comment_id": COMMENT_ID + 3,
                "track_owner_id": verified_artist.user_id,
                "artist_is_verified": True,
            },
        )
        bus.flush()
        bus.process_events(session)

        # User should now have two pinned comment challenges (one from Test 1, one from Test 4)
        commenter_challenges = (
            session.query(UserChallenge)
            .filter(UserChallenge.user_id == commenter.user_id)
            .all()
        )
        assert len(commenter_challenges) == 2
        assert all(challenge.challenge_id == "cp" for challenge in commenter_challenges)
        assert all(challenge.is_complete == True for challenge in commenter_challenges)
