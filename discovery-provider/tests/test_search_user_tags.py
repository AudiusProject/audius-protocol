from src.queries.search_user_tags import search_user_tags
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_search_user_tags(app):
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

    with db.scoped_session() as session:
        session.execute("REFRESH MATERIALIZED VIEW tag_track_user")
        session.execute("REFRESH MATERIALIZED VIEW aggregate_plays")
        args = {
            "search_str": "pop",
            "current_user_id": None,
            "user_tag_count": 2,
            "limit": 10,
            "offset": 0,
        }
        users = search_user_tags(session, args)

        assert len(users) == 2
        assert users[0]["user_id"] == 2  # Fir. b/c user 2 has 1 follower
        assert users[1]["user_id"] == 1  # Sec. b/c user 1 has 0 followers
        # User 3 only has one track with pop, so it does not surface in the results
