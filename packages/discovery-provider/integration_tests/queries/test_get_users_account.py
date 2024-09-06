import pytest

from integration_tests.utils import populate_mock_db
from src import exceptions
from src.queries.get_users_account import GetAccountArgs, get_account
from src.utils.db_session import get_db

USER_1_WALLET = "0x0000000000000000000000000000000000000001"
USER_2_WALLET = "0x0000000000000000000000000000000000000002"
USER_3_WALLET = "0x0000000000000000000000000000000000000003"


def populate_db(db):
    test_entities = {
        "users": [
            {"user_id": 1, "wallet": USER_1_WALLET, "handle": "user_1"},
            {"user_id": 2, "wallet": USER_2_WALLET, "handle": "user_2"},
            {"user_id": 3, "wallet": USER_3_WALLET, "handle": "user_3"},
        ],
        "playlists": [
            {
                "playlist_id": 1,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 1",
            },
            {
                "playlist_id": 2,
                "playlist_owner_id": 1,
                "playlist_name": "album 1",
                "is_album": True,
            },
            {
                "playlist_id": 3,
                "playlist_owner_id": 1,
                "playlist_name": "playlist 1",
                "is_private": True,
            },
        ],
        "grants": [
            # Grant for user2 to manage user1
            {
                "user_id": 1,
                "grantee_address": USER_2_WALLET,
                "is_approved": True,
                "is_revoked": False,
            }
        ],
    }
    populate_mock_db(db, test_entities)


def test_get_account(app):
    """Test getting account with a valid wallet"""

    with app.app_context():
        db = get_db()

        populate_db(db)

        account = get_account(GetAccountArgs(wallet=USER_1_WALLET, authed_user_id=1))
        user = account["user"]
        playlists = account["playlists"]

        assert user["wallet"] == USER_1_WALLET
        assert user["user_id"] == 1
        assert len(playlists) == 3


def test_get_account_invalid_wallet_length(app):
    with app.app_context():
        db = get_db()

        populate_db(db)
        with pytest.raises(exceptions.ArgumentError):
            get_account(GetAccountArgs(wallet="0x123", authed_user_id=1))


def test_get_account_not_found(app):
    """Test attempting to fetch nonexistent user account"""

    with app.app_context():
        db = get_db()

        populate_db(db)
        account = get_account(
            GetAccountArgs(
                wallet="0x0000000000000000000000000000000000000009", authed_user_id=1
            )
        )
        assert account is None


def test_get_account_as_manager(app):
    """Test getting account as a different user with manager access"""

    with app.app_context():
        db = get_db()

        populate_db(db)

        account = get_account(GetAccountArgs(wallet=USER_1_WALLET, authed_user_id=2))
        user = account["user"]
        playlists = account["playlists"]

        assert user["wallet"] == USER_1_WALLET
        assert user["user_id"] == 1
        assert len(playlists) == 3


def test_get_account_forbidden(app):
    """Test getting account as a different user without manager access"""

    with app.app_context():
        db = get_db()

        populate_db(db)
        with pytest.raises(exceptions.PermissionError):
            get_account(GetAccountArgs(wallet=USER_1_WALLET, authed_user_id=3))
