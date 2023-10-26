import time
from datetime import date, timedelta

from sqlalchemy import desc, func, or_

from src.models.metrics.route_metrics import RouteMetric
from src.models.metrics.route_metrics_day_matview import t_route_metrics_day_bucket
from src.models.metrics.route_metrics_month_matview import t_route_metrics_month_bucket
from src.utils import db_session

def get_route_metrics(args):
    """
    Returns the usage metrics for routes
    Args:
        args: dict The parsed args from the request
        args.path: string The route path of the query
        args.start_time: date The start of the query
        args.query_string: optional string The query string to filter on
        args.limit: number The max number of responses to return
        args.bucket_size: string  date_trunc operation to aggregate timestamps by
    Returns:
        Array of dictionaries with the route, timestamp, count, and unique_count
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_route_metrics(session, args)


def _make_metrics_tuple(metric):
    return {
        "timestamp": int(time.mktime(metric.time.timetuple())),
        "count": metric.count,
        "unique_count": metric.unique_count,
    }


def _get_route_metrics(session, args):
    # Protocol dashboard optimization:
    # If we're in 'simple' mode (only asking for day/month bucket, no path or query string),
    # query the corresponding matview instead of hitting the DB.
    is_simple_args = (
        args.get("path") == ""
        and args.get("query_string") == None
        and args.get("start_time")
        and args.get("exact") == False
        and args.get("version") == None
    )
    bucket_size = args.get("bucket_size")
    if is_simple_args and bucket_size in ["day", "month"]:
        query = None
        if bucket_size == "day":
            # subtract 1 day from the start_time so that the last day is fully complete
            query = session.query(t_route_metrics_day_bucket).filter(
                t_route_metrics_day_bucket.c.time
                > (args.get("start_time") - timedelta(days=1))
            )

        else:
            query = session.query(t_route_metrics_month_bucket).filter(
                t_route_metrics_month_bucket.c.time > (args.get("start_time"))
            )

        query = query.order_by(desc("time")).limit(args.get("limit")).all()
        metrics = list(map(_make_metrics_tuple, query))
        return metrics

    metrics_query = session.query(
        func.date_trunc(args.get("bucket_size"), RouteMetric.timestamp).label(
            "timestamp"
        ),
        func.sum(RouteMetric.count).label("count"),
        func.count(RouteMetric.ip.distinct()).label("unique_count"),
    ).filter(RouteMetric.timestamp > args.get("start_time"))
    if args.get("exact") == True:
        metrics_query = metrics_query.filter(RouteMetric.route_path == args.get("path"))
    else:
        metrics_query = metrics_query.filter(
            RouteMetric.route_path.like(f"{args.get('path')}%")
        )

    if args.get("query_string", None) != None:
        metrics_query = metrics_query.filter(
            or_(
                RouteMetric.query_string.like(f"%{args.get('query_string')}"),
                RouteMetric.query_string.like(f"%{args.get('query_string')}&%"),
            )
        )

    metrics_query = (
        metrics_query.group_by(
            func.date_trunc(args.get("bucket_size"), RouteMetric.timestamp)
        )
        .order_by(desc("timestamp"))
        .limit(args.get("limit"))
    )

    metrics = metrics_query.all()

    metrics = [
        {
            "timestamp": int(time.mktime(m[0].timetuple())),
            "count": m[1],
            "unique_count": m[2],
        }
        for m in metrics
    ]

    return metrics
