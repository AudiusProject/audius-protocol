from datetime import datetime, timedelta
from src.models import RouteMetrics
from src.queries.get_route_metrics import get_route_metrics


def populate_mock_db(db, date):
    """Helper function to populate the mock DB with route metrics"""
    mock_route_metrics = [{
        'version': '1',
        'route_path': 'tracks/some_hash',
        'query_string': '',
        'count': 3,
        'timestamp': date
    }, {
        'version': '1',
        'route_path': 'tracks/some_hash',
        'query_string': 'with_users=true',
        'count': 2,
        'timestamp': date
    }, {
        'version': '1',
        'route_path': 'tracks/some_hash/stream',
        'query_string': '',
        'count': 4,
        'timestamp': date
    }]

    RouteMetrics.__table__.create(db._engine)

    with db.scoped_session() as session:
        route_metric_obj = [RouteMetrics(
            version=metric['version'],
            route_path=metric['route_path'],
            query_string=metric['query_string'],
            count=metric['count'],
            timestamp=metric['timestamp']
        ) for metric in mock_route_metrics]

        session.bulk_save_objects(route_metric_obj)


def test_get_route_metrics(db_mock):
    """Tests that the route metrics can queried by exact path match"""

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_date = (date + timedelta(hours=-1))

    populate_mock_db(db_mock, date)

    args = {
        'limit': 10,
        'start_time': before_date,
        'path': 'tracks/some_hash',
        'exact': True
    }
    metrics = get_route_metrics(args)

    assert len(metrics) == 1
    assert metrics[0]['count'] == 5


def test_get_route_metrics(db_mock):
    """Tests that the route metrics can be queried by non-exact path match"""

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_date = (date + timedelta(hours=-1))

    populate_mock_db(db_mock, date)

    args = {
        'limit': 10,
        'start_time': before_date,
        'path': 'tracks/some_hash',
        'exact': False
    }
    metrics = get_route_metrics(args)

    assert len(metrics) == 1
    assert metrics[0]['count'] == 9


def test_get_route_metrics(db_mock):
    """Tests that the route metrics are queried with query_string parameter"""

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_date = (date + timedelta(hours=-1))

    populate_mock_db(db_mock, date)

    args = {
        'limit': 10,
        'start_time': before_date,
        'path': 'tracks/some_hash',
        'query_string': 'with_users=true',
        'exact': False
    }
    metrics = get_route_metrics(args)

    assert len(metrics) == 1
    assert metrics[0]['count'] == 2


def test_get_route_metrics(db_mock):
    """Tests that route metrics returns nothing if no matching query_string"""

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_date = (date + timedelta(hours=-1))

    populate_mock_db(db_mock, date)

    args = {
        'limit': 10,
        'start_time': before_date,
        'path': 'tracks/some_hash',
        'query_string': 'with_users=WRONG',
        'exact': False
    }
    metrics = get_route_metrics(args)

    assert not metrics
