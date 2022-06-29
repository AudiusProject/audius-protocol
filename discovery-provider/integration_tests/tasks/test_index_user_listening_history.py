import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.indexing.indexing_checkpoints import IndexingCheckpoints
from src.models.users.user_listening_history import UserListeningHistory
from src.tasks.user_listening_history.index_user_listening_history import (
    USER_LISTENING_HISTORY_TABLE_NAME,
    _index_user_listening_history,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]

logger = logging.getLogger(__name__)

TIMESTAMP_1 = datetime(2011, 1, 1)
TIMESTAMP_2 = datetime(2012, 2, 2)
TIMESTAMP_3 = datetime(2013, 3, 3)
TIMESTAMP_4 = datetime(2014, 4, 4)


# Tests
def test_index_user_listening_history_populate(app):
    """Tests populating user_listening_history from empty"""

    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "users": [
            {"user_id": 1, "handle": "user-1"},
            {"user_id": 2, "handle": "user-2"},
            {"user_id": 3, "handle": "user-3"},
        ],
        "plays": [
            # New Plays
            {"item_id": 1, "user_id": 1, "created_at": TIMESTAMP_1},
            {"item_id": 1, "user_id": 2, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 3, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 2, "created_at": TIMESTAMP_2},
            {"item_id": 3, "user_id": 3, "created_at": TIMESTAMP_2},
            {"item_id": 1, "user_id": 3, "created_at": TIMESTAMP_3},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        results: List[UserListeningHistory] = (
            session.query(UserListeningHistory)
            .order_by(UserListeningHistory.user_id)
            .all()
        )

        assert len(results) == 3

        assert results[0].user_id == 1
        assert len(results[0].listening_history) == 1
        assert results[0].listening_history[0]["track_id"] == 1
        assert results[0].listening_history[0]["timestamp"] == str(TIMESTAMP_1)

        assert results[1].user_id == 2
        assert len(results[1].listening_history) == 2
        assert results[1].listening_history[0]["track_id"] == 2
        assert results[1].listening_history[0]["timestamp"] == str(TIMESTAMP_2)
        assert results[1].listening_history[1]["track_id"] == 1
        assert results[1].listening_history[1]["timestamp"] == str(TIMESTAMP_1)

        assert results[2].user_id == 3
        assert len(results[2].listening_history) == 3
        assert results[2].listening_history[0]["track_id"] == 1
        assert results[2].listening_history[0]["timestamp"] == str(TIMESTAMP_3)
        assert results[2].listening_history[1]["track_id"] == 3
        assert results[2].listening_history[1]["timestamp"] == str(TIMESTAMP_2)
        assert results[2].listening_history[2]["track_id"] == 2
        assert results[2].listening_history[2]["timestamp"] == str(TIMESTAMP_1)

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(IndexingCheckpoints.tablename == USER_LISTENING_HISTORY_TABLE_NAME)
            .scalar()
        )

        assert new_checkpoint == 6


def test_index_user_listening_history_update(app):
    """Tests updating user_listening_history"""

    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 3"},
        ],
        "users": [
            {"user_id": 1, "handle": "user-1"},
            {"user_id": 2, "handle": "user-2"},
            {"user_id": 3, "handle": "user-3"},
            {"user_id": 4, "handle": "user-4"},
        ],
        "user_listening_history": [
            {
                "user_id": 1,
                "listening_history": [{"timestamp": str(TIMESTAMP_1), "track_id": 1}],
            },
            {
                "user_id": 2,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP_2), "track_id": 2},
                    {"timestamp": str(TIMESTAMP_1), "track_id": 1},
                ],
            },
            {
                "user_id": 3,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP_3), "track_id": 1},
                    {"timestamp": str(TIMESTAMP_2), "track_id": 3},
                    {"timestamp": str(TIMESTAMP_1), "track_id": 2},
                ],
            },
        ],
        "plays": [
            # Current Plays
            {"item_id": 1, "user_id": 1, "created_at": TIMESTAMP_1},
            {"item_id": 1, "user_id": 2, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 3, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 2, "created_at": TIMESTAMP_2},
            {"item_id": 3, "user_id": 3, "created_at": TIMESTAMP_2},
            {"item_id": 1, "user_id": 3, "created_at": TIMESTAMP_3},
            # New play
            {
                "item_id": 2,
                "user_id": 1,
                "created_at": TIMESTAMP_3,
            },  # listen to new track
            {
                "item_id": 1,
                "user_id": 1,
                "created_at": TIMESTAMP_4,
            },  # re-listen to existing track, dedupe
        ]
        + [
            # new user listens to many tracks
            {
                "item_id": i + 1,
                "user_id": 4,
                "created_at": TIMESTAMP_4 + timedelta(hours=i),
            }
            for i in range(2000)
        ],
        "indexing_checkpoints": [
            {"tablename": USER_LISTENING_HISTORY_TABLE_NAME, "last_checkpoint": 6}
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

    with db.scoped_session() as session:
        results: List[UserListeningHistory] = (
            session.query(UserListeningHistory)
            .order_by(UserListeningHistory.user_id)
            .all()
        )

        assert len(results) == 4

        assert results[0].user_id == 1
        assert len(results[0].listening_history) == 2
        assert results[0].listening_history[0]["track_id"] == 1
        assert results[0].listening_history[0]["timestamp"] == str(TIMESTAMP_4)
        assert results[0].listening_history[1]["track_id"] == 2
        assert results[0].listening_history[1]["timestamp"] == str(TIMESTAMP_3)

        assert results[1].user_id == 2
        assert len(results[1].listening_history) == 2
        assert results[1].listening_history[0]["track_id"] == 2
        assert results[1].listening_history[0]["timestamp"] == str(TIMESTAMP_2)
        assert results[1].listening_history[1]["track_id"] == 1
        assert results[1].listening_history[1]["timestamp"] == str(TIMESTAMP_1)

        assert results[2].user_id == 3
        assert len(results[2].listening_history) == 3
        assert results[2].listening_history[0]["track_id"] == 1
        assert results[2].listening_history[0]["timestamp"] == str(TIMESTAMP_3)
        assert results[2].listening_history[1]["track_id"] == 3
        assert results[2].listening_history[1]["timestamp"] == str(TIMESTAMP_2)
        assert results[2].listening_history[2]["track_id"] == 2
        assert results[2].listening_history[2]["timestamp"] == str(TIMESTAMP_1)

        assert results[3].user_id == 4
        assert len(results[3].listening_history) == 1000
        for i in range(1000):
            assert results[3].listening_history[i]["track_id"] == 2000 - i
            assert results[3].listening_history[i]["timestamp"] == str(
                datetime.fromisoformat("2014-06-26 07:00:00") - timedelta(hours=i)
            )

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(IndexingCheckpoints.tablename == USER_LISTENING_HISTORY_TABLE_NAME)
            .scalar()
        )

        assert new_checkpoint == 2008


