import datetime
import logging
from typing import List
from unittest import TestCase

import pytest

from src.models.notifications.notification import Notification
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


@pytest.fixture
def entities():
    return {
        "users": [
            {"user_id": 1},
            {"user_id": 2},
            {"user_id": 3},
            {"user_id": 4},
            {"user_id": 5},
        ],
        "tracks": [{"track_id": 100, "owner_id": 2}, {"track_id": 101, "owner_id": 5}],
        "playlists": [{"playlist_id": 100, "owner_id": 2}],
        "follows": [
            {"followee_user_id": 1, "follower_user_id": 3},
            {"followee_user_id": 4, "follower_user_id": 3},
            {"followee_user_id": 3, "follower_user_id": 4},
        ],
    }


def notification_data(user_id, save_of_repost_item_id):
    return {
        "type": "track",
        "user_id": user_id,
        "save_of_repost_item_id": save_of_repost_item_id,
    }


def assert_notification(
    notification, specifier, group_id, type, slot, blocknumber, data, user_ids
):
    assert notification.specifier == specifier
    assert notification.group_id == group_id
    assert notification.type == type
    assert notification.slot == slot
    assert notification.blocknumber == blocknumber
    assert notification.data == data
    TestCase().assertCountEqual(notification.user_ids, user_ids)


# ========================================== Start Tests ==========================================
def test_save_repost_notification(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 4,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
            },
            {
                "user_id": 4,
                "repost_item_id": 100,
                "repost_type": RepostType.playlist,
            },
        ],
    }

    save_entities = {
        "saves": [
            {
                "user_id": 3,
                "save_item_id": 100,
                "save_type": SaveType.track,
                "is_save_of_repost": True,
            },
            {
                "user_id": 1,
                "save_item_id": 100,
                "save_type": SaveType.track,
                "is_save_of_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)
    populate_mock_db(db, save_entities)

    with db.scoped_session() as session:
        save_repost_notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "save_of_repost")
            .all()
        )
        assert len(save_repost_notifications) == 1
        # Check repost of a repost notifications
        assert_notification(
            notification=save_repost_notifications[0],
            specifier="3",
            group_id="save_of_repost:100:type:track",
            type="save_of_repost",
            slot=None,
            blocknumber=7,
            data=notification_data(user_id=3, save_of_repost_item_id=100),
            # user 3 follows user 4, who has reposted this track
            # so notify user 4
            user_ids=[4],
        )


def test_save_repost_notification_multiple_followees_repost(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 1,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
            },
            {
                "user_id": 4,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
            },
        ],
    }
    save_entities = {
        "saves": [
            {
                "user_id": 3,
                "save_item_id": 100,
                "save_type": SaveType.track,
                "is_save_of_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)
    populate_mock_db(db, save_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "save_of_repost")
            .all()
        )
        assert len(notifications) == 1
        assert_notification(
            notification=notifications[0],
            specifier="3",
            group_id="save_of_repost:100:type:track",
            type="save_of_repost",
            slot=None,
            blocknumber=7,
            data=notification_data(user_id=3, save_of_repost_item_id=100),
            # User 1 follows both 3 and 4, who have both reposted the track
            # notify users 3, 4
            user_ids=[1, 4],
        )


def test_save_repost_notification_within_month(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 1,
                "created_at": datetime.date.today() - datetime.timedelta(days=31),
                "repost_item_id": 100,
                "repost_type": RepostType.track,
            },
        ],
        "saves": [
            {
                "user_id": 3,
                "save_item_id": 100,
                "save_type": SaveType.track,
                "is_save_of_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "save_of_repost")
            .all()
        )
        # User 3 reposted user 1's repost over a month later
        # User 1 should not be notified
        assert len(notifications) == 0


def test_save_repost_notification_non_current_repost(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 1,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_current": False,
                "is_delete": False,
            },
        ]
    }
    save_entities = {
        "saves": [
            {
                "user_id": 3,
                "save_item_id": 100,
                "save_type": SaveType.track,
                "is_save_of_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)
    populate_mock_db(db, save_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "save_of_repost")
            .all()
        )
        assert len(notifications) == 0
