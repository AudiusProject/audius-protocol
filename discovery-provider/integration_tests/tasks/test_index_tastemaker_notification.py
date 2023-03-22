from datetime import datetime

from integration_tests.utils import populate_mock_db
from sqlalchemy import asc
from src.models.notifications.notification import Notification
from src.tasks.index_tastemaker_notifications import index_tastemaker_notifications
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]

BASE_TIME = datetime(2023, 1, 1, 0, 0)


def test_index_tastemaker_notification_no_tastemakers(app):
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
        }
        populate_mock_db(db, entities)

        index_tastemaker_notifications(
            db=db,
            top_trending_tracks=entities["tracks"],
            tastemaker_notification_threshold=2,
        )
        with db.scoped_session() as session:
            notifications = (
                session.query(Notification)
                .filter(Notification.type == "tastemaker")
                .order_by(asc(Notification.specifier))
                .all()
            )
            assert len(notifications) == 0


def test_index_tastemaker_notification_no_trending(app):
    with app.app_context():
        db = get_db()

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

        index_tastemaker_notifications(
            db=db,
            top_trending_tracks=[],
            tastemaker_notification_threshold=1,
        )
        with db.scoped_session() as session:
            notifications = (
                session.query(Notification)
                .filter(Notification.type == "tastemaker")
                .order_by(asc(Notification.specifier))
                .all()
            )
            assert len(notifications) == 0


def test_index_tastemaker_notification_sends_one_notif_for_both_fav_and_repost(app):
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "reposts": [{"user_id": 1, "repost_item_id": 1, "repost_type": "track"}],
            "saves": [
                {"user_id": 1, "save_item_id": 1, "save_type": "track"},
                {"user_id": 2, "save_item_id": 1, "save_type": "track"},
            ],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        index_tastemaker_notifications(
            db=db,
            top_trending_tracks=entities["tracks"],
            tastemaker_notification_threshold=2,
        )
        with db.scoped_session() as session:
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
                    "track_id": 1,
                    "track_owner_id": 3,
                    "action": "repost",
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
                    "track_id": 1,
                    "track_owner_id": 3,
                    "action": "save",
                    "tastemaker_user_id": 2,
                },
            )


def test_index_tastemaker_notification(app):
    with app.app_context():
        db = get_db()

        entities = {
            "tracks": [{"track_id": i, "owner_id": 3} for i in range(5)],
            "reposts": [
                {"user_id": i, "repost_item_id": 1, "repost_type": "track"}
                for i in range(20)
            ],
            "users": [{"user_id": i} for i in range(10)],
        }
        populate_mock_db(db, entities)

        index_tastemaker_notifications(
            db=db,
            top_trending_tracks=entities["tracks"],
            tastemaker_notification_threshold=4,
        )
        with db.scoped_session() as session:
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
                        "track_id": 1,
                        "track_owner_id": 3,
                        "action": "repost",
                        "tastemaker_user_id": i,
                    },
                )


def assert_notification(notification, user_ids, type, group_id, specifier, data):
    assert notification.user_ids == user_ids
    assert notification.type == type
    assert notification.group_id == group_id
    assert notification.specifier == specifier
    assert notification.data == data
