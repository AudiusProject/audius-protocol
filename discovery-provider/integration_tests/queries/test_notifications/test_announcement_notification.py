import logging
from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import (
    get_notifications,
    get_unread_notification_count,
)
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_announcement_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(20)],
            "notification": [
                {
                    "type": "announcement",
                    "group_id": "fake_group_id",
                    "specifier": "1",
                    "data": {"title": "my title", "short_description": "my desc"},
                    "user_ids": [],
                },
                {
                    "type": "repost",
                    "group_id": "fake_group_id_repost",
                    "specifier": "3",
                    "data": {"title": "my title", "short_description": "my desc"},
                    "user_ids": [3],
                },
            ],
        }
        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            unread_count = get_unread_notification_count(session, {"user_id": 1})
            assert unread_count == 1
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 1
            assert u1_notifications[0]["type"] == "announcement"
            assert u1_notifications[0]["group_id"] == "fake_group_id"
            assert len(u1_notifications[0]["actions"]) == 1
            assert u1_notifications[0]["actions"][0]["data"] == {
                "title": "my title",
                "short_description": "my desc",
            }


def test_get_announcement_before_account_created(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(20)],
            "notification": [
                {
                    "type": "announcement",
                    "group_id": "fake_group_id",
                    "specifier": "1",
                    "data": {"title": "my title", "short_description": "my desc"},
                    "user_ids": [],
                    "timestamp": datetime.now() - timedelta(hours=1),
                },
            ],
        }
        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            unread_count = get_unread_notification_count(session, {"user_id": 1})
            assert unread_count == 0
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 0
