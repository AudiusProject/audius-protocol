from datetime import date, timedelta

from src.models.metrics.aggregate_daily_app_name_metrics import (
    AggregateDailyAppNameMetric,
)
from src.models.metrics.aggregate_monthly_app_name_metrics import (
    AggregateMonthlyAppNameMetric,
)
from src.queries.get_app_name_metrics import _get_aggregate_app_metrics
from src.utils.db_session import get_db

limit = 2
today = date.today()
yesterday = today - timedelta(days=1)


def test_get_aggregate_app_metrics_week(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-too-old",
                    count=3,
                    timestamp=today - timedelta(days=8),
                ),
                AggregateDailyAppNameMetric(
                    application_name="top-app",
                    count=4,
                    timestamp=yesterday - timedelta(days=1),
                ),
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-outside-limit",
                    count=1,
                    timestamp=yesterday,
                ),
                AggregateDailyAppNameMetric(
                    application_name="best-app", count=5, timestamp=yesterday
                ),
                AggregateDailyAppNameMetric(
                    application_name="top-app", count=3, timestamp=yesterday
                ),
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-too-recent",
                    count=3,
                    timestamp=today,
                ),
            ]
        )

        aggregate_metrics = _get_aggregate_app_metrics(session, "week", limit)

        assert len(aggregate_metrics) == limit
        assert aggregate_metrics[0]["name"] == "top-app"
        assert aggregate_metrics[0]["count"] == 7
        assert aggregate_metrics[1]["name"] == "best-app"
        assert aggregate_metrics[1]["count"] == 5


def test_get_aggregate_app_metrics_month(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-too-old",
                    count=20,
                    timestamp=today - timedelta(days=31),
                ),
                AggregateDailyAppNameMetric(
                    application_name="best-app",
                    count=20,
                    timestamp=today - timedelta(days=31),
                ),
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-outside-limit",
                    count=1,
                    timestamp=yesterday,
                ),
                AggregateDailyAppNameMetric(
                    application_name="top-app",
                    count=5,
                    timestamp=yesterday - timedelta(days=8),
                ),
                AggregateDailyAppNameMetric(
                    application_name="best-app", count=5, timestamp=yesterday
                ),
                AggregateDailyAppNameMetric(
                    application_name="top-app", count=7, timestamp=yesterday
                ),
                AggregateDailyAppNameMetric(
                    application_name="will-not-return-because-too-recent",
                    count=20,
                    timestamp=today,
                ),
            ]
        )

        aggregate_metrics = _get_aggregate_app_metrics(session, "month", limit)

        assert len(aggregate_metrics) == limit
        assert aggregate_metrics[0]["name"] == "top-app"
        assert aggregate_metrics[0]["count"] == 12
        assert aggregate_metrics[1]["name"] == "best-app"
        assert aggregate_metrics[1]["count"] == 5


def test_get_aggregate_app_metrics_all_time(app):
    with app.app_context():
        db_mock = get_db()

    with db_mock.scoped_session() as session:
        session.bulk_save_objects(
            [
                AggregateMonthlyAppNameMetric(
                    application_name="awesome-app",
                    count=6,
                    timestamp=today - timedelta(days=367),
                ),
                AggregateMonthlyAppNameMetric(
                    application_name="will-not-return-because-outside-limit",
                    count=1,
                    timestamp=yesterday,
                ),
                AggregateMonthlyAppNameMetric(
                    application_name="best-app", count=5, timestamp=yesterday
                ),
                AggregateMonthlyAppNameMetric(
                    application_name="top-app", count=15, timestamp=yesterday
                ),
                AggregateMonthlyAppNameMetric(
                    application_name="awesome-app", count=7, timestamp=yesterday
                ),
                AggregateMonthlyAppNameMetric(
                    application_name="will-not-return-because-too-recent",
                    count=20,
                    timestamp=today,
                ),
            ]
        )

        aggregate_metrics = _get_aggregate_app_metrics(session, "all_time", limit)

        assert len(aggregate_metrics) == limit
        assert aggregate_metrics[0]["name"] == "top-app"
        assert aggregate_metrics[0]["count"] == 15
        assert aggregate_metrics[1]["name"] == "awesome-app"
        assert aggregate_metrics[1]["count"] == 13
