import logging
from datetime import datetime, timedelta

from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.play_count_milestones_challenge import (
    PLAY_MILESTONES,
    play_count_milestones_challenge_manager,
)
from src.models.indexing.block import Block
from src.models.rewards.challenge import Challenge
from src.models.social.play import Play
from src.models.tracks.track import Track
from src.models.users.user import User
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
BLOCK_NUMBER = 10
CURRENT_YEAR = 2025  # The year for which plays are counted


def create_play(user_id: int, track_id: int, play_id: int, days_ago: int = 0) -> Play:
    """Create a play record with the specified parameters"""
    played_at = datetime(CURRENT_YEAR, 1, 1) + timedelta(days=days_ago)

    return Play(
        id=play_id,
        play_item_id=track_id,
        user_id=user_id,  # User who played the track
        source=None,
        slot=1,
        signature=None,
        created_at=played_at,
        updated_at=played_at,
    )


def create_track(user_id: int, track_id: int) -> Track:
    """Create a track with the specified parameters"""
    return Track(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="0x1",
        track_id=track_id,
        owner_id=user_id,
        is_current=True,
        is_delete=False,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


def setup_challenges(session):
    """Set up the database with the necessary data for testing"""
    # Create a block
    block = Block(blockhash="0x1", number=BLOCK_NUMBER)
    session.add(block)
    session.flush()

    # Create users
    user1 = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="0x1",
        user_id=1,
        is_current=True,
        handle="user1",
        handle_lc="user1",
        wallet="0x1",
        is_verified=False,
        name="User 1",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    user2 = User(
        blockhash="0x1",
        blocknumber=BLOCK_NUMBER,
        txhash="0x1",
        user_id=2,
        is_current=True,
        handle="user2",
        handle_lc="user2",
        wallet="0x2",
        is_verified=False,
        name="User 2",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    session.add(user1)
    session.add(user2)
    session.flush()

    # Create tracks
    track1 = create_track(user_id=1, track_id=1)
    track2 = create_track(user_id=2, track_id=2)
    session.add(track1)
    session.add(track2)
    session.flush()

    # Set challenge as active for purposes of test
    session.query(Challenge).filter(Challenge.id == "pc").update(
        {"active": True, "starting_block": BLOCK_NUMBER}
    )
    session.flush()


def make_scope_and_process(bus, session):
    """Create a function that processes events in a scoped queue"""

    def inner(fn):
        fn()
        bus.flush()
        bus.process_events(session)

    return inner


def test_play_count_milestones_challenge(app):
    """Test the play count milestones challenge"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)

    # Register event with the bus
    bus.register_listener(
        ChallengeEvent.track_played, play_count_milestones_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)
        scope_and_process = make_scope_and_process(bus, session)

        sorted_milestones = sorted(PLAY_MILESTONES.keys())
        first_milestone = sorted_milestones[0]

        # Add plays to reach first milestone
        plays = []
        for i in range(first_milestone):
            play = create_play(user_id=1, track_id=1, play_id=i + 1, days_ago=i % 30)
            plays.append(play)

        session.add_all(plays)
        session.flush()

        # Dispatch track_played event
        scope_and_process(
            lambda: bus.dispatch(
                ChallengeEvent.track_played,
                BLOCK_NUMBER,
                datetime.now(),
                1,  # user_id
                {},
            )
        )

        # Check that the challenge is created and completed
        challenges = play_count_milestones_challenge_manager.get_user_challenge_state(
            session
        )
        assert len(challenges) == 1
        assert challenges[0].user_id == 1
        assert challenges[0].challenge_id == "pc"
        assert challenges[0].is_complete == True
        assert challenges[0].amount == int(PLAY_MILESTONES[first_milestone])

        # Add plays to reach second milestone
        if len(sorted_milestones) > 1:
            second_milestone = sorted_milestones[1]
            additional_plays_needed = second_milestone - first_milestone

            more_plays = []
            for i in range(additional_plays_needed):
                play = create_play(
                    user_id=1,  # Changed from user_id=3 to user_id=1
                    track_id=1,
                    play_id=first_milestone + i + 1,
                    days_ago=(first_milestone + i) % 30,
                )
                more_plays.append(play)

            session.add_all(more_plays)
            session.flush()

            # Trigger update
            scope_and_process(
                lambda: bus.dispatch(
                    ChallengeEvent.track_played,
                    BLOCK_NUMBER,
                    datetime.now(),
                    1,  # user_id
                    {},
                )
            )

            # Check that a second challenge is created and completed
            challenges = (
                play_count_milestones_challenge_manager.get_user_challenge_state(
                    session
                )
            )
            # We expect only one challenge per user, with updated step count
            assert len(challenges) == 1
            assert challenges[0].user_id == 1
            assert challenges[0].challenge_id == "pc"
            assert challenges[0].is_complete == True
            # The amount stays at the first milestone value
            assert challenges[0].amount == int(PLAY_MILESTONES[first_milestone])


def test_multiple_users_play_count_milestones(app):
    """Test the play count milestones challenge with multiple users"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)

    # Register event with the bus
    bus.register_listener(
        ChallengeEvent.track_played, play_count_milestones_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)
        scope_and_process = make_scope_and_process(bus, session)

        sorted_milestones = sorted(PLAY_MILESTONES.keys())
        first_milestone = sorted_milestones[0]

        # Add plays for user 1
        plays_user1 = []
        for i in range(first_milestone):
            play = create_play(user_id=1, track_id=1, play_id=i + 1, days_ago=i % 30)
            plays_user1.append(play)

        session.add_all(plays_user1)
        session.flush()

        # Dispatch track_played event for user 1
        scope_and_process(
            lambda: bus.dispatch(
                ChallengeEvent.track_played,
                BLOCK_NUMBER,
                datetime.now(),
                1,  # user_id
                {},
            )
        )

        # Add plays for user 2
        plays_user2 = []
        for i in range(first_milestone):
            play = create_play(
                user_id=2, track_id=2, play_id=1000 + i + 1, days_ago=i % 30
            )
            plays_user2.append(play)

        session.add_all(plays_user2)
        session.flush()

        # Dispatch track_played event for user 2
        scope_and_process(
            lambda: bus.dispatch(
                ChallengeEvent.track_played,
                BLOCK_NUMBER,
                datetime.now(),
                2,  # user_id
                {},
            )
        )

        # Check that both users have challenges
        challenges = play_count_milestones_challenge_manager.get_user_challenge_state(
            session
        )
        assert len(challenges) == 2  # One for each user

        # Verify user 1's challenge
        user1_challenge = next(c for c in challenges if c.user_id == 1)
        assert user1_challenge.challenge_id == "pc"
        assert user1_challenge.is_complete == True
        assert user1_challenge.amount == int(PLAY_MILESTONES[first_milestone])

        # Verify user 2's challenge
        user2_challenge = next(c for c in challenges if c.user_id == 2)
        assert user2_challenge.challenge_id == "pc"
        assert user2_challenge.is_complete == True
        assert user2_challenge.amount == int(PLAY_MILESTONES[first_milestone])


def test_max_completed_milestone(app):
    """Test that the max completed milestone logic works correctly"""
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)

    # Register event with the bus
    bus.register_listener(
        ChallengeEvent.track_played, play_count_milestones_challenge_manager
    )

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        setup_challenges(session)
        scope_and_process = make_scope_and_process(bus, session)

        sorted_milestones = sorted(PLAY_MILESTONES.keys())

        # Create a single batch of plays to reach the first milestone
        first_milestone = sorted_milestones[0]
        plays = []

        for j in range(first_milestone):
            play = create_play(user_id=1, track_id=1, play_id=j + 1, days_ago=j % 30)
            plays.append(play)

        session.add_all(plays)
        session.flush()

        # Trigger update for first milestone
        scope_and_process(
            lambda: bus.dispatch(
                ChallengeEvent.track_played,
                BLOCK_NUMBER,
                datetime.now(),
                1,  # user_id
                {},
            )
        )

        # Check challenges after first milestone
        challenges = play_count_milestones_challenge_manager.get_user_challenge_state(
            session
        )
        assert len(challenges) == 1  # Only one challenge per user
        assert challenges[0].amount == int(PLAY_MILESTONES[sorted_milestones[0]])

        # Store the specifier of the first challenge to check it's the same one later
        first_challenge_specifier = challenges[0].specifier

        # Add more plays to reach the last milestone
        more_plays = []
        last_milestone = sorted_milestones[-1]

        # Add enough plays to reach the last milestone
        for i in range(
            first_milestone, last_milestone + 10
        ):  # Add extra plays beyond last milestone
            play = create_play(
                user_id=1,
                track_id=1,
                play_id=i + 1,
                days_ago=i % 30,
            )
            more_plays.append(play)

        session.add_all(more_plays)
        session.flush()

        # Trigger update
        scope_and_process(
            lambda: bus.dispatch(
                ChallengeEvent.track_played,
                BLOCK_NUMBER,
                datetime.now(),
                1,  # user_id
                {},
            )
        )

        # Get the most recent challenge
        challenges = play_count_milestones_challenge_manager.get_user_challenge_state(
            session
        )

        # Find the challenge with the original specifier
        original_challenges = [
            c for c in challenges if c.specifier == first_challenge_specifier
        ]
        assert len(original_challenges) == 1, "Original challenge should still exist"

        # The amount should still be the first milestone value
        assert original_challenges[0].amount == int(
            PLAY_MILESTONES[sorted_milestones[0]]
        )
