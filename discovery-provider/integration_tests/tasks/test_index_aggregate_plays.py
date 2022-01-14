import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models import AggregatePlays
from src.tasks.index_aggregate_plays import _update_aggregate_plays
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]

logger = logging.getLogger(__name__)


# Tests
def test_index_aggregate_plays_populate(app):
    """Test that we should populate plays from empty"""

    date = datetime.now()
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 0, "title": "track 0"},
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 4"},
        ],
        "plays": [
            # Current Plays
            {"item_id": 0},
            {"item_id": 0},
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 2},
            {"item_id": 3},
            # > 1 wk plays
            {"item_id": 2, "created_at": date - timedelta(weeks=2)},
            {"item_id": 2, "created_at": date - timedelta(weeks=2)},
            {"item_id": 3, "created_at": date - timedelta(weeks=2)},
            {"item_id": 3},
            {"item_id": 3},
            {"item_id": 4},
            {"item_id": 4},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_plays(session)

        results: List[AggregatePlays] = (
            session.query(AggregatePlays).order_by(AggregatePlays.play_item_id).all()
        )

        assert len(results) == 5
        assert results[0].play_item_id == 0
        assert results[0].count == 2
        assert results[1].play_item_id == 1
        assert results[1].count == 2
        assert results[2].play_item_id == 2
        assert results[2].count == 3
        assert results[3].play_item_id == 3
        assert results[3].count == 4
        assert results[4].play_item_id == 4
        assert results[4].count == 2


def test_index_aggregate_plays_update(app):
    """Test that we should insert new play counts and update existing"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 4"},
        ],
        "aggregate_plays": [
            # Current Plays
            {"play_item_id": 1, "count": 3},
            {"play_item_id": 2, "count": 3},
            {"play_item_id": 3, "count": 3},
        ],
        "indexing_checkpoints": [
            {"tablename": "aggregate_plays", "last_checkpoint": 9}
        ],
        "plays": [
            # Current Plays
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 2},
            {"item_id": 2},
            {"item_id": 2},
            {"item_id": 3},
            {"item_id": 3},
            {"item_id": 3},
            # New plays
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 2},
            {"item_id": 4},
            {"item_id": 4},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_plays(session)

        results: List[AggregatePlays] = (
            session.query(AggregatePlays).order_by(AggregatePlays.play_item_id).all()
        )

        assert len(results) == 4
        assert results[0].play_item_id == 1
        assert results[0].count == 5
        assert results[1].play_item_id == 2
        assert results[1].count == 4
        assert results[2].play_item_id == 3
        assert results[2].count == 3
        assert results[3].play_item_id == 4
        assert results[3].count == 2


def test_index_aggregate_plays_same_checkpoint(app):
    """Test that we should not update when last index is the same"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 4"},
        ],
        "aggregate_plays": [
            # Current Plays
            {"play_item_id": 1, "count": 3},
            {"play_item_id": 2, "count": 3},
            {"play_item_id": 3, "count": 3},
        ],
        "indexing_checkpoints": [
            {"tablename": "aggregate_plays", "last_checkpoint": 9}
        ],
        "plays": [
            # Current Plays
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 2},
            {"item_id": 2},
            {"item_id": 2},
            {"item_id": 3},
            {"item_id": 3},
            {"item_id": 3},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_plays(session)

        results: List[AggregatePlays] = (
            session.query(AggregatePlays).order_by(AggregatePlays.play_item_id).all()
        )

        assert len(results) == 3


def test_index_aggregate_plays_no_plays(app):
    """Tests that aggregate_plays should skip indexing if there are no plays"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {"plays": []}

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _update_aggregate_plays(session)
