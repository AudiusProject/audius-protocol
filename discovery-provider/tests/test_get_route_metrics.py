from datetime import datetime, timedelta
from src.models import RouteMetrics
from src.queries.get_route_metrics import _get_route_metrics
from src.utils.db_session import get_db


def populate_mock_db(db, date):
    """Helper function to populate the mock DB with route metrics"""
    mock_route_metrics = [
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "",
            "ip": "192.168.0.1",
            "count": 3,
            "timestamp": date,
        },
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "with_users=true",
            "ip": "192.168.0.1",
            "count": 2,
            "timestamp": date,
        },
        {
            "version": "1",
            "route_path": "tracks/some_hash/stream",
            "query_string": "",
            "ip": "192.168.0.1",
            "count": 4,
            "timestamp": date,
        },
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "",
            "ip": "192.168.0.2",
            "count": 2,
            "timestamp": date,
        },
    ]

    with db.scoped_session() as session:
        route_metric_obj = [
            RouteMetrics(
                version=metric["version"],
                route_path=metric["route_path"],
                query_string=metric["query_string"],
                ip=metric["ip"],
                count=metric["count"],
                timestamp=metric["timestamp"],
            )
            for metric in mock_route_metrics
        ]

        session.bulk_save_objects(route_metric_obj)


def populate_mock_db_multiple_dates(db, date1, date2):
    """Helper function to populate the mock DB with route metrics of multiple dates"""
    mock_route_metrics = [
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "",
            "ip": "192.168.0.1",
            "count": 3,
            "timestamp": date1,
        },
        {
            "version": "1",
            "route_path": "tracks/some_hash",
            "query_string": "",
            "ip": "192.168.0.2",
            "count": 2,
            "timestamp": date2,
        },
    ]

    with db.scoped_session() as session:
        route_metric_obj = [
            RouteMetrics(
                version=metric["version"],
                route_path=metric["route_path"],
                query_string=metric["query_string"],
                ip=metric["ip"],
                count=metric["count"],
                timestamp=metric["timestamp"],
            )
            for metric in mock_route_metrics
        ]

        session.bulk_save_objects(route_metric_obj)


def test_get_route_metrics_exact(app):
    """Tests that the route metrics can queried by exact path match"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    before_date = date + timedelta(hours=-1)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "exact": True,
        "bucket_size": "hour",
    }

    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 7
    assert metrics[0]["unique_count"] == 2


def test_get_route_metrics_non_exact(app):
    """Tests that the route metrics can be queried by non-exact path match"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    before_date = date + timedelta(hours=-1)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "exact": False,
        "bucket_size": "hour",
    }
    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 11
    assert metrics[0]["unique_count"] == 2


def test_get_route_metrics_query_string(app):
    """Tests that the route metrics are queried with query_string parameter"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    before_date = date + timedelta(hours=-1)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "query_string": "with_users=true",
        "exact": False,
        "bucket_size": "hour",
    }
    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 2
    assert metrics[0]["unique_count"] == 1


def test_get_route_metrics_no_matches(app):
    """Tests that route metrics returns nothing if no matching query_string"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    before_date = date + timedelta(hours=-1)

    with app.app_context():
        db = get_db()

    populate_mock_db(db, date)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "query_string": "with_users=WRONG",
        "exact": False,
        "bucket_size": "hour",
    }
    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert not metrics


def test_get_route_metrics_with_daily_buckets(app):
    """Tests that the route metrics can be queried with daily buckets"""

    date = datetime(2020, 10, 4).replace(minute=0, second=0, microsecond=0)
    date1 = date + timedelta(hours=-1)
    date2 = date + timedelta(days=-2)
    before_date = date + timedelta(days=-3)

    with app.app_context():
        db = get_db()

    populate_mock_db_multiple_dates(db, date1, date2)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "exact": False,
        "bucket_size": "day",
    }
    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert len(metrics) == 2
    assert metrics[0]["count"] == 3
    assert metrics[0]["unique_count"] == 1
    assert metrics[1]["count"] == 2
    assert metrics[1]["unique_count"] == 1


def test_get_route_metrics_with_weekly_buckets(app):
    """Tests that the route metrics can be queried with weekly buckets"""
    # A Thursday
    date = datetime(2020, 10, 1).replace(minute=0, second=0, microsecond=0)
    date1 = date + timedelta(hours=-1)
    date2 = date + timedelta(days=-2)
    before_date = date + timedelta(days=-3)

    with app.app_context():
        db = get_db()

    populate_mock_db_multiple_dates(db, date1, date2)

    args = {
        "limit": 10,
        "start_time": before_date,
        "path": "tracks/some_hash",
        "exact": False,
        "bucket_size": "week",
    }
    with db.scoped_session() as session:
        metrics = _get_route_metrics(session, args)

    assert len(metrics) == 1
    assert metrics[0]["count"] == 5
    assert metrics[0]["unique_count"] == 2
