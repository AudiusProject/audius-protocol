from datetime import datetime, timedelta
from src.models import AppNameMetrics
from src.queries.get_app_name_metrics import get_app_name_metrics


def test_get_app_name_metrics(db_mock):
    """Tests that the route metrics are queried correctly from db data"""

    date = datetime.utcnow()
    before_date = (date + timedelta(hours=-1))
    after_date = (date + timedelta(hours=1))

    date = datetime.utcnow()

    app_names = [{
        'application_name': 'joe',
        'count': 3,
        'timestamp': date
    }, {
        'application_name': 'joe',
        'count': 4,
        'timestamp': after_date
    }, {
        'application_name': 'mike',
        'count': 1,
        'timestamp': date
    }, {
        'application_name': 'ray',
        'count': 2,
        'timestamp': date
    }]

    AppNameMetrics.__table__.create(db_mock._engine)

    # Set up db state
    with db_mock.scoped_session() as session:
        app_name_rows = [AppNameMetrics(
            application_name=app_name['application_name'],
            count=app_name['count'],
            timestamp=app_name['timestamp']
        ) for app_name in app_names]

        session.bulk_save_objects(app_name_rows)

    app_name = 'joe'
    args_1 = {
        'limit': 10,
        'start_time': before_date
    }
    metrics_1 = get_app_name_metrics(app_name, args_1)

    assert len(metrics_1) == 2
    assert metrics_1[0]['count'] == 4
    assert metrics_1[1]['count'] == 3

    app_name = 'mike'
    args_2 = {
        'limit': 10,
        'start_time': before_date
    }
    metrics_2 = get_app_name_metrics(app_name, args_2)

    assert len(metrics_2) == 1
    assert metrics_2[0]['count'] == 1
