import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.tasks.remix_contest_notifications.artist_remix_contest_ended import (
    create_artist_remix_contest_ended_notifications,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100


def test_artist_remix_contest_ended_notification(app):
    """Test that artist remix contest ended notification is created for the contest creator when the contest ends"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    end_date = now - timedelta(hours=1)

    entities = {
        "users": [
            {
                "user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "created_at": now,
                "updated_at": now,
            }
        ],
        "tracks": [
            {
                "track_id": TEST_TRACK_ID,
                "owner_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
                "updated_at": now,
            }
        ],
        "events": [
            {
                "event_id": 1,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
                "end_date": end_date,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_artist_remix_contest_ended_notifications(session, now=now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "artist_remix_contest_ended")
            .all()
        )
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.user_ids == [TEST_EVENT_CREATOR_ID]
        assert notification.data["entity_id"] == TEST_TRACK_ID


def test_artist_remix_contest_ended_notification_private_parent_track(app):
    """Test that no notification is created for the artist if the parent track is private (unlisted)"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    end_date = now - timedelta(hours=1)
    PRIVATE_TRACK_ID = 200
    PRIVATE_TRACK_OWNER_ID = 5

    entities = {
        "users": [
            {
                "user_id": PRIVATE_TRACK_OWNER_ID,
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
        "events": [
            {
                "event_id": 2,
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
        create_artist_remix_contest_ended_notifications(session, now=now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "artist_remix_contest_ended")
            .all()
        )
        # Should not notify the artist for private parent tracks
        assert len(notifications) == 0
