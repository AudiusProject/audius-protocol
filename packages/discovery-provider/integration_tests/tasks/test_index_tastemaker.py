import logging
from datetime import datetime

from sqlalchemy import asc

from integration_tests.utils import populate_mock_db
from src.challenges.challenge_event_bus import ChallengeEvent, ChallengeEventBus
from src.challenges.tastemaker_challenge import tastemaker_challenge_manager
from src.models.notifications.notification import Notification
from src.models.rewards.user_challenge import UserChallenge
from src.tasks.index_tastemaker import index_tastemaker
from src.utils.config import shared_config
from src.utils.db_session import get_db
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
BASE_TIME = datetime(2023, 1, 1, 0, 0)


def test_index_tastemaker_no_tastemakers(app):
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(ChallengeEvent.tastemaker, tastemaker_challenge_manager)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "users": [{"user_id": i} for i in range(4)],
        }
        populate_mock_db(db, entities)

        with bus.use_scoped_dispatch_queue():
            index_tastemaker(
                db=db,
                top_trending_tracks=entities["tracks"],
                challenge_event_bus=bus,
                tastemaker_notification_threshold=2,
            )
        bus.process_events(session, 10)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "tastemaker")
            .order_by(asc(Notification.specifier))
            .all()
        )
        assert len(notifications) == 0

        challenges = (
            session.query(UserChallenge).filter(UserChallenge.challenge_id == "t").all()
        )
        assert len(challenges) == 0


def test_index_tastemaker_no_trending(app):
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(ChallengeEvent.tastemaker, tastemaker_challenge_manager)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        entities = {
            "tracks": [{"track_id": 1, "owner_id": 3}],
            "reposts": [
                {
                    "user_id": 1,
                    "repost_item_id": 1,
                    "repost_type": "track",
                    "is_delete": False,
                }
            ],
            "saves": [
                {
                    "user_id": 1,
                    "save_item_id": 1,
                    "save_type": "track",
                    "is_delete": True,
                },
            ],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        with bus.use_scoped_dispatch_queue():
            index_tastemaker(
                db=db,
                top_trending_tracks=[],
                challenge_event_bus=bus,
                tastemaker_notification_threshold=1,
            )
        bus.process_events(session, 10)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "tastemaker")
            .order_by(asc(Notification.specifier))
            .all()
        )
        assert len(notifications) == 0

        challenges = (
            session.query(UserChallenge).filter(UserChallenge.challenge_id == "t").all()
        )
        assert len(challenges) == 0


def test_index_tastemaker_sends_one_notif_for_both_fav_and_repost(app):
    with app.app_context():
        db = get_db()

        redis_conn = get_redis()
        bus = ChallengeEventBus(redis_conn)
        bus.register_listener(ChallengeEvent.tastemaker, tastemaker_challenge_manager)

    with db.scoped_session() as session:
        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "reposts": [
                {
                    "user_id": 1,
                    "repost_item_id": 1,
                    "repost_type": "track",
                    "block_number": 1,
                }
            ],
            "saves": [
                {
                    "user_id": 1,
                    "save_item_id": 1,
                    "save_type": "track",
                    "block_number": 1,
                },
                {
                    "user_id": 2,
                    "save_item_id": 1,
                    "save_type": "track",
                    "block_number": 1,
                },
            ],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        with bus.use_scoped_dispatch_queue():
            index_tastemaker(
                db=db,
                top_trending_tracks=entities["tracks"],
                challenge_event_bus=bus,
                tastemaker_notification_threshold=2,
            )
        bus.process_events(session, 10)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "tastemaker")
            .order_by(asc(Notification.specifier))
            .all()
        )
        assert len(notifications) == 2
        assert_notification(
            notification=notifications[0],
            user_ids=[1],
            type="tastemaker",
            group_id=f"tastemaker_user_id:{1}:tastemaker_item_id:1",
            specifier="1",
            data={
                "tastemaker_item_id": 1,
                "tastemaker_item_owner_id": 3,
                "action": "repost",
                "tastemaker_item_type": "track",
                "tastemaker_user_id": 1,
            },
        )
        assert_notification(
            notification=notifications[1],
            user_ids=[2],
            type="tastemaker",
            group_id=f"tastemaker_user_id:{2}:tastemaker_item_id:1",
            specifier="1",
            data={
                "tastemaker_item_id": 1,
                "tastemaker_item_owner_id": 3,
                "tastemaker_item_type": "track",
                "action": "save",
                "tastemaker_user_id": 2,
            },
        )

        challenges = (
            session.query(UserChallenge).filter(UserChallenge.challenge_id == "t").all()
        )
        assert len(challenges) == 2
        assert challenges[0].user_id == 1
        assert challenges[0].challenge_id == "t"
        assert challenges[0].is_complete
        assert challenges[0].completed_at is not None

        assert challenges[1].user_id == 2
        assert challenges[1].challenge_id == "t"
        assert challenges[1].is_complete
        assert challenges[1].completed_at is not None


