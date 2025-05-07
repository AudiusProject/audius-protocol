import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.queries.get_notifications import NotificationType
from src.tasks.remix_contest_notifications.artist_remix_contest_ending_soon import (
    create_artist_remix_contest_ending_soon_notifications,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100
TEST_FOLLOWER_ID = 2
TEST_FAVORITER_ID = 3


def test_artist_remix_contest_ending_soon_notification_for_artist(app):
    """Test that artist remix contest ending soon notification is created for the event creator only"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    end_date = now + timedelta(hours=24)

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
        create_artist_remix_contest_ending_soon_notifications(session)
        notifications = (
            session.query(Notification)
            .filter(
                Notification.type == NotificationType.ARTIST_REMIX_CONTEST_ENDING_SOON
            )
            .all()
        )
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.user_ids == [TEST_EVENT_CREATOR_ID]
        assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
        assert notification.data["entity_id"] == TEST_TRACK_ID
        assert notification.type == NotificationType.ARTIST_REMIX_CONTEST_ENDING_SOON
        assert notification.group_id.startswith("artist_remix_contest_ending_soon:")
