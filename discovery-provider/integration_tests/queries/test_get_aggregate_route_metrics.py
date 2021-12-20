from datetime import date, timedelta
from src.models import (
    AggregateDailyUniqueUsersMetrics,
    AggregateDailyTotalUsersMetrics,
    AggregateMonthlyUniqueUsersMetrics,
    AggregateMonthlyTotalUsersMetrics,
)
from src.queries.get_route_metrics import _get_aggregate_route_metrics
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)


def test_get_aggregate_route_metrics_week(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, summed_count=2, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, summed_count=3, timestamp=yesterday - timedelta(days=1)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, summed_count=4, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, summed_count=5, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, timestamp=yesterday - timedelta(days=1)
                ),
                AggregateDailyTotalUsersMetrics(count=6, timestamp=yesterday),
                AggregateDailyTotalUsersMetrics(count=8, timestamp=today),
            ]
        )

        aggregate_metrics = _get_aggregate_route_metrics(session, "week", "day")

        assert len(aggregate_metrics) == 2
        assert aggregate_metrics[0]["unique_count"] == 2
        assert aggregate_metrics[0]["summed_unique_count"] == 3
        assert aggregate_metrics[0]["total_count"] == 4
        assert aggregate_metrics[1]["unique_count"] == 3
        assert aggregate_metrics[1]["summed_unique_count"] == 4
        assert aggregate_metrics[1]["total_count"] == 6


def test_get_aggregate_route_metrics_month_daily_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, summed_count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, summed_count=3, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, summed_count=4, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, summed_count=5, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(count=6, timestamp=yesterday),
                AggregateDailyTotalUsersMetrics(count=8, timestamp=today),
            ]
        )

        aggregate_metrics = _get_aggregate_route_metrics(session, "month", "day")

        assert len(aggregate_metrics) == 2
        assert aggregate_metrics[0]["unique_count"] == 2
        assert aggregate_metrics[0]["summed_unique_count"] == 3
        assert aggregate_metrics[0]["total_count"] == 4
        assert aggregate_metrics[1]["unique_count"] == 3
        assert aggregate_metrics[1]["summed_unique_count"] == 4
        assert aggregate_metrics[1]["total_count"] == 6


def test_get_aggregate_route_metrics_month_weekly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, summed_count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, summed_count=3, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, summed_count=4, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, summed_count=5, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(count=6, timestamp=yesterday),
                AggregateDailyTotalUsersMetrics(count=8, timestamp=today),
            ]
        )

        aggregate_metrics = _get_aggregate_route_metrics(session, "month", "week")

        assert len(aggregate_metrics) == 2
        assert aggregate_metrics[0]["unique_count"] == 2
        assert aggregate_metrics[0]["summed_unique_count"] == 3
        assert aggregate_metrics[0]["total_count"] == 4
        assert aggregate_metrics[1]["unique_count"] == 3
        assert aggregate_metrics[1]["summed_unique_count"] == 4
        assert aggregate_metrics[1]["total_count"] == 6


def test_get_aggregate_route_metrics_all_time_monthly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateMonthlyUniqueUsersMetrics(
                    count=1, summed_count=2, timestamp=today - timedelta(days=367)
                ),
                AggregateMonthlyUniqueUsersMetrics(
                    count=2, summed_count=3, timestamp=today - timedelta(days=100)
                ),
                AggregateMonthlyUniqueUsersMetrics(
                    count=3, summed_count=4, timestamp=today
                ),
                AggregateMonthlyTotalUsersMetrics(
                    count=2, timestamp=today - timedelta(days=367)
                ),
                AggregateMonthlyTotalUsersMetrics(
                    count=4, timestamp=today - timedelta(days=100)
                ),
                AggregateMonthlyTotalUsersMetrics(count=6, timestamp=today),
            ]
        )

        aggregate_metrics = _get_aggregate_route_metrics(session, "all_time", "month")

        assert len(aggregate_metrics) == 2
        assert aggregate_metrics[0]["unique_count"] == 1
        assert aggregate_metrics[0]["summed_unique_count"] == 2
        assert aggregate_metrics[0]["total_count"] == 2
        assert aggregate_metrics[1]["unique_count"] == 2
        assert aggregate_metrics[1]["summed_unique_count"] == 3
        assert aggregate_metrics[1]["total_count"] == 4


def test_get_aggregate_route_metrics_all_time_weekly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, summed_count=2, timestamp=today - timedelta(days=367)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, summed_count=3, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, summed_count=4, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, timestamp=today - timedelta(days=367)
                ),
                AggregateDailyTotalUsersMetrics(count=4, timestamp=yesterday),
                AggregateDailyTotalUsersMetrics(count=6, timestamp=today),
            ]
        )

        aggregate_metrics = _get_aggregate_route_metrics(session, "all_time", "week")

        assert len(aggregate_metrics) == 2
        assert aggregate_metrics[0]["unique_count"] == 1
        assert aggregate_metrics[0]["summed_unique_count"] == 2
        assert aggregate_metrics[0]["total_count"] == 2
        assert aggregate_metrics[1]["unique_count"] == 2
        assert aggregate_metrics[1]["summed_unique_count"] == 3
        assert aggregate_metrics[1]["total_count"] == 4