def test_index_tastemaker(app):
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(ChallengeEvent.tastemaker, tastemaker_challenge_manager)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "reposts": [
                {"user_id": i, "repost_item_id": 1, "repost_type": "track"}
                for i in range(20)
            ],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        with bus.use_scoped_dispatch_queue():
            index_tastemaker(
                db=db,
                top_trending_tracks=entities["tracks"],
                challenge_event_bus=bus,
                tastemaker_notification_threshold=4,
            )
        bus.process_events(session, 10)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "tastemaker")
            .order_by(asc(Notification.specifier))
            .all()
        )
        assert len(notifications) == 4
        for i in range(4):
            assert_notification(
                notification=notifications[i],
                user_ids=[i],
                type="tastemaker",
                group_id=f"tastemaker_user_id:{i}:tastemaker_item_id:1",
                specifier="1",
                data={
                    "tastemaker_item_id": 1,
                    "tastemaker_item_owner_id": 3,
                    "tastemaker_item_type": "track",
                    "action": "repost",
                    "tastemaker_user_id": i,
                },
            )

        challenges = (
            session.query(UserChallenge).filter(UserChallenge.challenge_id == "t").all()
        )
        assert len(challenges) == 4
        for i in range(4):
            assert challenges[i].user_id == i
            assert challenges[i].challenge_id == "t"
            assert challenges[i].is_complete
            assert challenges[i].completed_at is not None


def test_index_tastemaker_duplicate_insert(app):
    redis_conn = get_redis()
    bus = ChallengeEventBus(redis_conn)
    bus.register_listener(ChallengeEvent.tastemaker, tastemaker_challenge_manager)

    with app.app_context():
        db = get_db()

    with db.scoped_session() as session:
        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "reposts": [
                {"user_id": i, "repost_item_id": 1, "repost_type": "track"}
                for i in range(20)
            ],
            "notification": [
                # a tastemaker notification from last week
                # trending exists for the same user id and track pair
                # which should prevent that notification from being re-inserted
                {
                    "specifier": "1",
                    "type": "tastemaker",
                    "group_id": "tastemaker_user_id:3:tastemaker_item_id:1",
                    "timestamp": "2022-01-01",
                },
                # Just the group id will collide with an incoming tastemaker notif
                # which should not prevent that new notification from
                # being created
                {
                    "specifier": "2",
                    "type": "tastemaker",
                    "group_id": "tastemaker_user_id:2:tastemaker_item_id:1",
                    "timestamp": "2022-01-01",
                },
            ],
            "users": [{"user_id": i} for i in range(10)],
            "user_challenges": [
                {
                    "user_id": 3,
                    "challenge_id": "t",
                    "is_complete": True,
                    "specifier": "3:t:1",
                    "amount": 100,
                },
                {
                    "user_id": 2,
                    "challenge_id": "t",
                    "is_complete": True,
                    "specifier": "2:t:1",
                    "amount": 100,
                },
            ],
        }
        populate_mock_db(db, entities)

        with bus.use_scoped_dispatch_queue():
            index_tastemaker(
                db=db,
                challenge_event_bus=bus,
                top_trending_tracks=entities["tracks"],
                tastemaker_notification_threshold=4,
            )
        bus.process_events(session, 10)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "tastemaker")
            .order_by(asc(Notification.specifier))
            .all()
        )
        # original notification before we indexed is unchanged
        assert len(notifications) == 5
        assert_notification(
            notification=notifications[0],
            user_ids=[],
            type="tastemaker",
            group_id="tastemaker_user_id:3:tastemaker_item_id:1",
            specifier="1",
            data={},
        )
        assert notifications[0].timestamp == datetime(2022, 1, 1, 0, 0)
        # unique new notifications are still saved
        for i in range(3):
            assert_notification(
                notification=notifications[i + 1],
                user_ids=[i],
                type="tastemaker",
                group_id=f"tastemaker_user_id:{i}:tastemaker_item_id:1",
                specifier="1",
                data={
                    "tastemaker_item_id": 1,
                    "tastemaker_item_owner_id": 3,
                    "tastemaker_item_type": "track",
                    "action": "repost",
                    "tastemaker_user_id": i,
                },
            )

        challenges = (
            session.query(UserChallenge).filter(UserChallenge.challenge_id == "t").all()
        )
        assert len(challenges) == 4

        # 2 existing challenges for users 2 and 3, new challenges for users 0, 1
        assert challenges[2].user_id == 0
        assert challenges[2].specifier == "0:t:1"
        assert challenges[2].challenge_id == "t"
        assert challenges[2].is_complete
        assert challenges[2].completed_at is not None

        assert challenges[3].user_id == 1
        assert challenges[3].specifier == "1:t:1"
        assert challenges[3].challenge_id == "t"
        assert challenges[3].is_complete
        assert challenges[3].completed_at is not None


def assert_notification(notification, user_ids, type, group_id, specifier, data):
    assert notification.user_ids == user_ids
    assert notification.type == type
    assert notification.group_id == group_id
    assert notification.specifier == specifier
    assert notification.data == data
