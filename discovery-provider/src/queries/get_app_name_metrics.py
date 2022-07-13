import logging
import time
from datetime import date, timedelta

from sqlalchemy import asc, desc, func
from src import exceptions
from src.models.metrics.aggregate_daily_app_name_metrics import (
    AggregateDailyAppNameMetric,
)
from src.models.metrics.aggregate_monthly_app_name_metrics import (
    AggregateMonthlyAppNameMetric,
)
from src.models.metrics.app_name_metrics import AppNameMetric
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_historical_app_metrics():
    """
    Returns daily metrics for the last thirty days and all time monthly metrics

    Returns:
        {
            daily: {
                2021/01/15: {app1: ..., app2: ...}
                ...
            },
            monthly: {
                2021/01/01: {app1: ..., app2: ...}
                ...
            }
        }
    """

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_historical_app_metrics(session)


def _get_historical_app_metrics(session, min_count=100):
    """
    gets historical app metrics monthly and daily request counts.

    Args:
        session: Database session
        min_count: Minimum count an app must have in order to be returned
    """
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    first_day_of_month = today.replace(day=1)

    daily_query = (
        session.query(
            AggregateDailyAppNameMetric.timestamp,
            AggregateDailyAppNameMetric.application_name,
            AggregateDailyAppNameMetric.count,
        )
        .filter(min_count <= AggregateDailyAppNameMetric.count)
        .filter(thirty_days_ago <= AggregateDailyAppNameMetric.timestamp)
        .filter(AggregateDailyAppNameMetric.timestamp < today)
        .all()
    )
    daily_metrics = {}
    for attribute in daily_query:
        day = str(attribute[0])
        if day not in daily_metrics:
            daily_metrics[day] = {attribute[1]: attribute[2]}
        else:
            daily_metrics[day][attribute[1]] = attribute[2]

    monthly_query = (
        session.query(
            AggregateMonthlyAppNameMetric.timestamp,
            AggregateMonthlyAppNameMetric.application_name,
            AggregateMonthlyAppNameMetric.count,
        )
        .filter(min_count <= AggregateMonthlyAppNameMetric.count)
        .filter(AggregateMonthlyAppNameMetric.timestamp < first_day_of_month)
        .all()
    )
    monthly_metrics = {}
    for attribute in monthly_query:
        month = str(attribute[0])
        if month not in monthly_metrics:
            monthly_metrics[month] = {attribute[1]: attribute[2]}
        else:
            monthly_metrics[month][attribute[1]] = attribute[2]

    return {"daily": daily_metrics, "monthly": monthly_metrics}


def get_aggregate_app_metrics(time_range, limit):
    """
    Returns app name metrics for a given time range

    Args:
        time_range: one of "week", "month", "all_time"
        limit: number The max number of apps to return
    Returns:
        [{ name: string, count: number }, ...]
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_aggregate_app_metrics(session, time_range, limit)


def _get_aggregate_app_metrics(session, time_range, limit):
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)

    if time_range == "week":
        query = (
            session.query(
                AggregateDailyAppNameMetric.application_name,
                func.sum(AggregateDailyAppNameMetric.count).label("count"),
            )
            .filter(seven_days_ago <= AggregateDailyAppNameMetric.timestamp)
            .filter(AggregateDailyAppNameMetric.timestamp < today)
            .group_by(AggregateDailyAppNameMetric.application_name)
            .order_by(desc("count"), asc(AggregateDailyAppNameMetric.application_name))
            .limit(limit)
            .all()
        )
    elif time_range == "month":
        query = (
            session.query(
                AggregateDailyAppNameMetric.application_name,
                func.sum(AggregateDailyAppNameMetric.count).label("count"),
            )
            .filter(thirty_days_ago <= AggregateDailyAppNameMetric.timestamp)
            .filter(AggregateDailyAppNameMetric.timestamp < today)
            .group_by(AggregateDailyAppNameMetric.application_name)
            .order_by(desc("count"), asc(AggregateDailyAppNameMetric.application_name))
            .limit(limit)
            .all()
        )
    elif time_range == "all_time":
        query = (
            session.query(
                AggregateMonthlyAppNameMetric.application_name,
                func.sum(AggregateMonthlyAppNameMetric.count).label("count"),
            )
            .filter(AggregateMonthlyAppNameMetric.timestamp < today)
            .group_by(AggregateMonthlyAppNameMetric.application_name)
            .order_by(
                desc("count"), asc(AggregateMonthlyAppNameMetric.application_name)
            )
            .limit(limit)
            .all()
        )
    else:
        raise exceptions.ArgumentError("Invalid time_range")

    return [{"name": item[0], "count": item[1]} for item in query]


def get_app_name_metrics(app_name, args):
    """
    Returns the usage metrics for a specified app_name

    Args:
        app_name: string The name of the app to query for metrics
        args: dict The parsed args from the request
        args.start_time: date The date to start the query from
        args.limit: number The max number of metrics to return
        args.bucket_size: string A date_trunc operation to aggregate timestamps by

    Returns:
        Array of dictionaries with the timestamp, count, and unique_count
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_app_name_metrics(session, app_name, args)


def _get_app_name_metrics(session, app_name, args):
    metrics = (
        session.query(
            func.date_trunc(args.get("bucket_size"), AppNameMetric.timestamp).label(
                "timestamp"
            ),
            func.sum(AppNameMetric.count).label("count"),
            func.count(AppNameMetric.ip.distinct()).label("unique_count"),
        )
        .filter(
            AppNameMetric.application_name == app_name,
            AppNameMetric.timestamp > args.get("start_time"),
        )
        .group_by(func.date_trunc(args.get("bucket_size"), AppNameMetric.timestamp))
        .order_by(desc("timestamp"))
        .limit(args.get("limit"))
        .all()
    )

    metrics = [
        {
            "timestamp": int(time.mktime(m[0].timetuple())),
            "count": m[1],
            "unique_count": m[2],
        }
        for m in metrics
    ]

    return metrics
