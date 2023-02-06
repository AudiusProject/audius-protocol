import logging
from typing import List

import pytest
from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.models.social.repost import RepostType
from src.utils.db_session import get_db

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
        "follows": [
            {"followee_user_id": 1, "follower_user_id": 3},
            {"followee_user_id": 4, "follower_user_id": 3},
        ],
    }


def notification_data(user_id, repost_item_id):
    return {"type": "track", "user_id": user_id, "repost_item_id": repost_item_id}


def assert_notification(
    notification, specifier, group_id, type, slot, blocknumber, data, user_ids
):
    assert notification.specifier == specifier
    assert notification.group_id == group_id
    assert notification.type == type
    assert notification.slot == slot
    assert notification.blocknumber == blocknumber
    assert notification.data == data
    assert notification.user_ids == user_ids


# ========================================== Start Tests ==========================================
def test_repost_repost_notification(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 4,
                "repost_item_id": 101,
                "repost_type": RepostType.track,
                "is_repost_repost": False,
            },
            {
                "user_id": 1,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": False,
            },
            {
                "user_id": 3,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": True,
            },
            {
                "user_id": 4,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "repost").all()
        )
        for notification in notifications:
            print("notifications is: ", notification)
        assert len(notifications) == 4
        assert_notification(
            notification=notifications[0],
            specifier="4",
            group_id="repost:101:type:track",
            type="repost",
            slot=None,
            blocknumber=5,
            data=notification_data(user_id=4, repost_item_id=101),
            user_ids=[5],
        )
        assert_notification(
            notification=notifications[1],
            specifier="1",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=6,
            data=notification_data(user_id=1, repost_item_id=100),
            user_ids=[2],
        )
        assert_notification(
            notification=notifications[2],
            specifier="3",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=7,
            data=notification_data(user_id=3, repost_item_id=100),
            # user 3 follows user 1, who has reposted this track
            # so notify user 1 and content owner user 2
            user_ids=[1, 2],
        )
        assert_notification(
            notification=notifications[3],
            specifier="4",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=8,
            data=notification_data(user_id=4, repost_item_id=100),
            # 4 does not follow anyone who's reposted this track.
            # so only notify the content owner
            user_ids=[2],
        )


def test_repost_repost_notification_multiple_followees_repost(app, entities):
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
                "is_repost_repost": False,
            },
            {
                "user_id": 4,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": True,
            },
            {
                "user_id": 3,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "repost").all()
        )
        assert len(notifications) == 3
        assert_notification(
            notification=notifications[0],
            specifier="1",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=5,
            data=notification_data(user_id=1, repost_item_id=100),
            user_ids=[2],
        )
        assert_notification(
            notification=notifications[1],
            specifier="4",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=6,
            data=notification_data(user_id=4, repost_item_id=100),
            # user 3 follows user 1, who has reposted this track
            # so notify user 1 and content owner user 2
            user_ids=[2],
        )
        assert_notification(
            notification=notifications[2],
            specifier="3",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=7,
            data=notification_data(user_id=3, repost_item_id=100),
            # User 1 follows both 3 and 4, who have both reposted the track
            # notify users 3, 4, and user 2 who is the content owner
            user_ids=[1, 4, 2],
        )


def test_repost_repost_notification_within_month(app, entities):
    """Tests that a repost notification is created on repost  correctly"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, entities)
    repost_entities = {
        "reposts": [
            {
                "user_id": 1,
                "created_at": "2020-01-01",
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": False,
            },
            {
                "user_id": 3,
                "repost_item_id": 100,
                "repost_type": RepostType.track,
                "is_repost_repost": True,
            },
        ],
    }
    populate_mock_db(db, repost_entities)

    with db.scoped_session() as session:
        notifications: List[Notification] = (
            session.query(Notification).filter(Notification.type == "repost").all()
        )
        # User 1 reposted content 2020-01-01, notify content owner
        assert len(notifications) == 2
        assert_notification(
            notification=notifications[0],
            specifier="1",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=5,
            data=notification_data(user_id=1, repost_item_id=100),
            user_ids=[2],
        )
        # User 3 reposted user 1's repost over a month later
        # User 1 should not be notified, only content owner
        # should be notified
        assert_notification(
            notification=notifications[1],
            specifier="3",
            group_id="repost:100:type:track",
            type="repost",
            slot=None,
            blocknumber=6,
            data=notification_data(user_id=3, repost_item_id=100),
            user_ids=[2],
        )
