from datetime import date, timedelta
from src.models import AggregateDailyUniqueUsersMetrics, AggregateDailyTotalUsersMetrics
from src.queries.get_trailing_metrics import _get_aggregate_route_metrics_trailing_month
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)

def test_get_aggregate_route_metrics_trailing_month(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects([
            AggregateDailyUniqueUsersMetrics(
                count=1,
                timestamp=today - timedelta(days=31)
            ),
            AggregateDailyUniqueUsersMetrics(
                count=2,
                timestamp=today - timedelta(days=30)
            ),
            AggregateDailyUniqueUsersMetrics(
                count=3,
                timestamp=yesterday
            ),
            AggregateDailyUniqueUsersMetrics(
                count=4,
                timestamp=today
            ),
            AggregateDailyTotalUsersMetrics(
                count=2,
                timestamp=today - timedelta(days=31)
            ),
            AggregateDailyTotalUsersMetrics(
                count=4,
                timestamp=today - timedelta(days=30)
            ),
            AggregateDailyTotalUsersMetrics(
                count=6,
                timestamp=yesterday
            ),
            AggregateDailyTotalUsersMetrics(
                count=8,
                timestamp=today
            )
        ])

        aggregate_metrics = _get_aggregate_route_metrics_trailing_month(session)

        assert aggregate_metrics['unique_count'] == 5
        assert aggregate_metrics['total_count'] == 10
