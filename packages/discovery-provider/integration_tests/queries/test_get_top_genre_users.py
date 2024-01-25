import logging

from integration_tests.utils import populate_mock_db
from src.queries.get_top_genre_users import _get_top_genre_users
from src.tasks.update_aggregates import _update_aggregates
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def test_get_top_genre_users(app):
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "owner_id": 1, "genre": "Electronic"},
            {"track_id": 2, "owner_id": 2, "genre": "Electronic"},
            {"track_id": 3, "owner_id": 2, "genre": "Pop"},
            {"track_id": 4, "owner_id": 2, "genre": "Pop"},
            {"track_id": 5, "owner_id": 3, "genre": "Pop"},
            {"track_id": 6, "owner_id": 4, "genre": "Electronic"},
        ],
        "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3}, {"user_id": 4}],
        "follows": [
            {"follower_user_id": 1, "followee_user_id": 2},
            {"follower_user_id": 2, "followee_user_id": 1},
            {"follower_user_id": 2, "followee_user_id": 3},
            {"follower_user_id": 3, "followee_user_id": 2},
            {"follower_user_id": 3, "followee_user_id": 4},
        ],
    }

    populate_mock_db(db, entities)
    with db.scoped_session() as session:
        _update_aggregates(session)

    with db.scoped_session() as session:
        users = _get_top_genre_users(session, {"genre": "Pop"})
        assert users[0]["user_id"] == 2
        assert users[1]["user_id"] == 3

        users = _get_top_genre_users(session, {"genre": "Electronic"})
        # Tie break goes to user 1 over user 4
        assert users[0]["user_id"] == 1
        assert users[1]["user_id"] == 4
