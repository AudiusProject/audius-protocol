from datetime import datetime
from src.models import AppNameMetrics
from src.queries.get_app_names import get_app_names


def test_get_app_names(db_mock):
    """Tests that get_app_names returns the app names"""

    date = datetime.utcnow()

    app_names = [{
        'application_name': 'joe',
        'count': 3,
        'timestamp': date
    }, {
        'application_name': 'mike',
        'count': 2,
        'timestamp': date
    }, {
        'application_name': 'ray',
        'count': 2,
        'timestamp': date
    }]

    AppNameMetrics.__table__.create(db_mock._engine)

    # Set up db state
    with db_mock.scoped_session() as session:
        app_names = [AppNameMetrics(
            application_name=metric['application_name'],
            count=metric['count'],
            timestamp=metric['timestamp']
        ) for metric in app_names]

        session.bulk_save_objects(app_names)

    args = {
        'limit': 10,
        'offset': 0
    }
    app_names = get_app_names(args)

    assert len(app_names) == 3
    names = [app_name['name'] for app_name in app_names]
    assert 'joe' in names
    assert 'mike' in names
    assert 'ray' in names
