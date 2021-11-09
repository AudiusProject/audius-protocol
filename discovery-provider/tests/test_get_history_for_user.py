from src.queries.get_track_history import _get_track_history
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

test_entities = {
    "plays": [
        # Note these plays are in chronological order in addition
        # so the track history should pull them "backwards" for reverse chronological
        # sort order.
        {"user_id": 1, "play_item_id": 1},
        {"user_id": 1, "play_item_id": 1},
        {"user_id": 1, "play_item_id": 2},
        {"user_id": 2, "play_item_id": 2},
    ],

    "tracks": [
        {"track_id": 1, "title": "track 1"},
        {"track_id": 2, "title": "track 2"}
    ],

    "users": [
        {"user_id": 1, "handle": "user-1"},
        {"user_id": 2, "handle": "user-2"},
        {"user_id": 3, "handle": "user-3"},

    ],
}

def test_get_track_history_for_user_multiple_plays(app):
    """Tests track history from user with multiple plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_history = _get_track_history(
            session,
            {
                "current_user_id": 1,
                "limit": 10,
                "offset": 0,
                "filter_deleted": False,
                "with_users": True,

            }
        )

    assert len(track_history) == 3
    assert track_history[0]["track_id"] == 2
    assert track_history[1]["track_id"] == 1
    assert track_history[2]["track_id"] == 1

def test_get_track_history_for_user_no_plays(app):
    """Tests a user's track history with no plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_history = _get_track_history(
            session,
            {
                "current_user_id": 3,
                "limit": 10,
                "offset": 0,
                "filter_deleted": False,
                "with_users": True,

            }
        )

    assert len(track_history) == 0

def test_get_track_history_for_single_play(app):
    """Tests a track history with a single play"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_history = _get_track_history(
            session,
            {
                "current_user_id": 2,
                "limit": 10,
                "offset": 0,
                "filter_deleted": False,
                "with_users": True,

            }
        )

    assert len(track_history) == 1
    assert track_history[0]["track_id"] == 2


def test_get_track_history_for_limit_bound(app):
    """Tests a track history that's limit bounded"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        track_history = _get_track_history(
            session,
            {
                "current_user_id": 1,
                "limit": 1,
                "offset": 0,
                "filter_deleted": False,
                "with_users": True,

            }
        )

    assert len(track_history) == 1
    assert track_history[0]["track_id"] == 2
