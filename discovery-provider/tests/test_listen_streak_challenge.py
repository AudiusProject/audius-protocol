from datetime import datetime, timedelta
import redis
from sqlalchemy.orm.session import Session

from src.models import User, Block, Play
from src.utils.db_session import get_db
from src.challenges.listen_streak_challenge import listen_streak_challenge_manager
from src.challenges.challenge_event_bus import ChallengeEventBus, ChallengeEvent
from src.utils.config import shared_config

REDIS_URL = shared_config["redis"]["url"]


def create_play(offset: int) -> Play:
    return Play(
        id=offset,
        user_id=1,
        source=None,
        play_item_id=1,
        slot=1,
        signature=None,
        updated_at=datetime.now() + timedelta(days=offset),
        created_at=datetime.now() + timedelta(days=offset),
    )


def dispatch_play(offset: int, session: Session, bus: ChallengeEventBus):
    play = create_play(offset)
    session.add(play)
    session.flush()
    bus.dispatch(
        ChallengeEvent.track_listen,
        1,
        1,
        {"created_at": play.created_at.timestamp()},
    )
    bus.flush()
    bus.process_events(session)


def test_listen_streak_challenge(app):
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
            ChallengeEvent.track_listen, listen_streak_challenge_manager
        )

        session.add(block)
        session.flush()
        session.add(user)

        # Make sure plays increment the step count
        dispatch_play(0, session, bus)
        state = listen_streak_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.current_step_count == 1 and not state.is_complete

        dispatch_play(1, session, bus)
        state = listen_streak_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.current_step_count == 2 and not state.is_complete

        # Make sure the step count resets if the user missed a day
        dispatch_play(3, session, bus)
        state = listen_streak_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.current_step_count == 1 and not state.is_complete

        # Add more plays to increment the step count
        dispatch_play(4, session, bus)
        dispatch_play(5, session, bus)
        dispatch_play(6, session, bus)
        dispatch_play(7, session, bus)
        dispatch_play(8, session, bus)
        state = listen_streak_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.current_step_count == 6 and not state.is_complete

        # Make sure that is_complete is set when step count hits 7
        dispatch_play(9, session, bus)
        state = listen_streak_challenge_manager.get_user_challenge_state(
            session, ["1"]
        )[0]
        assert state.current_step_count == 7 and state.is_complete == True
