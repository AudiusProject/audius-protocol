from datetime import datetime

from integration_tests.utils import populate_mock_db
from src.utils.db_session import get_db

test_entities = {
    "users": [
        {"user_id": 10, "name": "a", "wallet": "0x10"},
        {"user_id": 20, "name": "b", "wallet": "0x20"},
        {"user_id": 30, "name": "c", "wallet": "0x30"},
    ],
    "grants": [
        {
            "user_id": 10,
            "grantee_address": "0x30",
            "is_approved": True,
            "is_revoked": False,
        },
        {
            "user_id": 20,
            "grantee_address": "0x30",
            "is_approved": True,
            "is_revoked": False,
        },
    ],
}


def test_get_managed_users(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        # TODO: Implement test
