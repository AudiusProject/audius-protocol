from datetime import datetime
import redis
from src.models import User, Block, Repost, RepostType, Save, Follow, SaveType
from src.utils.db_session import get_db
from src.challenges.profile_challenge import profile_challenge_manager
from src.challenges.challenge_event_bus import ChallengeEventBus, ChallengeEvent
from src.utils.config import shared_config

REDIS_URL = shared_config["redis"]["url"]


def test_profile_completion_challenge(app):

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    # create user
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
        wallet="0x123",
        is_creator=False,
        is_verified=False,
        name="test_name",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with db.scoped_session() as session:
        bus = ChallengeEventBus(redis_conn)

        # Register events with the bus
        bus.register_listener(ChallengeEvent.profile_update, profile_challenge_manager)
        bus.register_listener(ChallengeEvent.repost, profile_challenge_manager)
        bus.register_listener(ChallengeEvent.follow, profile_challenge_manager)
        bus.register_listener(ChallengeEvent.favorite, profile_challenge_manager)

        session.add(block)
        session.flush()
        session.add(user)

        # Process dummy event just to get this thing initted
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]

        # We should have completed a single step (name)
        assert state.current_step_count == 1 and not state.is_complete

        # Do a repost
        repost = Repost(
            blockhash="0x1",
            blocknumber=1,
            user_id=1,
            repost_item_id=1,
            repost_type=RepostType.track,
            is_current=True,
            is_delete=False,
            created_at=datetime.now(),
        )
        session.add(repost)
        session.flush()
        bus.dispatch(session, ChallengeEvent.repost, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 2 and not state.is_complete

        # Do a save
        save = Save(
            blockhash="0x1",
            blocknumber=1,
            user_id=1,
            save_item_id=1,
            save_type=SaveType.track,
            is_current=True,
            is_delete=False,
            created_at=datetime.now(),
        )
        session.add(save)
        session.flush()
        bus.dispatch(session, ChallengeEvent.favorite, 1, 1)
        bus.process_events(session)
        session.flush()
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 3 and not state.is_complete

        # Do 1 follow, then 5 total follows
        follow = Follow(
            blockhash="0x1",
            blocknumber=1,
            is_current=True,
            is_delete=False,
            created_at=datetime.now(),
            follower_user_id=1,
            followee_user_id=2,
        )
        session.add(follow)
        session.flush()
        bus.dispatch(session, ChallengeEvent.follow, 1, 1)
        bus.process_events(session)
        session.flush()
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        # Assert 1 follow didn't do anything
        assert state.current_step_count == 3 and not state.is_complete
        follows = [
            Follow(
                blockhash="0x1",
                blocknumber=1,
                is_current=True,
                is_delete=False,
                created_at=datetime.now(),
                follower_user_id=1,
                followee_user_id=3,
            ),
            Follow(
                blockhash="0x1",
                blocknumber=1,
                is_current=True,
                is_delete=False,
                created_at=datetime.now(),
                follower_user_id=1,
                followee_user_id=4,
            ),
            Follow(
                blockhash="0x1",
                blocknumber=1,
                is_current=True,
                is_delete=False,
                created_at=datetime.now(),
                follower_user_id=1,
                followee_user_id=5,
            ),
            Follow(
                blockhash="0x1",
                blocknumber=1,
                is_current=True,
                is_delete=False,
                created_at=datetime.now(),
                follower_user_id=1,
                followee_user_id=6,
            ),
        ]
        session.add_all(follows)
        session.flush()
        bus.dispatch(session, ChallengeEvent.follow, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 4 and not state.is_complete

        # profile_picture
        session.query(User).filter(User.user_id == 1).update(
            {"profile_picture": "profilepictureurl"}
        )
        session.flush()
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 5 and not state.is_complete

        # profile description
        session.query(User).filter(User.user_id == 1).update(
            {"bio": "profiledescription"}
        )
        session.flush()
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 6 and not state.is_complete

        # Undo it, ensure that our count goes down
        session.query(User).filter(User.user_id == 1).update({"bio": None})
        session.flush()
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 5 and not state.is_complete

        # profile_cover_photo
        session.query(User).filter(User.user_id == 1).update(
            {"bio": "profiledescription", "cover_photo": "test_cover_photo"}
        )
        session.flush()
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 7 and state.is_complete == True

        # ensure that if we lose some data now that the thing is complete, we don't change the status of the challenge
        session.query(User).filter(User.user_id == 1).update({"cover_photo": None})
        session.flush()
        bus.dispatch(session, ChallengeEvent.profile_update, 1, 1)
        bus.process_events(session)
        state = profile_challenge_manager.get_challenge_state(session, [1])[1]
        assert state.current_step_count == 7 and state.is_complete == True
