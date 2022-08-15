from integration_tests.utils import populate_mock_db
from src.queries.get_playlist_is_occupied import _get_playlist_is_occupied
from src.utils.db_session import get_db


def populate_playlist(db):
    test_entities = {
        "playlists": [
            {"playlist_id": 1, "is_delete": True, "is_private": True, "is_album": True}
        ],
        "users": [
            {"user_id": 1, "handle": "user1"},
        ],
    }

    populate_mock_db(db, test_entities)


def test_get_playlist_is_occupied(app):
    """Test getting playlist is occupied"""

    with app.app_context():
        db = get_db()

    populate_playlist(db)

    with db.scoped_session() as session:
        is_occupied = _get_playlist_is_occupied(session, 1)

        assert is_occupied == True

        is_occupied = _get_playlist_is_occupied(session, 2)
        assert is_occupied == False
