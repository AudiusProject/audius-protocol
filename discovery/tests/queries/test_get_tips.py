import logging

import pytest

from src.queries.get_tips import GetTipsArgs, get_tips
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

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
    # Add pagination variables to only retrieve first tip result
    with app.test_request_context("?limit=1&offset=0"):
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            # Test first without filtering, should get the most recent tip
            tips_unfiltered = get_tips(
                GetTipsArgs(
                    user_id=1,
                    current_user_follows=True,
                    unique_by="receiver",
                )
            )

            assert len(tips_unfiltered) == 1
            tip = tips_unfiltered[0]
            assert tip["sender"]["user_id"] == 1
            assert tip["receiver"]["user_id"] == 3

            # Filter out recipient with most recent tip, should get the next
            # most recent tip
            tips = get_tips(
                GetTipsArgs(
                    user_id=1,
                    current_user_follows=True,
                    unique_by="receiver",
                    exclude_recipients=[3],
                )
            )

            assert len(tips) == 1
            tip = tips[0]
            assert tip["sender"]["user_id"] == 1
            assert tip["receiver"]["user_id"] == 2
