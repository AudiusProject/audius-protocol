import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.tasks.create_listen_streak_reminder_notifications import (
    LISTEN_STREAK_REMINDER,
    _create_listen_streak_reminder_notifications,
    get_listen_streak_notification_group_id,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)

TEST_USER_ID = 1
TEST_STREAK = 3
TEST_DATE = datetime.now().date()
TEST_GROUP_ID = get_listen_streak_notification_group_id(TEST_USER_ID, TEST_DATE)


def test_create_listen_streak_reminder_notification(app):
    """Test basic creation of listen streak notification"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    # Place listen time clearly within the window (between 1-2 minutes ago)
    listen_time = now - timedelta(minutes=1, seconds=30)

    entities = {
        "challenge_listen_streaks": [
            {
                "user_id": TEST_USER_ID,
                "listen_streak": TEST_STREAK,
                "last_listen_date": listen_time,
            }
        ]
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_listen_streak_reminder_notifications(session)
        all_notifications = session.query(Notification).all()

        assert len(all_notifications) == 1
        notification = all_notifications[0]
        assert notification.specifier == str(TEST_USER_ID)
        assert notification.group_id == TEST_GROUP_ID
        assert notification.data == {"streak": TEST_STREAK}
        assert notification.type == LISTEN_STREAK_REMINDER
        assert notification.user_ids == [TEST_USER_ID]


def test_ignore_outside_time_window(app):
    """Test that streaks outside the notification window are ignored"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    too_recent = now - timedelta(seconds=30)  # Too recent (< 1 min ago)
    too_old = now - timedelta(minutes=3)  # Too old (> 2 mins ago)

    entities = {
        "challenge_listen_streaks": [
            {
                "user_id": TEST_USER_ID,
                "listen_streak": TEST_STREAK,
                "last_listen_date": too_recent,
            },
            {
                "user_id": TEST_USER_ID + 1,
                "listen_streak": TEST_STREAK,
                "last_listen_date": too_old,
            },
        ]
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_listen_streak_reminder_notifications(session)
        all_notifications = session.query(Notification).all()
        assert len(all_notifications) == 0


def test_ignore_existing_notification(app):
    """Test that duplicate notifications are not created"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    listen_time = now - timedelta(minutes=1, seconds=30)

    entities = {
        "challenge_listen_streaks": [
            {
                "user_id": TEST_USER_ID,
                "listen_streak": TEST_STREAK,
                "last_listen_date": listen_time,
            }
        ],
        "notifications": [
            {
                "specifier": str(TEST_USER_ID),
                "group_id": TEST_GROUP_ID,
                "type": LISTEN_STREAK_REMINDER,
                "user_ids": [TEST_USER_ID],
                "data": {"streak": TEST_STREAK},
                "timestamp": listen_time,
            }
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_listen_streak_reminder_notifications(session)
        all_notifications = session.query(Notification).all()
        assert len(all_notifications) == 1  # Only the existing notification


def test_multiple_streaks(app):
    """Test handling multiple eligible listen streaks"""
    with app.app_context():
        db = get_db()

    now = datetime.now()
    listen_time = now - timedelta(minutes=1, seconds=30)

    entities = {
        "challenge_listen_streaks": [
            {
                "user_id": TEST_USER_ID,
                "listen_streak": TEST_STREAK,
                "last_listen_date": listen_time,
            },
            {
                "user_id": TEST_USER_ID + 1,
                "listen_streak": TEST_STREAK + 1,
                "last_listen_date": listen_time,
            },
        ]
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _create_listen_streak_reminder_notifications(session)
        all_notifications = session.query(Notification).all()

        assert len(all_notifications) == 2
        for notification in all_notifications:
            assert notification.type == LISTEN_STREAK_REMINDER
            user_id = int(notification.specifier)
            assert notification.user_ids == [user_id]
            expected_streak = (
                TEST_STREAK if user_id == TEST_USER_ID else TEST_STREAK + 1
            )
            assert notification.data == {"streak": expected_streak}
