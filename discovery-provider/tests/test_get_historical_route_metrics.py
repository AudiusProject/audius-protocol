from datetime import date, timedelta
from src.models import AggregateDailyUniqueUsersMetrics, AggregateDailyTotalUsersMetrics, \
    AggregateMonthlyUniqueUsersMetrics, AggregateMonthlyTotalUsersMetrics
from src.queries.get_route_metrics import _get_historical_route_metrics
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)
thirty_days_ago = today - timedelta(days=30)

def test_get_historical_route_metrics(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects([
            AggregateDailyUniqueUsersMetrics(
                count=1,
                summed_count=2,
                timestamp=thirty_days_ago - timedelta(days=1)
            ),
            AggregateDailyUniqueUsersMetrics(
                count=2,
                summed_count=3,
                timestamp=thirty_days_ago
            ),
            AggregateDailyUniqueUsersMetrics(
                count=3,
                summed_count=4,
                timestamp=yesterday
            ),
            AggregateDailyUniqueUsersMetrics(
                count=4,
                summed_count=5,
                timestamp=today
            ),
            AggregateDailyTotalUsersMetrics(
                count=2,
                timestamp=thirty_days_ago - timedelta(days=1)
            ),
            AggregateDailyTotalUsersMetrics(
                count=4,
                timestamp=thirty_days_ago
            ),
            AggregateDailyTotalUsersMetrics(
                count=6,
                timestamp=yesterday
            ),
            AggregateDailyTotalUsersMetrics(
                count=8,
                timestamp=today
            ),
            AggregateMonthlyUniqueUsersMetrics(
                count=1,
                summed_count=2,
                timestamp=today - timedelta(days=367)
            ),
            AggregateMonthlyUniqueUsersMetrics(
                count=2,
                summed_count=3,
                timestamp=today - timedelta(days=100)
            ),
            AggregateMonthlyUniqueUsersMetrics(
                count=3,
                summed_count=4,
                timestamp=today
            ),
            AggregateMonthlyTotalUsersMetrics(
                count=2,
                timestamp=today - timedelta(days=367)
            ),
            AggregateMonthlyTotalUsersMetrics(
                count=4,
                timestamp=today - timedelta(days=100)
            ),
            AggregateMonthlyTotalUsersMetrics(
                count=6,
                timestamp=today
            )
        ])

        aggregate_metrics = _get_historical_route_metrics(session)
        daily_aggregate_metrics = aggregate_metrics['daily']
        monthly_aggregate_metrics = aggregate_metrics['monthly']

        assert len(daily_aggregate_metrics.items()) == 2
        assert daily_aggregate_metrics[str(thirty_days_ago)]['unique_count'] == 2
        assert daily_aggregate_metrics[str(thirty_days_ago)]['summed_unique_count'] == 3
        assert daily_aggregate_metrics[str(thirty_days_ago)]['total_count'] == 4
        assert daily_aggregate_metrics[str(yesterday)]['unique_count'] == 3
        assert daily_aggregate_metrics[str(yesterday)]['summed_unique_count'] == 4
        assert daily_aggregate_metrics[str(yesterday)]['total_count'] == 6

        assert len(monthly_aggregate_metrics.items()) == 2
        assert monthly_aggregate_metrics[str(today - timedelta(days=367))]['unique_count'] == 1
        assert monthly_aggregate_metrics[str(today - timedelta(days=367))]['summed_unique_count'] == 2
        assert monthly_aggregate_metrics[str(today - timedelta(days=367))]['total_count'] == 2
        assert monthly_aggregate_metrics[str(today - timedelta(days=100))]['unique_count'] == 2
        assert monthly_aggregate_metrics[str(today - timedelta(days=100))]['summed_unique_count'] == 3
        assert monthly_aggregate_metrics[str(today - timedelta(days=100))]['total_count'] == 4
