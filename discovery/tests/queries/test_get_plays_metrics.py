import time
from datetime import datetime, timedelta

from src.queries.get_plays_metrics import GetPlayMetricsArgs, _get_plays_metrics
from src.tasks.index_hourly_play_counts import _index_hourly_play_counts
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

DAYS_IN_A_YEAR = 365


def format_date(date):
    return int(time.mktime(date.timetuple()))


def test_get_plays_metrics(app):
    """Tests that plays metrics can be queried"""

    with app.app_context():
        db = get_db()

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    test_entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            {"item_id": 1, "created_at": date + timedelta(hours=-1)},
            {"item_id": 1, "created_at": date + timedelta(hours=-1)},
            {"item_id": 1, "created_at": date + timedelta(days=-2)},
            {"item_id": 2, "created_at": date + timedelta(hours=-1)},
            {"item_id": 2, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
        ],
    }

    populate_mock_db(db, test_entities)

    args = GetPlayMetricsArgs(
        limit=10,
        start_time=date + timedelta(days=-3),
        bucket_size="hour",
    )

    with db.scoped_session() as session:
        _index_hourly_play_counts(session)
        metrics = _get_plays_metrics(session, args)

    assert len(metrics) == 2
    assert metrics[0]["timestamp"] == format_date(date + timedelta(hours=-1))
    assert metrics[0]["count"] == 3
    assert metrics[1]["timestamp"] == format_date(date + timedelta(days=-2))
    assert metrics[1]["count"] == 5


def test_get_plays_metrics_with_weekly_buckets(app):
    """Tests that plays metrics can be queried with weekly buckets"""

    with app.app_context():
        db = get_db()

    # A Thursday
    date = datetime(2020, 10, 1).replace(minute=0, second=0, microsecond=0)
    test_entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            {"item_id": 1, "created_at": date + timedelta(hours=-1)},
            {"item_id": 1, "created_at": date + timedelta(hours=-1)},
            {"item_id": 1, "created_at": date + timedelta(days=-2)},
            {"item_id": 2, "created_at": date + timedelta(hours=-1)},
            {"item_id": 2, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
            {"item_id": 3, "created_at": date + timedelta(days=-2)},
        ],
    }

    populate_mock_db(db, test_entities)

    start_time = date + timedelta(days=-3)
    args = GetPlayMetricsArgs(
        limit=10,
        start_time=date + timedelta(days=-3),
        bucket_size="week",
    )

    with db.scoped_session() as session:
        _index_hourly_play_counts(session)
        metrics = _get_plays_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 8
    assert metrics[0]["timestamp"] == format_date(start_time)


def test_get_plays_metrics_with_yearly_buckets(app):
    """Tests that plays metrics can be queried"""

    with app.app_context():
        db = get_db()

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    test_entities = {
        "tracks": [
            {"track_id": 1, "title": "track 1"},
            {"track_id": 2, "title": "track 2"},
            {"track_id": 3, "title": "track 3"},
        ],
        "plays": [
            {"item_id": 1, "created_at": date + timedelta(days=-3 * DAYS_IN_A_YEAR)},
            {"item_id": 1, "created_at": date + timedelta(days=-3 * DAYS_IN_A_YEAR)},
            {"item_id": 3, "created_at": date + timedelta(days=-3 * DAYS_IN_A_YEAR)},
            {"item_id": 1, "created_at": date + timedelta(days=-2 * DAYS_IN_A_YEAR)},
            {"item_id": 2, "created_at": date + timedelta(days=-2 * DAYS_IN_A_YEAR)},
            {"item_id": 3, "created_at": date + timedelta(days=-1 * DAYS_IN_A_YEAR)},
            {"item_id": 3, "created_at": date + timedelta(days=-1)},
            {"item_id": 3, "created_at": date + timedelta(weeks=-1)},
        ],
    }

    populate_mock_db(db, test_entities)

    start_time = date + timedelta(
        days=-3 * DAYS_IN_A_YEAR - 1
    )  # -1 extra day to be inclusive
    args = GetPlayMetricsArgs(
        limit=10,
        start_time=start_time,
        bucket_size="year",
    )

    with db.scoped_session() as session:
        _index_hourly_play_counts(session)
        metrics = _get_plays_metrics(session, args)

    assert len(metrics) == 4
    assert metrics[0]["count"] == 2
    assert metrics[0]["timestamp"] == format_date(date.replace(day=1, month=1))
    assert metrics[1]["count"] == 1
    assert metrics[1]["timestamp"] == format_date(
        (date + timedelta(days=-1 * DAYS_IN_A_YEAR)).replace(day=1, month=1)
    )
    assert metrics[2]["count"] == 2
    assert metrics[2]["timestamp"] == format_date(
        (date + timedelta(days=-2 * DAYS_IN_A_YEAR)).replace(day=1, month=1)
    )
    assert metrics[3]["count"] == 3
    assert metrics[3]["timestamp"] == format_date(
        (date + timedelta(days=-3 * DAYS_IN_A_YEAR)).replace(day=1, month=1)
    )
