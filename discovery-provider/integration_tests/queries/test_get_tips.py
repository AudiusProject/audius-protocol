import logging

import pytest
from integration_tests.utils import populate_mock_db
from src.queries.get_tips import get_tips, GetTipsArgs
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


@pytest.fixture
def test_entities():
    return {
        "users": [
            {"user_id": 1, "handle": "user1"},
            {"user_id": 2, "handle": "user2"},
            {"user_id": 3, "handle": "DontShowMyTips"},
        ],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 1, "followee_user_id": 3},
        ],
        "user_tips": [
            {
                "slot": 0,
                "signature": "abcdefg",
                "sender_user_id": 1,
                "receiver_user_id": 2,
                "amount": 100000000,
            },
            {
                "slot": 1,
                "signature": "abcdefg",
                "sender_user_id": 1,
                "receiver_user_id": 3,
                "amount": 100000000,
            },
        ],
        "aggregate_user_tips": [
            {"sender_user_id": 1, "receiver_user_id": 2, "amount": 100000000},
            {"sender_user_id": 1, "receiver_user_id": 3, "amount": 100000000},
        ],
    }


def test_exclude_receivers_from_query(app, test_entities):
    with app.app_context():
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            tips = get_tips(
                GetTipsArgs(
                    user_id=1,
                    current_user_follows=True,
                    unique_by="receiver",
                    exclude_recipients=[3],
                    limit=1,
                    offset=0,
                )
            )

            assert len(tips) == 1
            tip = tips[0]
            assert tip["sender"] == 1
            assert tip["receiver"] == 2
