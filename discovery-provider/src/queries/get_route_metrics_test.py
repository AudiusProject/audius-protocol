from datetime import datetime, timedelta
from src.models import RouteMetrics
from src.queries.get_route_metrics import get_route_metrics


def test_get_route_metrics(db_mock):
    """Tests that the route metrics are queried correctly from db data"""

    date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    before_all_date = (date + timedelta(hours=-2))
    before_date = (date + timedelta(hours=-1))

    route_metrics = [{
        'version': '1',
        'route_path': 'tracks/some_hash',
        'query_string': '',
        'count': 3,
        'timestamp': before_date
    }, {
        'version': '1',
        'route_path': 'tracks/some_hash',
        'query_string': 'with_users=true',
        'count': 2,
        'timestamp': before_date
    }, {
        'version': '1',
        'route_path': 'tracks/some_hash/stream',
        'query_string': '',
        'count': 4,
        'timestamp': before_date
    }]

    RouteMetrics.__table__.create(db_mock._engine)

    # Set up db state
    with db_mock.scoped_session() as session:
        route_metric_obj = [RouteMetrics(
            version=metric['version'],
            route_path=metric['route_path'],
            query_string=metric['query_string'],
            count=metric['count'],
            timestamp=metric['timestamp']
        ) for metric in route_metrics]

        session.bulk_save_objects(route_metric_obj)

    args_1 = {
        'limit': 10,
        'start_time': before_all_date,
        'path': 'tracks/some_hash',
        'exact': True
    }
    metrics_1 = get_route_metrics(args_1)

    assert len(metrics_1) == 1
    assert metrics_1[0]['count'] == 5

    args_2 = {
        'limit': 10,
        'start_time': before_all_date,
        'path': 'tracks/some_hash',
        'exact': False
    }
    metrics_2 = get_route_metrics(args_2)

    assert len(metrics_2) == 1
    assert metrics_2[0]['count'] == 9

    args_3 = {
        'limit': 10,
        'start_time': before_all_date,
        'path': 'tracks/some_hash',
        'query_string': 'with_users=true',
        'exact': False
    }
    metrics_3 = get_route_metrics(args_3)

    assert len(metrics_3) == 1
    assert metrics_3[0]['count'] == 2

    args_4 = {
        'limit': 10,
        'start_time': before_all_date,
        'path': 'tracks/some_hash',
        'query_string': 'with_users=WRONG',
        'exact': False
    }
    metrics_4 = get_route_metrics(args_4)

    assert not metrics_4
