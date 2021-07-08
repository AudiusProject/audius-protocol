from src.queries.get_top_user_track_tags import _get_top_user_track_tags
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_get_top_user_track_tags(app):
    """Tests that top tags for users can be queried"""
    with app.app_context():
        db = get_db()

    test_entities = {
        "tracks": [
            {"tags": ""},
            {},
            {"tags": "pop,rock,electric"},
            {"tags": "pop,rock"},
            {"tags": "funk,pop"},
        ]
    }

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        session.execute("REFRESH MATERIALIZED VIEW tag_track_user")
        user_1_tags = _get_top_user_track_tags(session, {"user_id": 1})
        user_2_tags = _get_top_user_track_tags(session, {"user_id": 2})

    assert len(user_1_tags) == 4
    assert user_1_tags[0] == "pop"
    assert user_1_tags[1] == "rock"
    assert "electric" in user_1_tags
    assert "funk" in user_1_tags

    assert not user_2_tags
