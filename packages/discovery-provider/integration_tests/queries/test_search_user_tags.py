import logging
import time

from integration_tests.utils import populate_mock_db
from src.queries.search_es import search_tags_es
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_search_user_tags(app):
    return
    """Tests that search by tags works for users"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "tracks": [
            {"track_id": 1, "tags": "pop", "owner_id": 1},
            {"track_id": 2, "owner_id": 1, "tags": "pop,rock,electric"},
            {"track_id": 3, "owner_id": 2},
            {"track_id": 4, "owner_id": 2, "tags": "funk,pop"},
            {"track_id": 5, "owner_id": 2, "tags": "funk,pop"},
            {"track_id": 6, "owner_id": 2, "tags": "funk,Funk,kpop"},
            {"track_id": 7, "owner_id": 3, "tags": "pop"},
            {"track_id": 8, "owner_id": 3, "tags": "kpop"},
        ],
        "users": [
            {"user_id": 1, "handle": "1"},
            {"user_id": 2, "handle": "2"},
            {"user_id": 3, "handle": "3"},
        ],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 1, "followee_user_id": 3},
            {"follower_user_id": 2, "followee_user_id": 3},
        ],
    }

    populate_mock_db(db, test_entities)

    time.sleep(1)
    # logs = subprocess.run(
    #     ["npm", "run", "catchup:ci"],
    #     env=os.environ,
    #     capture_output=True,
    #     text=True,
    #     cwd="es-indexer",
    #     timeout=30,
    # )
    # logger.info(logs)

    result = search_tags_es("pop", kind="users")
    users = result["users"]

    assert len(users) == 3
    assert users[0]["user_id"] == 3  # user3 has 2 followers
    assert users[1]["user_id"] == 2  # user2 has 1 follower
    assert users[2]["user_id"] == 1  # user1 has 0 followers
