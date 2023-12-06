from datetime import date, timedelta

from src.models.metrics.aggregate_daily_total_users_metrics import (
    AggregateDailyTotalUsersMetrics,
)
from src.models.metrics.aggregate_daily_unique_users_metrics import (
    AggregateDailyUniqueUsersMetrics,
)
from src.models.metrics.aggregate_monthly_total_users_metrics import (
    AggregateMonthlyTotalUsersMetric,
)
from src.models.metrics.aggregate_monthly_unique_users_metrics import (
    AggregateMonthlyUniqueUsersMetric,
)
from src.queries.get_personal_route_metrics import _get_personal_route_metrics
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)


def test_get_personal_route_metrics_week(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, personal_count=2, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, personal_count=1, timestamp=yesterday - timedelta(days=1)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, personal_count=3, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, personal_count=2, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, personal_count=1, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, personal_count=4, timestamp=yesterday - timedelta(days=1)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=6, personal_count=5, timestamp=yesterday
                ),
                AggregateDailyTotalUsersMetrics(
                    count=8, personal_count=8, timestamp=today
                ),
            ]
        )

        personal_metrics = _get_personal_route_metrics(session, "week", "day")

        assert len(personal_metrics) == 2
        assert personal_metrics[0]["unique_count"] == 1
        assert personal_metrics[0]["total_count"] == 4
        assert personal_metrics[1]["unique_count"] == 3
        assert personal_metrics[1]["total_count"] == 5


def test_get_personal_route_metrics_month_daily_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, personal_count=1, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, personal_count=1, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, personal_count=2, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, personal_count=5, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, personal_count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, personal_count=3, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=6, personal_count=6, timestamp=yesterday
                ),
                AggregateDailyTotalUsersMetrics(
                    count=8, personal_count=5, timestamp=today
                ),
            ]
        )

        personal_metrics = _get_personal_route_metrics(session, "month", "day")

        assert len(personal_metrics) == 2
        assert personal_metrics[0]["unique_count"] == 1
        assert personal_metrics[0]["total_count"] == 3
        assert personal_metrics[1]["unique_count"] == 2
        assert personal_metrics[1]["total_count"] == 6


def test_get_personal_route_metrics_month_weekly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=2, personal_count=1, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, personal_count=2, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, personal_count=3, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=4, personal_count=4, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, personal_count=2, timestamp=today - timedelta(days=31)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, personal_count=3, timestamp=today - timedelta(days=8)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=6, personal_count=6, timestamp=yesterday
                ),
                AggregateDailyTotalUsersMetrics(
                    count=8, personal_count=7, timestamp=today
                ),
            ]
        )

        personal_metrics = _get_personal_route_metrics(session, "month", "week")

        assert len(personal_metrics) == 2
        assert personal_metrics[0]["unique_count"] == 2
        assert personal_metrics[0]["total_count"] == 3
        assert personal_metrics[1]["unique_count"] == 3
        assert personal_metrics[1]["total_count"] == 6


def test_get_personal_route_metrics_all_time_monthly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateMonthlyUniqueUsersMetric(
                    count=1, personal_count=1, timestamp=today - timedelta(days=367)
                ),
                AggregateMonthlyUniqueUsersMetric(
                    count=2, personal_count=2, timestamp=today - timedelta(days=100)
                ),
                AggregateMonthlyUniqueUsersMetric(
                    count=3, personal_count=3, timestamp=today
                ),
                AggregateMonthlyTotalUsersMetric(
                    count=2, personal_count=2, timestamp=today - timedelta(days=367)
                ),
                AggregateMonthlyTotalUsersMetric(
                    count=4, personal_count=3, timestamp=today - timedelta(days=100)
                ),
                AggregateMonthlyTotalUsersMetric(
                    count=6, personal_count=4, timestamp=today
                ),
            ]
        )

        personal_metrics = _get_personal_route_metrics(session, "all_time", "month")

        assert len(personal_metrics) == 2
        assert personal_metrics[0]["unique_count"] == 1
        assert personal_metrics[0]["total_count"] == 2
        assert personal_metrics[1]["unique_count"] == 2
        assert personal_metrics[1]["total_count"] == 3


def test_get_personal_route_metrics_all_time_weekly_bucket(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyUniqueUsersMetrics(
                    count=1, personal_count=1, timestamp=today - timedelta(days=367)
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=2, personal_count=2, timestamp=yesterday
                ),
                AggregateDailyUniqueUsersMetrics(
                    count=3, personal_count=3, timestamp=today
                ),
                AggregateDailyTotalUsersMetrics(
                    count=2, personal_count=1, timestamp=today - timedelta(days=367)
                ),
                AggregateDailyTotalUsersMetrics(
                    count=4, personal_count=3, timestamp=yesterday
                ),
                AggregateDailyTotalUsersMetrics(
                    count=6, personal_count=6, timestamp=today
                ),
            ]
        )

        personal_metrics = _get_personal_route_metrics(session, "all_time", "week")

        assert len(personal_metrics) == 2
        assert personal_metrics[0]["unique_count"] == 1
        assert personal_metrics[0]["total_count"] == 1
        assert personal_metrics[1]["unique_count"] == 2
        assert personal_metrics[1]["total_count"] == 3
