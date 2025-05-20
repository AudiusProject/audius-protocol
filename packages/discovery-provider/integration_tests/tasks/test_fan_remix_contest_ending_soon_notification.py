import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.queries.get_notifications import NotificationType
from src.tasks.remix_contest_notifications.fan_remix_contest_ending_soon import (
    create_fan_remix_contest_ending_soon_notifications,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100
TEST_FOLLOWER_ID = 2
TEST_FAVORITER_ID = 3


def test_fan_remix_contest_ending_soon_notification_for_followers_and_favoriters(app):
    """Test that remix contest ending soon notification is created for followers and users who favorited the track"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    end_date = now + timedelta(hours=48)

    entities = {
        "users": [
            {
                "user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": TEST_FOLLOWER_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": TEST_FAVORITER_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "tracks": [
            {
                "track_id": TEST_TRACK_ID,
                "owner_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "follows": [
            {
                "follower_user_id": TEST_FOLLOWER_ID,
                "followee_user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            },
        ],
        "saves": [
            {
                "user_id": TEST_FAVORITER_ID,
                "save_item_id": TEST_TRACK_ID,
                "save_type": "track",
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            },
        ],
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
                "end_date": end_date,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_ending_soon_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.FAN_REMIX_CONTEST_ENDING_SOON)
            .all()
        )
        notified_user_ids = set()
        for notification in notifications:
            notified_user_ids.update(notification.user_ids)
            assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
            assert notification.data["entity_id"] == TEST_TRACK_ID
            assert notification.type == NotificationType.FAN_REMIX_CONTEST_ENDING_SOON
            assert notification.group_id.startswith("fan_remix_contest_ending_soon:")
        # Should notify both the follower and the favoriter
        assert TEST_FOLLOWER_ID in notified_user_ids
        assert TEST_FAVORITER_ID in notified_user_ids
        assert len(notified_user_ids) == 2


def test_fan_remix_contest_ending_soon_notification_no_duplicate_for_follower_and_favoriter(
    app,
):
    """Test that a user who both follows the creator and saved the track only gets one notification"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    BOTH_ID = 4
    end_date = now + timedelta(hours=48)

    entities = {
        "users": [
            {
                "user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": BOTH_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "tracks": [
            {
                "track_id": TEST_TRACK_ID,
                "owner_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "follows": [
            {
                "follower_user_id": BOTH_ID,
                "followee_user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            },
        ],
        "saves": [
            {
                "user_id": BOTH_ID,
                "save_item_id": TEST_TRACK_ID,
                "save_type": "track",
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            },
        ],
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
                "end_date": end_date,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_ending_soon_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.FAN_REMIX_CONTEST_ENDING_SOON)
            .all()
        )
        notif_count = 0
        for notification in notifications:
            if BOTH_ID in notification.user_ids:
                notif_count += 1
                assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
                assert notification.data["entity_id"] == TEST_TRACK_ID
                assert (
                    notification.type == NotificationType.FAN_REMIX_CONTEST_ENDING_SOON
                )
                assert notification.group_id.startswith(
                    "fan_remix_contest_ending_soon:"
                )
        assert notif_count == 1


def test_fan_remix_contest_ending_soon_notification_private_track(app):
    """Test that no notification is created for a remix contest on a private (unlisted) track"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    end_date = now + timedelta(hours=48)
    PRIVATE_TRACK_ID = 200
    PRIVATE_TRACK_OWNER_ID = 5
    PRIVATE_TRACK_FOLLOWER_ID = 6

    entities = {
        "users": [
            {
                "user_id": PRIVATE_TRACK_OWNER_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": PRIVATE_TRACK_FOLLOWER_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
        ],
        "tracks": [
            {
                "track_id": PRIVATE_TRACK_ID,
                "owner_id": PRIVATE_TRACK_OWNER_ID,
                "is_current": True,
                "is_delete": False,
                "is_unlisted": True,  # Mark as private
                "created_at": now,
                "updated_at": now,
            },
        ],
        "follows": [
            {
                "follower_user_id": PRIVATE_TRACK_FOLLOWER_ID,
                "followee_user_id": PRIVATE_TRACK_OWNER_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            },
        ],
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": PRIVATE_TRACK_OWNER_ID,
                "entity_id": PRIVATE_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
                "end_date": end_date,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_ending_soon_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.FAN_REMIX_CONTEST_ENDING_SOON)
            .all()
        )
        # Should not notify anyone for private tracks
        assert len(notifications) == 0
