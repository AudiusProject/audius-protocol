from datetime import datetime, timedelta
from src.models import AppNameMetrics
from src.queries.get_app_name_metrics import _get_app_name_metrics
from src.utils.db_session import get_db


def populate_mock_db(db, date1, date2):
    """Helper function that populates the mock db with metrics"""

    app_names = [
        {
            "application_name": "joe",
            "ip": "192.168.0.1",
            "count": 3,
            "timestamp": date1,
        },
        {
            "application_name": "joe",
            "ip": "192.168.0.1",
            "count": 4,
            "timestamp": date2,
        },
        {
            "application_name": "mike",
            "ip": "192.168.0.1",
            "count": 1,
            "timestamp": date1,
        },
        {
            "application_name": "ray",
            "ip": "192.168.0.1",
            "count": 2,
            "timestamp": date1,
        },
        {
            "application_name": "ray",
            "ip": "192.168.0.2",
            "count": 2,
            "timestamp": date1,
        },
    ]

    # Set up db state
    with db.scoped_session() as session:
        app_name_rows = [
            AppNameMetrics(
                application_name=app_name["application_name"],
                ip=app_name["ip"],
                count=app_name["count"],
                timestamp=app_name["timestamp"],
            )
            for app_name in app_names
        ]

        session.bulk_save_objects(app_name_rows)


def test_get_app_name_metrics(app):
    """Tests that the route metrics are queried correctly from db data"""
    date = datetime(2020, 10, 4, 10, 35, 0)
    before_date = date + timedelta(hours=-1)
    after_date = date + timedelta(hours=1)

    with app.app_context():
        db_mock = get_db()

    populate_mock_db(db_mock, date, after_date)

    app_name = "joe"
    args_1 = {"limit": 10, "start_time": before_date, "bucket_size": "hour"}
    with db_mock.scoped_session() as session:
        metrics_1 = _get_app_name_metrics(session, app_name, args_1)

        assert len(metrics_1) == 2
        assert metrics_1[0]["count"] == 4
        assert metrics_1[0]["unique_count"] == 1
        assert metrics_1[1]["count"] == 3
        assert metrics_1[1]["unique_count"] == 1

        app_name = "mike"
        args_2 = {"limit": 10, "start_time": before_date, "bucket_size": "hour"}
        metrics_2 = _get_app_name_metrics(session, app_name, args_2)

        assert len(metrics_2) == 1
        assert metrics_2[0]["count"] == 1
        assert metrics_2[0]["unique_count"] == 1

        app_name = "ray"
        args_2 = {"limit": 10, "start_time": before_date, "bucket_size": "hour"}
        metrics_2 = _get_app_name_metrics(session, app_name, args_2)

        assert len(metrics_2) == 1
        assert metrics_2[0]["count"] == 4
        assert metrics_2[0]["unique_count"] == 2


def test_get_app_name_metrics_with_daily_buckets(app):
    """Tests that the app metrics can be queried with daily buckets"""
    date = datetime(2020, 10, 4, 10, 35, 0)
    before_date = date + timedelta(hours=-1)
    after_date = date + timedelta(hours=1)

    with app.app_context():
        db_mock = get_db()

    populate_mock_db(db_mock, date, after_date)

    app_name = "joe"
    args = {"limit": 10, "start_time": before_date, "bucket_size": "day"}
    with db_mock.scoped_session() as session:
        metrics_1 = _get_app_name_metrics(session, app_name, args)

        assert len(metrics_1) == 1
        assert metrics_1[0]["count"] == 7
        assert metrics_1[0]["unique_count"] == 1
