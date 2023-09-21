import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import desc

from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.models.social.hourly_play_counts import HourlyPlayCount
from src.tasks.index_hourly_play_counts import (
    HOURLY_PLAY_COUNTS_TABLE_NAME,
    _index_hourly_play_counts,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db

from .utils import populate_mock_db

REDIS_URL = shared_config["redis"]["url"]

logger = logging.getLogger(__name__)

TIMESTAMP = datetime.now().replace(microsecond=0, second=0, minute=0)


# Tests
def test_index_hourly_play_counts_populate(app):
    """Test that hourly play counts populate from empty"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
            {"track_id": 4, "title": "track 4"},
        ],
        "plays": [
            # Current Plays
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=8)},
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 3, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _index_hourly_play_counts(session)

        results: List[HourlyPlayCount] = (
            session.query(HourlyPlayCount)
            .order_by(desc(HourlyPlayCount.hourly_timestamp))
            .all()
        )

        assert len(results) == 5
        assert results[0].hourly_timestamp == TIMESTAMP
        assert results[0].play_count == 4
        assert results[1].hourly_timestamp == TIMESTAMP - timedelta(hours=5)
        assert results[1].play_count == 3
        assert results[2].hourly_timestamp == TIMESTAMP - timedelta(hours=6)
        assert results[2].play_count == 3
        assert results[3].hourly_timestamp == TIMESTAMP - timedelta(hours=7)
        assert results[3].play_count == 2
        assert results[4].hourly_timestamp == TIMESTAMP - timedelta(hours=8)
        assert results[4].play_count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == HOURLY_PLAY_COUNTS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 13


def test_index_hourly_play_counts_single_update(app):
    """Test that hourly play counts update from the previous checkpoint"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 0"},
            {"track_id": 2, "title": "track 1"},
            {"track_id": 3, "title": "track 2"},
            {"track_id": 4, "title": "track 3"},
        ],
        "plays": [
            # Indexed Plays
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=8)},
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 3, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            # New plays
            {"item_id": 1, "created_at": TIMESTAMP},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 2, "created_at": TIMESTAMP + timedelta(hours=1)},
        ],
        "hourly_play_counts": [
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=4), "play_count": 1},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=3), "play_count": 2},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=2), "play_count": 3},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=1), "play_count": 3},
        ],
        "indexing_checkpoints": [
            {"tablename": HOURLY_PLAY_COUNTS_TABLE_NAME, "last_checkpoint": 13}
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _index_hourly_play_counts(session)

        results: List[HourlyPlayCount] = (
            session.query(HourlyPlayCount)
            .order_by(desc(HourlyPlayCount.hourly_timestamp))
            .all()
        )
        assert len(results) == 6
        assert results[0].hourly_timestamp == TIMESTAMP + timedelta(hours=1)
        assert results[0].play_count == 1
        assert results[1].hourly_timestamp == TIMESTAMP
        assert results[1].play_count == 2
        assert results[2].hourly_timestamp == TIMESTAMP - timedelta(hours=1)
        assert results[2].play_count == 3
        assert results[3].hourly_timestamp == TIMESTAMP - timedelta(hours=2)
        assert results[3].play_count == 3
        assert results[4].hourly_timestamp == TIMESTAMP - timedelta(hours=3)
        assert results[4].play_count == 2
        assert results[5].hourly_timestamp == TIMESTAMP - timedelta(hours=4)
        assert results[5].play_count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == HOURLY_PLAY_COUNTS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 16


def test_index_hourly_play_counts_idempotent(app):
    """Tests multiple updates does not change data"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 0"},
            {"track_id": 2, "title": "track 1"},
            {"track_id": 3, "title": "track 2"},
            {"track_id": 4, "title": "track 3"},
        ],
        "plays": [
            # Indexed Plays
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=8)},
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 3, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            # New plays
            {"item_id": 1, "created_at": TIMESTAMP},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 2, "created_at": TIMESTAMP + timedelta(hours=1)},
        ],
        "hourly_play_counts": [
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=4), "play_count": 1},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=3), "play_count": 2},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=2), "play_count": 3},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=1), "play_count": 3},
        ],
        "indexing_checkpoints": [
            {"tablename": HOURLY_PLAY_COUNTS_TABLE_NAME, "last_checkpoint": 13}
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _index_hourly_play_counts(session)
        _index_hourly_play_counts(session)
        _index_hourly_play_counts(session)

        results: List[HourlyPlayCount] = (
            session.query(HourlyPlayCount)
            .order_by(desc(HourlyPlayCount.hourly_timestamp))
            .all()
        )
        assert len(results) == 6
        assert results[0].hourly_timestamp == TIMESTAMP + timedelta(hours=1)
        assert results[0].play_count == 1
        assert results[1].hourly_timestamp == TIMESTAMP
        assert results[1].play_count == 2
        assert results[2].hourly_timestamp == TIMESTAMP - timedelta(hours=1)
        assert results[2].play_count == 3
        assert results[3].hourly_timestamp == TIMESTAMP - timedelta(hours=2)
        assert results[3].play_count == 3
        assert results[4].hourly_timestamp == TIMESTAMP - timedelta(hours=3)
        assert results[4].play_count == 2
        assert results[5].hourly_timestamp == TIMESTAMP - timedelta(hours=4)
        assert results[5].play_count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == HOURLY_PLAY_COUNTS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 16


def test_index_hourly_play_counts_no_change(app):
    """Test that hourly play counts should not write if there are no new plays"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 0"},
            {"track_id": 2, "title": "track 1"},
            {"track_id": 3, "title": "track 2"},
            {"track_id": 4, "title": "track 3"},
        ],
        "plays": [
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=8)},
            {"item_id": 1, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=7)},
            {"item_id": 2, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=6)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 3, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 4, "created_at": TIMESTAMP - timedelta(hours=5)},
            {"item_id": 2, "created_at": TIMESTAMP},
            {"item_id": 3, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
            {"item_id": 4, "created_at": TIMESTAMP},
        ],
        "hourly_play_counts": [
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=8), "play_count": 1},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=7), "play_count": 2},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=6), "play_count": 3},
            {"hourly_timestamp": TIMESTAMP - timedelta(hours=5), "play_count": 3},
            {"hourly_timestamp": TIMESTAMP, "play_count": 4},
        ],
        "indexing_checkpoints": [
            {"tablename": HOURLY_PLAY_COUNTS_TABLE_NAME, "last_checkpoint": 13}
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _index_hourly_play_counts(session)

        results: List[HourlyPlayCount] = (
            session.query(HourlyPlayCount)
            .order_by(desc(HourlyPlayCount.hourly_timestamp))
            .all()
        )

        assert len(results) == 5
        assert results[0].hourly_timestamp == TIMESTAMP
        assert results[0].play_count == 4
        assert results[1].hourly_timestamp == TIMESTAMP - timedelta(hours=5)
        assert results[1].play_count == 3
        assert results[2].hourly_timestamp == TIMESTAMP - timedelta(hours=6)
        assert results[2].play_count == 3
        assert results[3].hourly_timestamp == TIMESTAMP - timedelta(hours=7)
        assert results[3].play_count == 2
        assert results[4].hourly_timestamp == TIMESTAMP - timedelta(hours=8)
        assert results[4].play_count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == HOURLY_PLAY_COUNTS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 13


def test_index_hourly_play_counts_empty_plays(app):
    """Test that hourly play counts should skip indexing if there are no plays"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 0"},
            {"track_id": 2, "title": "track 1"},
            {"track_id": 3, "title": "track 2"},
            {"track_id": 4, "title": "track 3"},
        ],
        "plays": [],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _index_hourly_play_counts(session)