# Tests
def test_index_user_listening_history_no_update(app):
    """Test when there are no new plays"""

    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 3"},
        ],
        "users": [
            {"user_id": 1, "handle": "user-1"},
            {"user_id": 2, "handle": "user-2"},
            {"user_id": 3, "handle": "user-3"},
            {"user_id": 4, "handle": "user-4"},
        ],
        "user_listening_history": [
            {
                "user_id": 1,
                "listening_history": [{"timestamp": str(TIMESTAMP_1), "track_id": 1}],
            },
            {
                "user_id": 2,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP_2), "track_id": 2},
                    {"timestamp": str(TIMESTAMP_1), "track_id": 1},
                ],
            },
            {
                "user_id": 3,
                "listening_history": [
                    {"timestamp": str(TIMESTAMP_3), "track_id": 1},
                    {"timestamp": str(TIMESTAMP_2), "track_id": 3},
                    {"timestamp": str(TIMESTAMP_1), "track_id": 2},
                ],
            },
        ],
        "plays": [
            # Current Plays
            {"item_id": 1, "user_id": 1, "created_at": TIMESTAMP_1},
            {"item_id": 1, "user_id": 2, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 3, "created_at": TIMESTAMP_1},
            {"item_id": 2, "user_id": 2, "created_at": TIMESTAMP_2},
            {"item_id": 3, "user_id": 3, "created_at": TIMESTAMP_2},
            {"item_id": 1, "user_id": 3, "created_at": TIMESTAMP_3},
            # New anon plays
            {"item_id": 1, "user_id": None, "created_at": TIMESTAMP_3},
            {"item_id": 1, "user_id": None, "created_at": TIMESTAMP_4},
        ],
        "indexing_checkpoints": [
            {"tablename": USER_LISTENING_HISTORY_TABLE_NAME, "last_checkpoint": 6}
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_user_listening_history(session)

        results: List[UserListeningHistory] = (
            session.query(UserListeningHistory)
            .order_by(UserListeningHistory.user_id)
            .all()
        )

        assert len(results) == 3

        assert results[0].user_id == 1
        assert len(results[0].listening_history) == 1
        assert results[0].listening_history[0]["track_id"] == 1
        assert results[0].listening_history[0]["timestamp"] == str(TIMESTAMP_1)

        assert results[1].user_id == 2
        assert len(results[1].listening_history) == 2
        assert results[1].listening_history[0]["track_id"] == 2
        assert results[1].listening_history[0]["timestamp"] == str(TIMESTAMP_2)
        assert results[1].listening_history[1]["track_id"] == 1
        assert results[1].listening_history[1]["timestamp"] == str(TIMESTAMP_1)

        assert results[2].user_id == 3
        assert len(results[2].listening_history) == 3
        assert results[2].listening_history[0]["track_id"] == 1
        assert results[2].listening_history[0]["timestamp"] == str(TIMESTAMP_3)
        assert results[2].listening_history[1]["track_id"] == 3
        assert results[2].listening_history[1]["timestamp"] == str(TIMESTAMP_2)
        assert results[2].listening_history[2]["track_id"] == 2
        assert results[2].listening_history[2]["timestamp"] == str(TIMESTAMP_1)

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(IndexingCheckpoints.tablename == USER_LISTENING_HISTORY_TABLE_NAME)
            .scalar()
        )

        assert new_checkpoint == 6
