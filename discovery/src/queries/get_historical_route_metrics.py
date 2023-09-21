import functools as ft
import logging
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
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_historical_route_metrics():
    """
    Returns daily metrics for the last thirty days and all time monthly metrics

    Returns:
        {
            daily: {
                2021/01/15: {unique_count: ..., total_count: ...}
                ...
            },
            monthly: {
                2021/01/01: {unique_count: ..., total_count: ...}
                ...
            }
        }
    """

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_historical_route_metrics(session)


def _get_historical_route_metrics(session):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    first_day_of_month = today.replace(day=1)

    daily_metrics = {}
    unique_daily_counts = (
        session.query(
            AggregateDailyUniqueUsersMetrics.timestamp,
            AggregateDailyUniqueUsersMetrics.count,
            AggregateDailyUniqueUsersMetrics.summed_count,
        )
        .filter(thirty_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
        .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
        .all()
    )
    unique_daily_count_records = ft.reduce(
        lambda acc, curr: acc.update(
            {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
        )
        or acc,
        unique_daily_counts,
        {},
    )

    total_daily_counts = (
        session.query(
            AggregateDailyTotalUsersMetrics.timestamp,
            AggregateDailyTotalUsersMetrics.count,
        )
        .filter(thirty_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
        .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
        .all()
    )
    total_daily_count_records = ft.reduce(
        lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
        total_daily_counts,
        {},
    )

    for timestamp, counts in unique_daily_count_records.items():
        if timestamp in total_daily_count_records:
            daily_metrics[timestamp] = {
                "unique_count": counts["unique"],
                "summed_unique_count": counts["summed_unique"],
                "total_count": total_daily_count_records[timestamp],
            }

    monthly_metrics = {}
    unique_monthly_counts = (
        session.query(
            AggregateMonthlyUniqueUsersMetric.timestamp,
            AggregateMonthlyUniqueUsersMetric.count,
            AggregateMonthlyUniqueUsersMetric.summed_count,
        )
        .filter(AggregateMonthlyUniqueUsersMetric.timestamp < first_day_of_month)
        .all()
    )
    unique_monthly_count_records = ft.reduce(
        lambda acc, curr: acc.update(
            {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
        )
        or acc,
        unique_monthly_counts,
        {},
    )

    total_monthly_counts = (
        session.query(
            AggregateMonthlyTotalUsersMetric.timestamp,
            AggregateMonthlyTotalUsersMetric.count,
        )
        .filter(AggregateMonthlyTotalUsersMetric.timestamp < first_day_of_month)
        .all()
    )
    total_monthly_count_records = ft.reduce(
        lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
        total_monthly_counts,
        {},
    )

    for timestamp, counts in unique_monthly_count_records.items():
        if timestamp in total_monthly_count_records:
            monthly_metrics[timestamp] = {
                "unique_count": counts["unique"],
                "summed_unique_count": counts["summed_unique"],
                "total_count": total_monthly_count_records[timestamp],
            }

    return {"daily": daily_metrics, "monthly": monthly_metrics}
