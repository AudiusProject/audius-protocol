from datetime import datetime, timedelta
from src.models import Play
from src.queries.get_plays_metrics import _get_plays_metrics
from src.utils.db_session import get_db


def populate_mock_db(db, date1, date2):
    """Helper function to populate thee mock DB with plays"""
    test_plays = [
        {"item_id": 1, "created_at": date1},
        {"item_id": 1, "created_at": date1},
        {"item_id": 1, "created_at": date2},
        {"item_id": 2, "created_at": date1},
        {"item_id": 2, "created_at": date2},
        {"item_id": 3, "created_at": date2},
        {"item_id": 3, "created_at": date2},
        {"item_id": 3, "created_at": date2},
    ]

    with db.scoped_session() as session:
        for i, play_meta in enumerate(test_plays):
            play = Play(
                id=i,
                play_item_id=play_meta.get("item_id"),
                created_at=play_meta.get("created_at", datetime.now()),
            )
            session.add(play)


def test_get_plays_metrics(app):
    """Tests that plays metrics can be queried"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    date1 = date + timedelta(hours=-1)
    date2 = date + timedelta(days=-2)
    before_date = date + timedelta(days=-3)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date1, date2)

    args = {"limit": 10, "start_time": before_date, "bucket_size": "hour"}

    with db.scoped_session() as session:
        metrics = _get_plays_metrics(session, args)

    assert len(metrics) == 2
    assert metrics[0]["count"] == 3
    assert metrics[1]["count"] == 5


def test_get_plays_metrics_with_weekly_buckets(app):
    """Tests that plays metrics can be queried with weekly buckets"""
    # A Thursday
    date = datetime(2020, 10, 1).replace(minute=0, second=0, microsecond=0)
    date1 = date + timedelta(hours=-1)
    date2 = date + timedelta(days=-2)
    before_date = date + timedelta(days=-3)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date1, date2)

    args = {"limit": 10, "start_time": before_date, "bucket_size": "week"}

    with db.scoped_session() as session:
        metrics = _get_plays_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 8
