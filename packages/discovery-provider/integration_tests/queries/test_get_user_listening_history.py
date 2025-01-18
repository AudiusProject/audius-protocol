from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries import response_name_constants
from src.queries.get_top_listeners_for_track import _get_top_listeners_for_track
from src.queries.get_user_listening_history import (
    GetUserListeningHistoryArgs,
    _get_user_listening_history,
)
from src.queries.query_helpers import SortDirection, SortMethod
from src.tasks.user_listening_history.index_user_listening_history import (
    _index_user_listening_history,
)
from src.utils.db_session import get_db

TIMESTAMP = datetime(2011, 1, 1)

test_entities = {
    "user_listening_history": [
        {
            "user_id": 1,
            "listening_history": [
                {"timestamp": str(TIMESTAMP), "track_id": 3},
                {"timestamp": str(TIMESTAMP), "track_id": 4},
            ],
        }
    ],
    "plays": [
        {"user_id": 1, "item_id": 1, "created_at": TIMESTAMP + timedelta(minutes=1)},
        {"user_id": 1, "item_id": 1, "created_at": TIMESTAMP - timedelta(minutes=1)},
        {"user_id": 1, "item_id": 1, "created_at": TIMESTAMP - timedelta(minutes=1)},
        {"user_id": 1, "item_id": 2, "created_at": TIMESTAMP + timedelta(minutes=3)},
        {
            "user_id": 1,
            "item_id": 1,
            "created_at": TIMESTAMP + timedelta(minutes=2),
        },  # duplicate play
        {"user_id": 1, "item_id": 3, "created_at": TIMESTAMP + timedelta(minutes=4)},
        {"user_id": 2, "item_id": 2, "created_at": TIMESTAMP},
    ],
    "tracks": [
        {"track_id": 1, "title": "track 1", "owner_id": 1, "is_delete": True},
        {"track_id": 2, "title": "track 2", "owner_id": 2},
        {"track_id": 3, "title": "track 3", "owner_id": 3},
        {"track_id": 4, "title": "track 4", "owner_id": 3},
    ],
    "users": [
        {"user_id": 1, "handle": "user-1"},
        {"user_id": 2, "handle": "user-2"},
        {"user_id": 3, "handle": "user-3"},
    ],
}


def test_get_user_listening_history_multiple_plays(app):
    """Tests listening history from user with multiple plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    assert len(track_history) == 4
    assert (
        track_history[0][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[0][response_name_constants.track_id] == 3
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=4)
    )
    assert (
        track_history[1][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[1][response_name_constants.track_id] == 2
    assert track_history[1][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=3)
    )
    assert (
        track_history[2][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[2][response_name_constants.track_id] == 1
    assert track_history[2][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=2)
    )


def test_get_user_listening_history_no_plays(app):
    """Tests a listening history with no plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=3,
                limit=10,
                offset=0,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    assert len(track_history) == 0


def test_get_user_listening_history_single_play(app):
    """Tests a listening history with a single play"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=2,
                limit=10,
                offset=0,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    assert len(track_history) == 1
    assert (
        track_history[0][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[0][response_name_constants.track_id] == 2
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP
    )


def test_get_user_listening_history_pagination(app):
    """Tests a track history that's limit bounded"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=1,
                offset=1,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    assert len(track_history) == 1
    assert (
        track_history[0][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[0][response_name_constants.track_id] == 2
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=3)
    )


