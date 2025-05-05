import logging
from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.queries.get_notifications import NotificationType
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100
TEST_FOLLOWER_ID = 2
TEST_FAVORITER_ID = 3


def test_remix_contest_started_notification_for_followers_and_favoriters(app):
    """Test that remix contest started notification is created for followers and users who favorited the track"""
    with app.app_context():
        db = get_db()

    now = datetime.now()

    # First: insert all entities except events
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
            }
        ],
        "follows": [
            {
                "follower_user_id": TEST_FOLLOWER_ID,
                "followee_user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            }
        ],
        "saves": [
            {
                "user_id": TEST_FAVORITER_ID,
                "save_item_id": TEST_TRACK_ID,
                "save_type": "track",
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            }
        ],
        # no "events"
    }
    populate_mock_db(db, entities)

    # Second: insert just the event
    event_entities = {
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            }
        ]
    }
    populate_mock_db(db, event_entities)

    with db.scoped_session() as session:
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.REMIX_CONTEST_STARTED)
            .all()
        )
        notified_user_ids = set()
        for notification in notifications:
            notified_user_ids.update(notification.user_ids)
            assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
            assert notification.data["entity_id"] == TEST_TRACK_ID
            assert notification.type == NotificationType.REMIX_CONTEST_STARTED
            assert notification.group_id.startswith("remix_contest_started:")
        # Should notify both the follower and the favoriter
        assert TEST_FOLLOWER_ID in notified_user_ids
        assert TEST_FAVORITER_ID in notified_user_ids
        assert len(notified_user_ids) == 2


def test_remix_contest_started_notification_no_duplicate_for_follower_and_favoriter(
    app,
):
    """Test that a user who both follows the creator and saved the track only gets one notification"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    BOTH_ID = 4

    # First: insert all entities except events
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
            }
        ],
        "follows": [
            {
                "follower_user_id": BOTH_ID,
                "followee_user_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            }
        ],
        "saves": [
            {
                "user_id": BOTH_ID,
                "save_item_id": TEST_TRACK_ID,
                "save_type": "track",
                "is_current": True,
                "is_delete": False,
                "created_at": now,
            }
        ],
        # no "events"
    }
    populate_mock_db(db, entities)

    # Second: insert just the event
    event_entities = {
        "events": [
            {
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "created_at": now,
                "updated_at": now,
            }
        ]
    }
    populate_mock_db(db, event_entities)

    with db.scoped_session() as session:
        notifications = (
            session.query(Notification)
            .filter(Notification.type == NotificationType.REMIX_CONTEST_STARTED)
            .all()
        )
        # There should be only one notification for BOTH_ID
        notif_count = 0
        for notification in notifications:
            if BOTH_ID in notification.user_ids:
                notif_count += 1
                assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
                assert notification.data["entity_id"] == TEST_TRACK_ID
                assert notification.type == NotificationType.REMIX_CONTEST_STARTED
                assert notification.specifier == str(TEST_EVENT_CREATOR_ID)
                assert notification.group_id.startswith("remix_contest_started:")
        assert notif_count == 1
