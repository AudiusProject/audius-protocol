import logging
from datetime import datetime, timedelta
from typing import List

from integration_tests.utils import populate_mock_db
from src.models import AggregateIntervalPlay, IndexingCheckpoints
from src.tasks.index_aggregate_interval_plays import (
    AGGREGATE_INTERVAL_PLAYS_TABLE_NAME,
    _update_aggregate_interval_plays,
)
from src.utils.config import shared_config
from src.utils.db_session import get_db

REDIS_URL = shared_config["redis"]["url"]
DATE_NOW = datetime.now()

logger = logging.getLogger(__name__)


# Tests
def test_index_aggregate_interval_plays_populate(app):
    """Test that we should populate plays from empty"""

    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1", "created_at": DATE_NOW},
            {"track_id": 2, "title": "track 2", "created_at": DATE_NOW},
        ],
        "plays": [
            # <= week
            {"item_id": 1},
            {"item_id": 1},
            {"item_id": 1, "created_at": DATE_NOW - timedelta(days=2)},
            {"item_id": 1, "created_at": DATE_NOW - timedelta(days=1)},
            {"item_id": 2, "created_at": DATE_NOW - timedelta(days=6)},
            # <= month
            {"item_id": 1, "created_at": DATE_NOW - timedelta(weeks=2)},
            {"item_id": 1, "created_at": DATE_NOW - timedelta(weeks=3)},
            {"item_id": 2, "created_at": DATE_NOW - timedelta(weeks=1)},
            {"item_id": 2, "created_at": DATE_NOW - timedelta(weeks=3)},
            # <= year
            {"item_id": 1, "created_at": DATE_NOW - timedelta(weeks=10)},
            {"item_id": 2, "created_at": DATE_NOW - timedelta(weeks=50)},
            # > 1 year
            {"item_id": 1, "created_at": DATE_NOW - timedelta(weeks=54)},
            {"item_id": 2, "created_at": DATE_NOW - timedelta(weeks=100)},
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _update_aggregate_interval_plays(session)

        results: List[AggregateIntervalPlay] = (
            session.query(AggregateIntervalPlay)
            .order_by(AggregateIntervalPlay.track_id)
            .all()
        )

        assert len(results) == 2
        assert results[0].track_id == 1
        assert results[0].created_at == DATE_NOW
        assert results[0].week_listen_counts == 4
        assert results[0].month_listen_counts == 6
        assert results[0].year_listen_counts == 7

        assert results[1].track_id == 2
        assert results[1].created_at == DATE_NOW
        assert results[1].week_listen_counts == 1
        assert results[1].month_listen_counts == 3
        assert results[1].year_listen_counts == 4

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(
                IndexingCheckpoints.tablename == AGGREGATE_INTERVAL_PLAYS_TABLE_NAME
            )
            .scalar()
        )

        assert new_checkpoint == 13


def test_index_aggregate_interval_plays_update(app):
    """Test that we should insert new play counts and update existing"""
    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1", "created_at": DATE_NOW},
            {"track_id": 2, "title": "track 2", "created_at": DATE_NOW},
        ],
        "aggregate_interval_plays": [
            {
                "track_id": 1,
                "created_at": DATE_NOW,
                "week_listen_counts": 4,
                "month_listen_counts": 6,
                "year_listen_counts": 7,
            },
            {
                "track_id": 2,
                "created_at": DATE_NOW,
                "week_listen_counts": 1,
                "month_listen_counts": 3,
                "year_listen_counts": 4,
            },
        ],
        "indexing_checkpoints": [
            {"tablename": AGGREGATE_INTERVAL_PLAYS_TABLE_NAME, "last_checkpoint": 13}
        ],
        "plays": [
            # <= week
            {"id": 14, "item_id": 2, "created_at": DATE_NOW},
            {"id": 15, "item_id": 2, "created_at": DATE_NOW},
            {"id": 16, "item_id": 2, "created_at": DATE_NOW},
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _update_aggregate_interval_plays(session)

        results: List[AggregateIntervalPlay] = (
            session.query(AggregateIntervalPlay)
            .order_by(AggregateIntervalPlay.track_id)
            .all()
        )

        assert len(results) == 2

        assert results[0].track_id == 1
        assert results[0].created_at == DATE_NOW
        assert results[0].week_listen_counts == 4
        assert results[0].month_listen_counts == 6
        assert results[0].year_listen_counts == 7

        assert results[1].track_id == 2
        assert results[1].created_at == DATE_NOW
        assert results[1].week_listen_counts == 4
        assert results[1].month_listen_counts == 6
        assert results[1].year_listen_counts == 7

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(
                IndexingCheckpoints.tablename == AGGREGATE_INTERVAL_PLAYS_TABLE_NAME
            )
            .scalar()
        )

        assert new_checkpoint == 16


def test_index_aggregate_interval_plays_same_checkpoint(app):
    """Test that we should not update when last index is the same"""
    # setup
    with app.app_context():
        db = get_db()

    entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1", "created_at": DATE_NOW},
            {"track_id": 2, "title": "track 2", "created_at": DATE_NOW},
        ],
        "aggregate_interval_plays": [
            {
                "track_id": 1,
                "created_at": DATE_NOW,
                "week_listen_counts": 4,
                "month_listen_counts": 6,
                "year_listen_counts": 7,
            },
            {
                "track_id": 2,
                "created_at": DATE_NOW,
                "week_listen_counts": 1,
                "month_listen_counts": 3,
                "year_listen_counts": 4,
            },
        ],
        "indexing_checkpoints": [
            {"tablename": AGGREGATE_INTERVAL_PLAYS_TABLE_NAME, "last_checkpoint": 10}
        ],
        "plays": [
            # <= week
            {"id": 10, "item_id": 2, "created_at": DATE_NOW},
        ],
    }

    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _update_aggregate_interval_plays(session)

        results: List[AggregateIntervalPlay] = (
            session.query(AggregateIntervalPlay)
            .order_by(AggregateIntervalPlay.track_id)
            .all()
        )

        assert len(results) == 2
        assert results[0].track_id == 1
        assert results[0].created_at == DATE_NOW
        assert results[0].week_listen_counts == 4
        assert results[0].month_listen_counts == 6
        assert results[0].year_listen_counts == 7

        assert results[1].track_id == 2
        assert results[1].created_at == DATE_NOW
        assert results[1].week_listen_counts == 1
        assert results[1].month_listen_counts == 3
        assert results[1].year_listen_counts == 4

        new_checkpoint: IndexingCheckpoints = (
            session.query(IndexingCheckpoints.last_checkpoint)
            .filter(
                IndexingCheckpoints.tablename == AGGREGATE_INTERVAL_PLAYS_TABLE_NAME
            )
            .scalar()
        )

        assert new_checkpoint == 10


def test_index_aggregate_interval_plays_no_plays(app):
    """Raise exception when there are no plays"""
    # setup
    with app.app_context():
        db = get_db()
    entities = {"plays": []}
    populate_mock_db(db, entities)

    # run
    with db.scoped_session() as session:
        _update_aggregate_interval_plays(session)

        results: List[AggregateIntervalPlay] = (
            session.query(AggregateIntervalPlay)
            .order_by(AggregateIntervalPlay.track_id)
            .all()
        )

        assert len(results) == 0