def test_get_user_listening_history_with_query(app):
    """Tests listening history from user with a query"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query="track 2",
                sort_method=None,
                sort_direction=None,
            ),
        )

    # We should only get one history item back
    assert len(track_history) == 1

    assert track_history[0][response_name_constants.track_id] == 2
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=3)
    )


def test_get_user_listening_history_custom_sort(app):
    """Tests listening history from user with multiple plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query=None,
                sort_method=SortMethod.title,
                sort_direction=SortDirection.asc,
            ),
        )

    assert len(track_history) == 4
    assert (
        track_history[2][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[2][response_name_constants.track_id] == 3
    assert track_history[2][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=4)
    )
    assert (
        track_history[1][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[1][response_name_constants.track_id] == 2
    assert track_history[1][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=3)
    )
    assert (
        track_history[0][response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[0][response_name_constants.track_id] == 1
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP + timedelta(minutes=2)
    )


def test_get_user_listening_history_sort_by_most_listens(app):
    """Tests listening history from user with multiple plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query=None,
                sort_method=SortMethod.most_listens_by_user,
                sort_direction=SortDirection.asc,
            ),
        )

    assert len(track_history) == 4
    assert_track_history(track_history[0], 1, TIMESTAMP + timedelta(minutes=2))
    assert_track_history(track_history[1], 3, TIMESTAMP + timedelta(minutes=4))
    assert_track_history(track_history[2], 2, TIMESTAMP + timedelta(minutes=3))
    assert_track_history(track_history[3], 4, TIMESTAMP)


def assert_track_history(track_history, track_id, activity_timestamp):
    assert (
        track_history[response_name_constants.user][response_name_constants.balance]
        is not None
    )
    assert track_history[response_name_constants.track_id] == track_id
    assert track_history[response_name_constants.activity_timestamp] == str(
        activity_timestamp
    )


def test_track_top_listeners(app):
    """Tests a listening history with no plays"""
    with app.app_context():
        db = get_db()

    populate_mock_db(db, test_entities)

    with db.scoped_session() as session:
        top_listeners = _get_top_listeners_for_track(session, {"track_id": 2})
        assert len(top_listeners) == 2
        assert top_listeners[0]["user"]["user_id"] == 1
        assert top_listeners[0]["count"] == 1
        assert top_listeners[1]["user"]["user_id"] == 2
        assert top_listeners[1]["count"] == 1

        top_listeners = _get_top_listeners_for_track(session, {"track_id": 1})
        assert len(top_listeners) == 1
        assert top_listeners[0]["user"]["user_id"] == 1
        assert top_listeners[0]["count"] == 2


def test_get_user_listening_history_filter_deleted_owners(app):
    """Tests that tracks with deactivated owners are filtered out of listening history"""
    with app.app_context():
        db = get_db()

    test_entities_with_deleted = {
        "user_listening_history": [
            {
                "user_id": 1,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP), "track_id": 1},
                    {"timestamp": str(TIMESTAMP), "track_id": 2},
                ],
            }
        ],
        "tracks": [
            {"track_id": 1, "title": "track 1", "owner_id": 1},
            {"track_id": 2, "title": "track 2", "owner_id": 2},
        ],
        "users": [
            {"user_id": 1, "handle": "user-1", "is_deactivated": False},
            {
                "user_id": 2,
                "handle": "user-2",
                "is_deactivated": True,
            },  # Deactivated user
        ],
    }

    populate_mock_db(db, test_entities_with_deleted)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    # Should only return track 1 since track 2's owner is deactivated
    assert len(track_history) == 1
    assert track_history[0][response_name_constants.track_id] == 1
    assert track_history[0][response_name_constants.activity_timestamp] == str(
        TIMESTAMP
    )


def test_get_user_listening_history_filter_deleted_tracks(app):
    """Tests that deleted tracks are filtered out of listening history"""
    with app.app_context():
        db = get_db()

    test_entities_with_deleted = {
        "user_listening_history": [
            {
                "user_id": 1,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP), "track_id": 1},
                    {"timestamp": str(TIMESTAMP), "track_id": 2},
                ],
            }
        ],
        "tracks": [
            {"track_id": 1, "title": "track 1", "owner_id": 1, "is_delete": True},  # Deleted track
            {"track_id": 2, "title": "track 2", "owner_id": 2, "is_delete": False},
        ],
        "users": [
            {"user_id": 1, "handle": "user-1"},
            {"user_id": 2, "handle": "user-2"},
        ],
    }

    populate_mock_db(db, test_entities_with_deleted)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        track_history = _get_user_listening_history(
            session,
            GetUserListeningHistoryArgs(
                user_id=1,
                limit=10,
                offset=0,
                query=None,
                sort_method=None,
                sort_direction=None,
            ),
        )

    # Should only return track 2 since track 1 is deleted
    assert len(track_history) == 1
    assert track_history[0][response_name_constants.track_id] == 2
    assert track_history[0][response_name_constants.activity_timestamp] == str(TIMESTAMP)
