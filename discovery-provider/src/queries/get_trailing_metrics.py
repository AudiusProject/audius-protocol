import logging
from sqlalchemy import desc
from src.models import RouteMetricsTrailingMonth, AppMetricsTrailingWeek, AppMetricsTrailingMonth, AppMetricsAllTime
from src.utils import db_session
from src import exceptions

logger = logging.getLogger(__name__)

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
    elif time_range == "month":
        query = session.query(AppMetricsTrailingMonth)
    elif time_range == "all_time":
        query = session.query(AppMetricsAllTime)
    else:
        raise exceptions.ArgumentError("Invalid time_range")

    query = (query
             .order_by(desc('count'))
             .limit(limit)
             .all())

    metrics = list(map(lambda m: {"name": m.name, "count": m.count}, query))
    return metrics
