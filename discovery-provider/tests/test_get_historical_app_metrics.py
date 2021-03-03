from datetime import date, timedelta
from src.models import AggregateDailyAppNameMetrics, AggregateMonthlyAppNameMetrics
from src.queries.get_app_name_metrics import _get_historical_app_metrics
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)
thirty_days_ago = today - timedelta(days=30)

def test_get_historical_app_metrics(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects([
            AggregateDailyAppNameMetrics(
                application_name='top-app',
                count=1,
                timestamp=thirty_days_ago - timedelta(days=1)
            ),
            AggregateDailyAppNameMetrics(
                application_name='top-app',
                count=2,
                timestamp=thirty_days_ago
            ),
            AggregateDailyAppNameMetrics(
                application_name='best-app',
                count=3,
                timestamp=yesterday
            ),
            AggregateDailyAppNameMetrics(
                application_name='best-app',
                count=4,
                timestamp=today
            ),
            AggregateMonthlyAppNameMetrics(
                application_name='top-app',
                count=2,
                timestamp=today - timedelta(days=367)
            ),
            AggregateMonthlyAppNameMetrics(
                application_name='best-app',
                count=4,
                timestamp=yesterday
            ),
            AggregateMonthlyAppNameMetrics(
                application_name='top-app',
                count=6,
                timestamp=today
            )
        ])

        aggregate_metrics = _get_historical_app_metrics(session)
        daily_aggregate_metrics = aggregate_metrics['daily']
        monthly_aggregate_metrics = aggregate_metrics['monthly']

        assert len(daily_aggregate_metrics.items()) == 2
        assert daily_aggregate_metrics[str(thirty_days_ago)]['top-app'] == 2
        assert daily_aggregate_metrics[str(yesterday)]['best-app'] == 3

        assert len(daily_aggregate_metrics.items()) == 2
        assert monthly_aggregate_metrics[str(today - timedelta(days=367))]['top-app'] == 2
        assert monthly_aggregate_metrics[str(yesterday)]['best-app'] == 4
