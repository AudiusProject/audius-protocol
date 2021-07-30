from datetime import date, timedelta
import redis
from src.models import User, Block, Track
from src.utils.db_session import get_db
from src.challenges.track_upload_challenge import track_upload_challenge_manager
from src.challenges.challenge_event_bus import ChallengeEventBus, ChallengeEvent
from src.utils.config import shared_config

REDIS_URL = shared_config["redis"]["url"]


def test_track_upload_challenge(app):

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    # create user
    with app.app_context():
        db = get_db()

    today = date.today()
    block1 = Block(blockhash="0x1", number=1)
    block2 = Block(blockhash="0x2", number=20000000)
    block3 = Block(blockhash="0x3", number=20000001)
    user = User(
        blockhash="0x1",
        blocknumber=1,
        txhash="xyz",
        user_id=1,
        handle="TestHandle",
        handle_lc="testhandle",
        is_current=True,
        created_at=today - timedelta(days=100),
        updated_at=today - timedelta(days=100),
    )
    track1 = Track(
        blockhash="0x1",
        blocknumber=1,
        txhash="xyz",
        owner_id=1,
        track_id=1,
        route_id=1,
        track_segments=[],
        is_unlisted=False,
        is_current=True,
        is_delete=False,
        created_at=today - timedelta(days=100),
        updated_at=today - timedelta(days=100),
    )
    track2 = Track(
        blockhash="0x2",
        blocknumber=20000000,
        txhash="yzx",
        owner_id=1,
        track_id=2,
        route_id=2,
        track_segments=[],
        is_unlisted=False,
        is_current=True,
        is_delete=False,
        created_at=today - timedelta(days=1),
        updated_at=today - timedelta(days=1),
    )
    track3 = Track(
        blockhash="0x3",
        blocknumber=20000001,
        txhash="zxy",
        owner_id=1,
        track_id=3,
        route_id=3,
        track_segments=[],
        is_unlisted=False,
        is_current=True,
        is_delete=False,
        created_at=today,
        updated_at=today,
    )
    track4 = Track(
        blockhash="0x3",
        blocknumber=20000001,
        txhash="abc",
        owner_id=1,
        track_id=4,
        route_id=4,
        track_segments=[],
        is_unlisted=False,
        is_current=True,
        is_delete=False,
        created_at=today,
        updated_at=today,
    )

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)

        # Register events with the bus
        bus.register_listener(
            ChallengeEvent.track_upload, track_upload_challenge_manager
        )

        session.add(block1)
        session.add(block2)
        session.add(block3)
        session.flush()
        session.add(user)
        session.add(track1)

        # Process dummy event at block number before this challenge is added
        bus.dispatch(session, ChallengeEvent.track_upload, 1, 1)
        bus.process_events(session)
        user_challenges = track_upload_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )

        # We should not have registered a count for this event
        assert not user_challenges

        # Process dummy event at block number when challenge is added
        session.add(track2)
        bus.dispatch(session, ChallengeEvent.track_upload, 20000000, 1)
        bus.process_events(session)
        user_challenge = track_upload_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]

        # We should have completed a single step (one track upload)
        assert user_challenge.current_step_count == 1
        assert not user_challenge.is_complete

        # Process two more dummy events to reach the step count (i.e. 3) for completion
        session.add(track3)
        bus.dispatch(session, ChallengeEvent.track_upload, 20000001, 1)
        session.add(track4)
        bus.dispatch(session, ChallengeEvent.track_upload, 20000001, 1)
        bus.process_events(session)
        user_challenge = track_upload_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]

        # We should have completed the challenge
        assert user_challenge.current_step_count == 3
        assert user_challenge.is_complete

        # ensure that if we lose some data now that the thing is complete, we don't change the status of the challenge
        session.query(Track).filter(Track.owner_id == user.user_id).update(
            {"is_delete": True}
        )
        session.flush()
        bus.dispatch(session, ChallengeEvent.track_upload, 3, 1)
        bus.process_events(session)
        user_challenge = track_upload_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]

        # The challenge should still be completed
        assert user_challenge.current_step_count == 3
        assert user_challenge.is_complete
