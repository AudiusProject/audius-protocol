import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.tasks.remix_contest_notifications.fan_remix_contest_winners_selected import (
    create_fan_remix_contest_winners_selected_notification,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_EVENT_CREATOR_ID = 1
TEST_TRACK_ID = 100
TEST_REMIXER_ID_1 = 2
TEST_REMIXER_ID_2 = 3
TEST_REMIXER_ID_3 = 4


def test_fan_remix_contest_winners_selected_notification_for_remixers(app):
    """Test that winners selected notification is created for all remixers of the contest track"""
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
                "event_id": 1,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [200, 201]},  # Winners selected
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_winners_selected_notification(session, 1, now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )

        assert len(notifications) == 2  # One notification per remixer

        # Extract user IDs from all notifications
        notified_user_ids = set()
        for notification in notifications:
            assert (
                len(notification.user_ids) == 1
            )  # Each notification should have exactly one user
            notified_user_ids.add(notification.user_ids[0])
            assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
            assert notification.data["entity_id"] == TEST_TRACK_ID
            assert notification.type == "fan_remix_contest_winners_selected"
            assert notification.group_id.startswith(
                "fan_remix_contest_winners_selected:"
            )

        # Should notify both remixers but not the contest host
        assert notified_user_ids == {TEST_REMIXER_ID_1, TEST_REMIXER_ID_2}


def test_fan_remix_contest_winners_selected_no_duplicate_for_multiple_remixes(app):
    """Test that a user who submitted multiple remixes only gets one notification"""
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
                "user_id": TEST_REMIXER_ID_3,
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
                "owner_id": TEST_REMIXER_ID_3,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
            {
                "track_id": 301,
                "owner_id": TEST_REMIXER_ID_3,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_id": 2,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [300]},  # One winner selected
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_winners_selected_notification(session, 2, now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )

        assert len(notifications) == 1  # One notification for the single remixer
        notification = notifications[0]

        # Should only notify the remixer once, even though they have multiple remixes
        assert (
            len(notification.user_ids) == 1
        )  # Each notification should have exactly one user
        assert notification.user_ids[0] == TEST_REMIXER_ID_3
        assert notification.data["entity_user_id"] == TEST_EVENT_CREATOR_ID
        assert notification.data["entity_id"] == TEST_TRACK_ID


def test_fan_remix_contest_winners_selected_no_notification_for_private_track(app):
    """Test that no notification is created if the contest track is private (unlisted)"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    event_time = now - timedelta(hours=1)
    remix_time = now - timedelta(minutes=30)
    PRIVATE_TRACK_ID = 400
    PRIVATE_TRACK_OWNER_ID = 10
    REMIXER_ID = 11

    entities = {
        "users": [
            {
                "user_id": PRIVATE_TRACK_OWNER_ID,
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
                "track_id": PRIVATE_TRACK_ID,
                "owner_id": PRIVATE_TRACK_OWNER_ID,
                "is_current": True,
                "is_delete": False,
                "is_unlisted": True,  # Mark as private
                "created_at": now,
                "updated_at": now,
            },
            # Remix by REMIXER_ID
            {
                "track_id": 401,
                "owner_id": REMIXER_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": PRIVATE_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_id": 3,
                "event_type": "remix_contest",
                "user_id": PRIVATE_TRACK_OWNER_ID,
                "entity_id": PRIVATE_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [401]},  # Winner selected
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_winners_selected_notification(session, 3, now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )
        # Should not notify any remixers for private parent tracks
        assert len(notifications) == 0


def test_fan_remix_contest_winners_selected_no_duplicate_notification(app):
    """Test that duplicate notifications are not created for the same event"""
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
            {
                "track_id": 500,
                "owner_id": TEST_REMIXER_ID_1,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_id": 4,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [500]},  # Winner selected
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        # Call the function twice
        create_fan_remix_contest_winners_selected_notification(session, 4, now)
        create_fan_remix_contest_winners_selected_notification(session, 4, now)

        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )
        # Should only create one notification despite being called twice
        assert len(notifications) == 1
        notification = notifications[0]
        assert (
            len(notification.user_ids) == 1
        )  # Each notification should have exactly one user
        assert notification.user_ids[0] == TEST_REMIXER_ID_1


def test_fan_remix_contest_winners_selected_excludes_contest_host(app):
    """Test that the contest host is not notified even if they submitted a remix"""
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
            # Regular remixer
            {
                "track_id": 600,
                "owner_id": TEST_REMIXER_ID_1,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
            # Contest host also submitted a remix (shouldn't be notified)
            {
                "track_id": 601,
                "owner_id": TEST_EVENT_CREATOR_ID,
                "is_current": True,
                "is_delete": False,
                "created_at": remix_time,
                "updated_at": remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_id": 5,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [600, 601]},  # Both remixes win
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_winners_selected_notification(session, 5, now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )

        assert (
            len(notifications) == 1
        )  # One notification for the single non-host remixer
        notification = notifications[0]

        # Should only notify the regular remixer, not the contest host
        assert (
            len(notification.user_ids) == 1
        )  # Each notification should have exactly one user
        assert notification.user_ids[0] == TEST_REMIXER_ID_1
        assert TEST_EVENT_CREATOR_ID not in notification.user_ids


def test_fan_remix_contest_winners_selected_only_notifies_post_contest_remixes(app):
    """Test that only remixes created after the contest are included in notifications"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    event_time = now - timedelta(hours=1)
    pre_contest_remix_time = now - timedelta(hours=2)  # Before contest
    post_contest_remix_time = now - timedelta(minutes=30)  # After contest

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
            # Remix created BEFORE the contest (should not be notified)
            {
                "track_id": 700,
                "owner_id": TEST_REMIXER_ID_1,
                "is_current": True,
                "is_delete": False,
                "created_at": pre_contest_remix_time,
                "updated_at": pre_contest_remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
            # Remix created AFTER the contest (should be notified)
            {
                "track_id": 701,
                "owner_id": TEST_REMIXER_ID_2,
                "is_current": True,
                "is_delete": False,
                "created_at": post_contest_remix_time,
                "updated_at": post_contest_remix_time,
                "remix_of": {"tracks": [{"parent_track_id": TEST_TRACK_ID}]},
            },
        ],
        "events": [
            {
                "event_id": 6,
                "event_type": "remix_contest",
                "user_id": TEST_EVENT_CREATOR_ID,
                "entity_id": TEST_TRACK_ID,
                "entity_type": "track",
                "is_deleted": False,
                "event_data": {"winners": [700, 701]},  # Both remixes win
                "created_at": event_time,
                "updated_at": event_time,
            }
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        create_fan_remix_contest_winners_selected_notification(session, 6, now)
        notifications = (
            session.query(Notification)
            .filter(Notification.type == "fan_remix_contest_winners_selected")
            .all()
        )

        # Should only notify REMIXER_ID_2 whose remix was created after the contest
        assert len(notifications) == 1
        notification = notifications[0]
        assert len(notification.user_ids) == 1
        assert notification.user_ids[0] == TEST_REMIXER_ID_2
        # REMIXER_ID_1 should not be notified since their remix was created before the contest
        assert TEST_REMIXER_ID_1 not in [n.user_ids[0] for n in notifications]
