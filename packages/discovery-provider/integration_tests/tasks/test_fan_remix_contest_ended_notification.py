import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.queries.get_notifications import NotificationType
from src.tasks.remix_contest_notifications.fan_remix_contest_ended import (
    create_fan_remix_contest_ended_notifications,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100
TEST_REMIXER_ID_1 = 2
TEST_REMIXER_ID_2 = 3


def test_fan_remix_contest_ended_notification_for_remixers(app):
    """Test that remix contest ended notification is created for all remixers of the contest track"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    event_time = now - timedelta(hours=1)
    remix_time = now - timedelta(minutes=30)

    entities = {
        "users": [
            {
                "user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": TEST_REMIXER_ID_1,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": TEST_REMIXER_ID_2,
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
            # Remix 1 by REMIXER_ID_1
            {
                "track_id": 200,
                "owner_id": TEST_REMIXER_ID_1,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
            # Remix 2 by REMIXER_ID_2
            {
                "track_id": 201,
                "owner_id": TEST_REMIXER_ID_2,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "end_date": event_time,
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_ended_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.FAN_REMIX_CONTEST_ENDED)
            .all()
        )
        notified_user_ids = set()
        for notification in notifications:
            notified_user_ids.update(notification.user_ids)
            # entity_user_id should be the original artist
            assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
            assert notification.data["entity_id"] == TEST_TRACK_ID
            assert notification.type == NotificationType.FAN_REMIX_CONTEST_ENDED
            assert notification.group_id.startswith("fan_remix_contest_ended:")
        # Should notify both remixers
        assert TEST_REMIXER_ID_1 in notified_user_ids
        assert TEST_REMIXER_ID_2 in notified_user_ids
        assert len(notified_user_ids) == 2


def test_fan_remix_contest_ended_notification_no_duplicate_for_multiple_remixes(app):
    """Test that a user who submitted multiple remixes only gets one notification"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    event_time = now - timedelta(hours=1)
    remix_time = now - timedelta(minutes=30)
    REMIXER_ID = 4

    entities = {
        "users": [
            {
                "user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "user_id": REMIXER_ID,
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
            # Two remixes by the same user
            {
                "track_id": 300,
                "owner_id": REMIXER_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
            {
                "track_id": 301,
                "owner_id": REMIXER_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "end_date": event_time,
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_ended_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.FAN_REMIX_CONTEST_ENDED)
            .all()
        )
        notif_count = 0
        for notification in notifications:
            if REMIXER_ID in notification.user_ids:
                notif_count += 1
                assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
                assert notification.data["entity_id"] == TEST_TRACK_ID
                assert notification.type == NotificationType.FAN_REMIX_CONTEST_ENDED
                assert notification.group_id.startswith("fan_remix_contest_ended:")
        assert notif_count == 1
