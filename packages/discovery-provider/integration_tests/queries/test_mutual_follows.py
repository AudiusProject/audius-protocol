import logging

import pytest

from integration_tests.utils import populate_mock_db
from src.queries.get_follow_intersection_users import get_follow_intersection_users
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


@pytest.fixture
def test_entities():
    return {
        "users": [
            {"user_id": 51, "handle": "audius"},
            {"user_id": 1, "handle": "ray"},
            {"user_id": 2, "handle": "dave"},
            {"user_id": 3, "handle": "rando"},
        ],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 51},
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 2, "followee_user_id": 51},
            {"follower_user_id": 3, "followee_user_id": 51},
        ],
    }


def test_mutual_followers(app, test_entities):
    # Add pagination variables to only retrieve first tip result
    with app.test_request_context("?limit=10&offset=0"):
        db = get_db()
        populate_mock_db(db, test_entities)
        with db.scoped_session():
            # Test first without filtering, should get the most recent tip
            users = get_follow_intersection_users(
                {"my_id": 1, "other_user_id": 51, "limit": 10, "offset": 0}
            )

            assert len(users) == 1
            assert users[0]["user_id"] == 2
            assert users[0]["does_current_user_follow"] == True
