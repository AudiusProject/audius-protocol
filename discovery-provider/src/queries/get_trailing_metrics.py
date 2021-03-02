import logging
from functools import reduce
from datetime import date, timedelta
from sqlalchemy import desc, func
from src.models import RouteMetricsTrailingWeek, RouteMetricsTrailingMonth, RouteMetricsAllTime, \
    AppMetricsTrailingWeek, AppMetricsTrailingMonth, AppMetricsAllTime, AggregateDailyUniqueUsersMetrics, \
    AggregateDailyTotalUsersMetrics
from src.utils import db_session
from src import exceptions

logger = logging.getLogger(__name__)

def get_aggregate_route_metrics_trailing_month():
    """
    Returns trailing count and unique count for all routes in the last month

    Returns:
        { count, unique_count }
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)

        unique_count = (
            session.query(func.sum(AggregateDailyUniqueUsersMetrics.count))
            .filter(thirty_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
            .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
            .first()
        )
        logger.info(f"trailing month unique count: {unique_count}")

        total_count = (
            session.query(func.sum(AggregateDailyTotalUsersMetrics.count))
            .filter(thirty_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
            .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
            .first()
        )
        logger.info(f"trailing month total count: {total_count}")

        return {
            "unique_count": unique_count[0],
            "count": total_count[0]
        }

def get_monthly_trailing_route_metrics():
    """
    Returns trailing count and unique count for all routes in the last month,
    calculated from the RouteMetricsTrailingMonth matview.

    Returns:
        { count, unique_count }
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        metrics = session.query(RouteMetricsTrailingMonth).all()
        return {
            "count": metrics[0].count,
            "unique_count": metrics[0].unique_count
        }

def get_trailing_app_metrics(args):
    """
    Returns trailing app_name metrics for a given time period.

    Args:
        args: dict The parsed args from the request
        args.limit: number The max number of apps to return
        args.time_range: one of "week", "month", "all_time"
    Returns:
        [{ name: string, count: number }, ...]
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_trailing_app_metrics(session, args)


def _get_trailing_app_metrics(session, args):
    limit, time_range = args.get("limit"), args.get("time_range")

    if time_range == "week":
        query = session.query(AppMetricsTrailingWeek)
        route_query = session.query(RouteMetricsTrailingWeek)
    elif time_range == "month":
        query = session.query(AppMetricsTrailingMonth)
        route_query = session.query(RouteMetricsTrailingMonth)
    elif time_range == "all_time":
        query = session.query(AppMetricsAllTime)
        route_query = session.query(RouteMetricsAllTime)
    else:
        raise exceptions.ArgumentError("Invalid time_range")

    query = (query
             .order_by(desc('count'))
             .limit(limit)
             .all())

    route_query = route_query.first()

    metrics = list(map(lambda m: {"name": m.name, "count": m.count}, query))

    # add unknown count, inserted sorted by count
    existing_count = reduce(lambda x, y: x + y["count"], metrics, 0)
    unknown_count = route_query.count - existing_count
    for i, metric in enumerate(metrics[:]):
        if unknown_count > metric['count'] or i == len(metrics):
            metrics.insert(i, {
                'name': 'unknown',
                'count': unknown_count,
            })
            break

    return metrics
