import copy

from integration_tests.utils import populate_mock_db
from src.queries.get_managed_users import (
    get_managed_users_with_grants,
    get_user_managers_with_grants,
)
from src.utils.db_session import get_db

test_users = [
    {"user_id": 10, "name": "a", "wallet": "0x10"},
    {"user_id": 20, "name": "b", "wallet": "0x20"},
    {"user_id": 30, "name": "c", "wallet": "0x30"},
    {"user_id": 40, "name": "d", "wallet": "0x40"},
    {"user_id": 50, "name": "e", "wallet": "0x50"},
    {"user_id": 60, "name": "f", "wallet": "0x60"},
]

test_managed_user_grants = [
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
]

test_user_manager_grants = [
    # Active grants
    {
        "user_id": 10,
        "grantee_address": "0x20",
        "is_approved": True,
        "is_revoked": False,
    },
    {
        "user_id": 10,
        "grantee_address": "0x30",
        "is_approved": True,
        "is_revoked": False,
    },
    # Not yet approved
    {
        "user_id": 10,
        "grantee_address": "0x40",
        "is_approved": False,
        "is_revoked": False,
    },
    # Approved then Revoked
    {
        "user_id": 10,
        "grantee_address": "0x50",
        "is_approved": True,
        "is_revoked": True,
    },
    # Revoked before approval
    {
        "user_id": 10,
        "grantee_address": "0x60",
        "is_approved": False,
        "is_revoked": True,
    },
]

# ### get_managed_users ### #


def test_get_managed_users_default(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_managed_user_grants})

        managed_users = get_managed_users_with_grants({"user_id": 10})

        # return all non-revoked records by default
        assert len(managed_users) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["is_revoked"] == False for record in managed_users
        ), "Revoked records returned"


def test_get_managed_users_no_filters(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_managed_user_grants})

        managed_users = get_managed_users_with_grants(
            {
                "user_id": 10,
                "is_approved": None,
                "is_revoked": None,
            }
        )

        # return all records which map to users
        assert len(managed_users) == 5, "Expected exactly 5 records"


def test_get_managed_users_grants_without_users(app):
    with app.app_context():
        db = get_db()

        entities = {
            "users": copy.deepcopy(test_users),
            "grants": copy.deepcopy(test_managed_user_grants),
        }
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

        managed_users = get_managed_users_with_grants({"user_id": 10})

        # return all non-revoked records by default
        assert len(managed_users) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["user_id"] != 70 for record in managed_users
        ), "Revoked records returned"


def test_get_managed_users_invalid_parameters(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_managed_user_grants})

        try:
            get_managed_users_with_grants({"user_id": None})
            assert False, "Should have thrown an error for missing user_id"
        except ValueError as e:
            assert str(e) == "user_id is required"


# ### get_user_managers ### #


def test_get_user_managers_default(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_user_manager_grants})

        user_managers = get_user_managers_with_grants({"user_id": 10})

        # return all non-revoked records by default
        assert len(user_managers) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["is_revoked"] == False for record in user_managers
        ), "Revoked records returned"


def test_get_user_managers_no_filters(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_user_manager_grants})

        user_managers = get_user_managers_with_grants(
            {
                "user_id": 10,
                "is_approved": None,
                "is_revoked": None,
            }
        )

        # return all records which map to users
        assert len(user_managers) == 5, "Expected exactly 5 records"


def test_get_user_managers_grants_without_users(app):
    with app.app_context():
        db = get_db()

        entities = {
            "users": copy.deepcopy(test_users),
            "grants": copy.deepcopy(test_user_manager_grants),
        }
        # Record for a user which won't be found
        entities["grants"].append(
            {
                "user_id": 10,
                "grantee_address": "0x70",
                "is_approved": False,
                "is_revoked": False,
            }
        )
        populate_mock_db(db, entities)

        user_managers = get_user_managers_with_grants({"user_id": 10})

        # return all non-revoked records by default
        assert len(user_managers) == 3, "Expected exactly 3 records"
        assert (
            record["grant"]["grantee_address"] != "0x70" for record in user_managers
        ), "Revoked records returned"


def test_get_user_managers_invalid_parameters(app):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, {"users": test_users, "grants": test_user_manager_grants})

        try:
            get_user_managers_with_grants({})
            assert False, "Should have thrown an error for missing user id"
        except ValueError as e:
            assert str(e) == "user_id is required"
