import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_manager_mode_notifications(app):
    with app.app_context():
        db = get_db()

    entities = {
        "users": [
            {"user_id": user_id, "wallet": f"user{user_id}wallet"}
            for user_id in range(1, 6)
        ],
    }
    populate_mock_db(db, entities)
    now = datetime.now()
    entities = {
        "developer_apps": [
            {
                "user_id": 5,
                "name": "My App",
                "address": "0x3a388671bb4D6E1Ea08D79Ee191b40FB45A8F4C4",
            },
            {
                "user_id": 4,
                "name": "My App",
                "address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
            },
        ],
        "grants": [
            # Grant created from user to developer app. Should NOT trigger notif:
            {
                "user_id": 6,
                "grantee_address": "0x04c9fc3784120f50932436f84c59aebebb12e0d",
            },
            # Grant created from user to user:
            # This should trigger a notification to the requested manager:
            {
                "user_id": 2,
                "grantee_address": "user1wallet",
                "created_at": now,
                "updated_at": now,
            },
            # Manager approves request, should trigger a notification to the managed account
            {
                "user_id": 2,
                "grantee_address": "user1wallet",
                "is_approved": True,
                "created_at": now,
                "updated_at": now + timedelta(days=1),
            },
            # Manager relationship is removed - no notification
            {
                "user_id": 2,
                "grantee_address": "user1wallet",
                "is_approved": True,
                "created_at": now,
                "updated_at": now + timedelta(days=2),
                "is_revoked": True,
            },
            # Managed account re-requests the manager - should trigger a notification to the manager
            {
                "user_id": 2,
                "grantee_address": "user1wallet",
                "created_at": now + timedelta(days=3),
                "updated_at": now + timedelta(days=3),
                "is_revoked": False,
            },
            # Manager approves new request - should trigger a notification to the managed account
            {
                "user_id": 2,
                "grantee_address": "user1wallet",
                "is_approved": True,
                "created_at": now + timedelta(days=3),
                "updated_at": now + timedelta(days=4),
                "is_revoked": False,
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        manager_notification: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "request_manager")
            .all()
        )
        assert len(manager_notification) == 2
        managed_account_notification: List[Notification] = (
            session.query(Notification)
            .filter(Notification.type == "approve_manager_request")
            .all()
        )
        assert len(managed_account_notification) == 2
