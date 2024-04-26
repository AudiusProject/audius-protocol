import copy

from integration_tests.utils import populate_mock_db
from src.queries.get_managed_users import get_managed_users_with_grants
from src.utils.db_session import get_db

test_entities = {
    "users": [
        {"user_id": 10, "name": "a", "wallet": "0x10"},
        {"user_id": 20, "name": "b", "wallet": "0x20"},
        {"user_id": 30, "name": "c", "wallet": "0x30"},
        {"user_id": 40, "name": "d", "wallet": "0x40"},
        {"user_id": 50, "name": "e", "wallet": "0x50"},
        {"user_id": 60, "name": "f", "wallet": "0x60"},
    ],
    "grants": [
        # Active grants
        {
            "user_id": 20,
            "grantee_address": "0x10",
            "is_approved": True,
            "is_revoked": False,
        },
        {
            "user_id": 30,
            "grantee_address": "0x10",
            "is_approved": True,
            "is_revoked": False,
        },
        # Not yet approved
        {
            "user_id": 40,
            "grantee_address": "0x10",
            "is_approved": False,
            "is_revoked": False,
        },
        # Approved then Revoked
        {
            "user_id": 50,
            "grantee_address": "0x10",
            "is_approved": True,
            "is_revoked": True,
        },
        # Revoked before approval
        {
            "user_id": 60,
            "grantee_address": "0x10",
            "is_approved": False,
            "is_revoked": True,
        },
    ],
}


def test_get_managed_users_default(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        managed_users = get_managed_users_with_grants(
            {"manager_wallet_address": "0x10", "current_user_id": 10}
        )

        # return all non-revoked records by default
        assert len(managed_users) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["is_revoked"] == False for record in managed_users
        ), "Revoked records returned"


def test_get_managed_users_grants_without_users(app):
    with app.app_context():
        db = get_db()

        entities = copy.deepcopy(test_entities)
        # Record for a user which won't be found
        entities["grants"].append(
            {
                "user_id": 70,
                "grantee_address": "0x10",
                "is_approved": False,
                "is_revoked": False,
            }
        )
        populate_mock_db(db, entities)

        managed_users = get_managed_users_with_grants(
            {"manager_wallet_address": "0x10", "current_user_id": 10}
        )

        # return all non-revoked records by default
        assert len(managed_users) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["user_id"] != 70 for record in managed_users
        ), "Revoked records returned"


def test_get_managed_users_invalid_parameters(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)

        try:
            get_managed_users_with_grants(
                {"manager_wallet_address": None, "current_user_id": 10}
            )
            assert False, "Should have thrown an error for missing wallet address"
        except ValueError as e:
            assert str(e) == "manager_wallet_address is required"

        try:
            get_managed_users_with_grants(
                {"manager_wallet_address": "0x10", "current_user_id": None}
            )
            assert False, "Should have thrown an error for missing current user id"
        except ValueError as e:
            assert str(e) == "current_user_id is required"
