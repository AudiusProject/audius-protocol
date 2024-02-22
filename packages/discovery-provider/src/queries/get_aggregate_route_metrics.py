import functools as ft
import logging
from datetime import date, timedelta

from sqlalchemy import asc, func

from src import exceptions
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


def get_aggregate_route_metrics(time_range, bucket_size):
    """
    Returns a list of timestamps with unique count and total count for all routes
    based on given time range and grouped by bucket size

    Returns:
        [{ timestamp, unique_count, total_count }]
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_aggregate_route_metrics(session, time_range, bucket_size)


def _get_aggregate_route_metrics(session, time_range, bucket_size):
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)
    one_year_ago = today - timedelta(days=365)
    first_day_of_month = today.replace(day=1)

    if time_range == "week":
        if bucket_size == "day":
            unique_counts = (
                session.query(
                    AggregateDailyUniqueUsersMetrics.timestamp,
                    AggregateDailyUniqueUsersMetrics.count,
                    AggregateDailyUniqueUsersMetrics.summed_count,
                )
                .filter(seven_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
                .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    AggregateDailyTotalUsersMetrics.timestamp,
                    AggregateDailyTotalUsersMetrics.count,
                )
                .filter(seven_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
                .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        raise exceptions.ArgumentError("Invalid bucket_size for time_range")
    if time_range == "month":
        if bucket_size == "day":
            unique_counts = (
                session.query(
                    AggregateDailyUniqueUsersMetrics.timestamp,
                    AggregateDailyUniqueUsersMetrics.count,
                    AggregateDailyUniqueUsersMetrics.summed_count,
                )
                .filter(thirty_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
                .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    AggregateDailyTotalUsersMetrics.timestamp,
                    AggregateDailyTotalUsersMetrics.count,
                )
                .filter(thirty_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
                .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        if bucket_size == "week":
            unique_counts = (
                session.query(
                    func.date_trunc(
                        bucket_size, AggregateDailyUniqueUsersMetrics.timestamp
                    ).label("timestamp"),
                    func.sum(AggregateDailyUniqueUsersMetrics.count).label("count"),
                    func.sum(AggregateDailyUniqueUsersMetrics.summed_count).label(
                        "summed_count"
                    ),
                )
                .filter(thirty_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
                .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
                .group_by(
                    func.date_trunc(
                        bucket_size, AggregateDailyUniqueUsersMetrics.timestamp
                    )
                )
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    func.date_trunc(
                        bucket_size, AggregateDailyTotalUsersMetrics.timestamp
                    ).label("timestamp"),
                    func.sum(AggregateDailyTotalUsersMetrics.count).label("count"),
                )
                .filter(thirty_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
                .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
                .group_by(
                    func.date_trunc(
                        bucket_size, AggregateDailyTotalUsersMetrics.timestamp
                    )
                )
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        raise exceptions.ArgumentError("Invalid bucket_size for time_range")
    if time_range == "year":
        if bucket_size == "month":
            unique_counts = (
                session.query(
                    AggregateMonthlyUniqueUsersMetric.timestamp,
                    AggregateMonthlyUniqueUsersMetric.count,
                    AggregateMonthlyUniqueUsersMetric.summed_count,
                )
                .filter(
                    AggregateMonthlyUniqueUsersMetric.timestamp < first_day_of_month
                )
                .filter(one_year_ago <= AggregateMonthlyUniqueUsersMetric.timestamp)
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    AggregateMonthlyTotalUsersMetric.timestamp,
                    AggregateMonthlyTotalUsersMetric.count,
                )
                .filter(AggregateMonthlyTotalUsersMetric.timestamp < first_day_of_month)
                .filter(one_year_ago <= AggregateMonthlyTotalUsersMetric.timestamp)
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        raise exceptions.ArgumentError("Invalid bucket_size for time_range")
    if time_range == "all_time":
        if bucket_size == "month":
            unique_counts = (
                session.query(
                    AggregateMonthlyUniqueUsersMetric.timestamp,
                    AggregateMonthlyUniqueUsersMetric.count,
                    AggregateMonthlyUniqueUsersMetric.summed_count,
                )
                .filter(
                    AggregateMonthlyUniqueUsersMetric.timestamp < first_day_of_month
                )
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    AggregateMonthlyTotalUsersMetric.timestamp,
                    AggregateMonthlyTotalUsersMetric.count,
                )
                .filter(AggregateMonthlyTotalUsersMetric.timestamp < first_day_of_month)
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        if bucket_size == "week":
            unique_counts = (
                session.query(
                    func.date_trunc(
                        bucket_size, AggregateDailyUniqueUsersMetrics.timestamp
                    ).label("timestamp"),
                    func.sum(AggregateDailyUniqueUsersMetrics.count).label("count"),
                    func.sum(AggregateDailyUniqueUsersMetrics.summed_count).label(
                        "summed_count"
                    ),
                )
                .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
                .group_by(
                    func.date_trunc(
                        bucket_size, AggregateDailyUniqueUsersMetrics.timestamp
                    )
                )
                .order_by(asc("timestamp"))
                .all()
            )
            unique_count_records = ft.reduce(
                lambda acc, curr: acc.update(
                    {str(curr[0]): {"unique": curr[1], "summed_unique": curr[2] or 0}}
                )
                or acc,
                unique_counts,
                {},
            )

            total_counts = (
                session.query(
                    func.date_trunc(
                        bucket_size, AggregateDailyTotalUsersMetrics.timestamp
                    ).label("timestamp"),
                    func.sum(AggregateDailyTotalUsersMetrics.count).label("count"),
                )
                .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
                .group_by(
                    func.date_trunc(
                        bucket_size, AggregateDailyTotalUsersMetrics.timestamp
                    )
                )
                .order_by(asc("timestamp"))
                .all()
            )
            total_count_records = ft.reduce(
                lambda acc, curr: acc.update({str(curr[0]): curr[1]}) or acc,
                total_counts,
                {},
            )

            metrics = []
            for timestamp, counts in unique_count_records.items():
                if timestamp in total_count_records:
                    metrics.append(
                        {
                            "timestamp": timestamp,
                            "unique_count": counts["unique"],
                            "summed_unique_count": counts["summed_unique"],
                            "total_count": total_count_records[timestamp],
                        }
                    )
            return metrics
        raise exceptions.ArgumentError("Invalid bucket_size for time_range")
    raise exceptions.ArgumentError("Invalid time_range")
