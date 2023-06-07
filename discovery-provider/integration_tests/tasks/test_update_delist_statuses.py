from datetime import datetime, timedelta
from typing import List
from unittest import mock

from integration_tests.utils import populate_mock_db
from sqlalchemy import asc
from src.models.users.delist_status_cursor import DelistEntity, DelistStatusCursor
from src.models.users.user import User
from src.models.users.user_delist_status import DelistUserReason, UserDelistStatus
from src.tasks.update_delist_statuses import process_delist_statuses
from src.utils.db_session import get_db


def _seed_db(db):
    test_entities = {
        "users": [
            {
                "user_id": 100,
                "is_current": True,
            },
            {
                "user_id": 200,
                "is_current": True,
            },
        ]
    }
    populate_mock_db(db, test_entities)


def _mock_response(json_data, raise_for_status=None):
    """Mock out request.get response"""
    mock_resp = mock.Mock()

    mock_resp.json = mock.Mock(return_value=json_data)

    mock_resp.raise_for_status = mock.Mock()
    if raise_for_status:
        mock_resp.raise_for_status.side_effect = raise_for_status

    return mock_resp


@mock.patch("src.utils.auth_helpers.requests")
def test_update_delist_statuses(mock_requests, app):
    with app.app_context():
        db = get_db()
    _seed_db(db)

    mock_return = {
        "result": {
            "users": [
                {
                    "createdAt": datetime.now(),
                    "userId": 100,
                    "delisted": True,
                    "reason": "STRIKE_THRESHOLD",
                },
                {
                    "createdAt": datetime.now() + timedelta(hours=1),
                    "userId": 100,
                    "delisted": False,
                    "reason": "COPYRIGHT_SCHOOL",
                },
                {
                    "createdAt": datetime.now() + timedelta(hours=2),
                    "userId": 200,
                    "delisted": True,
                    "reason": "MANUAL",
                },
            ]
        }
    }
    mock_requests.get.return_value = _mock_response(mock_return)

    with db.scoped_session() as session:
        trusted_notifier_manager = {
            "endpoint": "http://mock-trusted-notifier.audius.co",
            "wallet": "0x0",
        }
        process_delist_statuses(session, trusted_notifier_manager)
        # check user_delist_statuses
        all_delist_statuses: List[UserDelistStatus] = (
            session.query(UserDelistStatus)
            .order_by(asc(UserDelistStatus.created_at))
            .all()
        )
        assert len(all_delist_statuses) == 3
        assert all_delist_statuses[0].user_id == 100
        assert all_delist_statuses[0].delisted
        assert all_delist_statuses[0].reason == DelistUserReason.STRIKE_THRESHOLD
        assert all_delist_statuses[1].user_id == 100
        assert not all_delist_statuses[1].delisted
        assert all_delist_statuses[1].reason == DelistUserReason.COPYRIGHT_SCHOOL
        assert all_delist_statuses[2].user_id == 200
        assert all_delist_statuses[2].delisted
        assert all_delist_statuses[2].reason == DelistUserReason.MANUAL

        # check cursor persisted
        user_delist_cursors: List[DelistStatusCursor] = (
            session.query(DelistStatusCursor)
            .filter(DelistStatusCursor.entity == DelistEntity.USERS)
            .all()
        )
        assert len(user_delist_cursors) == 1
        assert user_delist_cursors[0].host == trusted_notifier_manager["endpoint"]
        assert user_delist_cursors[0].created_at == all_delist_statuses[2].created_at

        # check users updated
        all_users: List[User] = (
            session.query(User)
            .filter(User.is_current)
            .order_by(asc(User.user_id))
            .all()
        )
        assert len(all_users) == 2
        assert not all_users[0].is_deactivated
        assert all_users[0].is_available
        assert all_users[1].is_deactivated
        assert not all_users[1].is_available
