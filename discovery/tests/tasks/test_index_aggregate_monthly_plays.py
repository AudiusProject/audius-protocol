import logging
from datetime import date, timedelta
from typing import List

from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.models.social.aggregate_monthly_plays import AggregateMonthlyPlay
from src.tasks.index_aggregate_monthly_plays import (
    AGGREGATE_MONTHLY_PLAYS_TABLE_NAME,
    _index_aggregate_monthly_plays,
)
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)

CURRENT_TIMESTAMP = date.fromisoformat("2022-01-20")
LAST_MONTH_TIMESTAMP = CURRENT_TIMESTAMP - timedelta(weeks=4)
LAST_YEAR_TIMESTAMP = CURRENT_TIMESTAMP - timedelta(weeks=52)


# Tests
def test_index_aggregate_monthly_plays_populate(app):
    """Test populate plays from empty"""

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
        "plays": [
            # Last year
            {"item_id": 3, "created_at": LAST_YEAR_TIMESTAMP},
            # Last month
            {"item_id": 1, "created_at": LAST_MONTH_TIMESTAMP},
            # This month
            {"item_id": 2, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=2)},
            {"item_id": 2, "created_at": CURRENT_TIMESTAMP - timedelta(weeks=2)},
            {"item_id": 1, "created_at": CURRENT_TIMESTAMP},
            {"item_id": 3, "created_at": CURRENT_TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_aggregate_monthly_plays(session)

        results: List[AggregateMonthlyPlay] = (
            session.query(AggregateMonthlyPlay)
            .order_by(
                AggregateMonthlyPlay.timestamp,
                AggregateMonthlyPlay.play_item_id,
            )
            .all()
        )

        assert len(results) == 5
        assert results[0].play_item_id == 3
        assert results[0].timestamp == LAST_YEAR_TIMESTAMP.replace(day=1)
        assert results[0].count == 1
        assert results[1].play_item_id == 1
        assert results[1].timestamp == LAST_MONTH_TIMESTAMP.replace(day=1)
        assert results[1].count == 1
        assert results[2].play_item_id == 1
        assert results[2].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[2].count == 1
        assert results[3].play_item_id == 2
        assert results[3].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[3].count == 2
        assert results[4].play_item_id == 3
        assert results[4].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[4].count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == AGGREGATE_MONTHLY_PLAYS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 6


def test_index_aggregate_monthly_plays_update(app):
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
        ],
        "aggregate_monthly_plays": [
            {
                "play_item_id": 3,
                "timestamp": LAST_YEAR_TIMESTAMP.replace(day=1),
                "count": 2,
            },
            {
                "play_item_id": 2,
                "timestamp": LAST_MONTH_TIMESTAMP.replace(day=1),
                "count": 1,
            },
        ],
        "plays": [
            # Last year
            {"id": 4, "item_id": 3, "created_at": LAST_YEAR_TIMESTAMP},
            # Last month
            {"id": 5, "item_id": 1, "created_at": LAST_MONTH_TIMESTAMP},
            # This month
            {
                "id": 6,
                "item_id": 2,
                "created_at": CURRENT_TIMESTAMP - timedelta(weeks=2),
            },
            {
                "id": 7,
                "item_id": 2,
                "created_at": CURRENT_TIMESTAMP - timedelta(weeks=2),
            },
            {"id": 8, "item_id": 1, "created_at": CURRENT_TIMESTAMP},
            {"id": 9, "item_id": 3, "created_at": CURRENT_TIMESTAMP},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_aggregate_monthly_plays(session)

        results: List[AggregateMonthlyPlay] = (
            session.query(AggregateMonthlyPlay)
            .order_by(
                AggregateMonthlyPlay.timestamp,
                AggregateMonthlyPlay.play_item_id,
            )
            .all()
        )

        assert len(results) == 6
        assert results[0].play_item_id == 3
        assert results[0].timestamp == LAST_YEAR_TIMESTAMP.replace(day=1)
        assert results[0].count == 3
        assert results[1].play_item_id == 1
        assert results[1].timestamp == LAST_MONTH_TIMESTAMP.replace(day=1)
        assert results[1].count == 1
        assert results[2].play_item_id == 2
        assert results[2].timestamp == LAST_MONTH_TIMESTAMP.replace(day=1)
        assert results[2].count == 1
        assert results[3].play_item_id == 1
        assert results[3].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[3].count == 1
        assert results[4].play_item_id == 2
        assert results[4].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[4].count == 2
        assert results[5].play_item_id == 3
        assert results[5].timestamp == CURRENT_TIMESTAMP.replace(day=1)
        assert results[5].count == 1

        new_checkpoint: IndexingCheckpoint = (
            session.query(IndexingCheckpoint.last_checkpoint)
            .filter(IndexingCheckpoint.tablename == AGGREGATE_MONTHLY_PLAYS_TABLE_NAME)
            .scalar()
        )
        assert new_checkpoint == 9


def test_index_aggregate_monthly_plays_same_checkpoint(app):
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
        "aggregate_monthly_plays": [
            {
                "play_item_id": 3,
                "timestamp": LAST_YEAR_TIMESTAMP.replace(day=1),
                "count": 2,
            },
            {
                "play_item_id": 2,
                "timestamp": LAST_MONTH_TIMESTAMP.replace(day=1),
                "count": 1,
            },
        ],
        "indexing_checkpoints": [
            {
                "tablename": "aggregate_monthly_plays",
                "last_checkpoint": 9,
            }
        ],
        "plays": [
            # Current Plays
            {"id": 9},
        ],
    }

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_aggregate_monthly_plays(session)

    results: List[AggregateMonthlyPlay] = (
        session.query(AggregateMonthlyPlay)
        .order_by(AggregateMonthlyPlay.play_item_id)
        .all()
    )

    assert len(results) == 2

    new_checkpoint: IndexingCheckpoint = (
        session.query(IndexingCheckpoint.last_checkpoint)
        .filter(IndexingCheckpoint.tablename == AGGREGATE_MONTHLY_PLAYS_TABLE_NAME)
        .scalar()
    )
    assert new_checkpoint == 9


def test_index_aggregate_monthly_plays_no_plays(app):
    """Tests that aggregate_monthly_plays should skip indexing if there are no plays"""
    # setup
    with app.app_context():
        db = get_db()

    # run
    entities = {"plays": []}

    populate_mock_db(db, entities)

    with db.scoped_session() as session:
        _index_aggregate_monthly_plays(session)
