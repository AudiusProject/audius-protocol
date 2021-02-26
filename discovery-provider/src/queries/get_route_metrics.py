import logging
import time
import functools as ft
from datetime import date, timedelta
from sqlalchemy import func, desc, or_
from src import exceptions
from src.models import RouteMetrics, RouteMetricsDayMatview, RouteMetricsMonthMatview, \
    DailyUniqueUsersMetrics, DailyTotalUsersMetrics, MonthlyUniqueUsersMetrics, MonthlyTotalUsersMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)

def get_historical_route_metrics():
    """
    Returns daily metrics for the last thirty days and all time monthly metrics

    Returns:
        {
            daily: {
                2021/01/15: {unique: ..., total: ...}
                ...
            },
            monthly: {
                2021/01/01: {unique: ..., total: ...}
                ...
            }
        }
    """

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)

        daily_metrics = {}
        unique_daily_counts = (
            session.query(
                DailyUniqueUsersMetrics.timestamp,
                DailyUniqueUsersMetrics.count
            )
            .filter(thirty_days_ago <= DailyUniqueUsersMetrics.timestamp)
            .filter(DailyUniqueUsersMetrics.timestamp < today)
            .all()
        )
        unique_daily_count_records = ft.reduce(lambda acc, curr: \
            acc.update({str(curr[0]): curr[1]}) or acc, unique_daily_counts, {})

        total_daily_counts = (
            session.query(
                DailyTotalUsersMetrics.timestamp,
                DailyTotalUsersMetrics.count
            )
            .filter(thirty_days_ago <= DailyTotalUsersMetrics.timestamp)
            .filter(DailyTotalUsersMetrics.timestamp < today)
            .all()
        )
        total_daily_count_records = ft.reduce(lambda acc, curr: \
            acc.update({str(curr[0]): curr[1]}) or acc, total_daily_counts, {})

        for timestamp, unique_count in unique_daily_count_records.items():
            if timestamp in total_daily_count_records:
                daily_metrics[timestamp] = {
                    'unique': unique_count,
                    'total': total_daily_count_records[timestamp]
                }

        monthly_metrics = {}
        unique_monthly_counts = (
            session.query(
                MonthlyUniqueUsersMetrics.timestamp,
                MonthlyUniqueUsersMetrics.count
            )
            .filter(MonthlyUniqueUsersMetrics.timestamp < today)
            .all()
        )
        unique_monthly_count_records = ft.reduce(lambda acc, curr: \
            acc.update({str(curr[0]): curr[1]}) or acc, unique_monthly_counts, {})

        total_monthly_counts = (
            session.query(
                MonthlyTotalUsersMetrics.timestamp,
                MonthlyTotalUsersMetrics.count
            )
            .filter(MonthlyTotalUsersMetrics.timestamp < today)
            .all()
        )
        total_monthly_count_records = ft.reduce(lambda acc, curr: \
            acc.update({str(curr[0]): curr[1]}) or acc, total_monthly_counts, {})

        for timestamp, unique_count in unique_monthly_count_records.items():
            if timestamp in total_monthly_count_records:
                monthly_metrics[timestamp] = {
                    'unique': unique_count,
                    'total': total_monthly_count_records[timestamp]
                }

        return {
            'daily': daily_metrics,
            'monthly': monthly_metrics
        }

def get_aggregate_route_metrics(time_range, bucket_size):
    """
    Returns a list of timestamp with unique count and total count for all routes
    based on given time range and grouped give by bucket size

    Returns:
        [{ timestamp, count, unique_count }]
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        today = date.today()
        seven_days_ago = today - timedelta(days=7)
        thirty_days_ago = today - timedelta(days=30)

        if time_range == 'week':
            if bucket_size == 'day':
                unique_counts = (
                    session.query(
                        DailyUniqueUsersMetrics.timestamp,
                        DailyUniqueUsersMetrics.count
                    )
                    .filter(seven_days_ago <= DailyUniqueUsersMetrics.timestamp)
                    .filter(DailyUniqueUsersMetrics.timestamp < today)
                    .all()
                )
                unique_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, unique_counts, {})

                total_counts = (
                    session.query(
                        DailyTotalUsersMetrics.timestamp,
                        DailyTotalUsersMetrics.count
                    )
                    .filter(seven_days_ago <= DailyTotalUsersMetrics.timestamp)
                    .filter(DailyTotalUsersMetrics.timestamp < today)
                    .all()
                )
                total_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, total_counts, {})

                metrics = []
                for timestamp, unique_count in unique_count_records.items():
                    if timestamp in total_count_records:
                        metrics.append({
                            'timestamp': timestamp,
                            'unique': unique_count,
                            'total': total_count_records[timestamp]
                        })
                return metrics
            raise exceptions.ArgumentError("Invalid bucket_size for time_range")
        if time_range == 'month':
            if bucket_size == 'day':
                unique_counts = (
                    session.query(
                        DailyUniqueUsersMetrics.timestamp,
                        DailyUniqueUsersMetrics.count
                    )
                    .filter(thirty_days_ago <= DailyUniqueUsersMetrics.timestamp)
                    .filter(DailyUniqueUsersMetrics.timestamp < today)
                    .all()
                )
                unique_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, unique_counts, {})

                total_counts = (
                    session.query(
                        DailyTotalUsersMetrics.timestamp,
                        DailyTotalUsersMetrics.count
                    )
                    .filter(thirty_days_ago <= DailyTotalUsersMetrics.timestamp)
                    .filter(DailyTotalUsersMetrics.timestamp < today)
                    .all()
                )
                total_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, total_counts, {})

                metrics = []
                for timestamp, unique_count in unique_count_records.items():
                    if timestamp in total_count_records:
                        metrics.append({
                            'timestamp': timestamp,
                            'unique': unique_count,
                            'total': total_count_records[timestamp]
                        })
                return metrics
            if bucket_size == 'week':
                unique_counts = (
                    session.query(
                        func.date_trunc(bucket_size, DailyUniqueUsersMetrics.timestamp).label('timestamp'),
                        func.sum(DailyUniqueUsersMetrics.count).label('count')
                    )
                    .filter(thirty_days_ago <= DailyUniqueUsersMetrics.timestamp)
                    .filter(DailyUniqueUsersMetrics.timestamp < today)
                    .group_by(func.date_trunc(bucket_size, DailyUniqueUsersMetrics.timestamp))
                    .all()
                )
                unique_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, unique_counts, {})

                total_counts = (
                    session.query(
                        func.date_trunc(bucket_size, DailyTotalUsersMetrics.timestamp).label('timestamp'),
                        func.sum(DailyTotalUsersMetrics.count).label('count')
                    )
                    .filter(thirty_days_ago <= DailyTotalUsersMetrics.timestamp)
                    .filter(DailyTotalUsersMetrics.timestamp < today)
                    .group_by(func.date_trunc(bucket_size, DailyTotalUsersMetrics.timestamp))
                    .all()
                )
                total_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, total_counts, {})

                metrics = []
                for timestamp, unique_count in unique_count_records.items():
                    if timestamp in total_count_records:
                        metrics.append({
                            'timestamp': timestamp,
                            'unique': unique_count,
                            'total': total_count_records[timestamp]
                        })
                return metrics
            raise exceptions.ArgumentError("Invalid bucket_size for time_range")
        if time_range == 'all_time':
            if bucket_size == 'month':
                unique_counts = (
                    session.query(
                        MonthlyUniqueUsersMetrics.timestamp,
                        MonthlyUniqueUsersMetrics.count
                    )
                    .filter(MonthlyUniqueUsersMetrics.timestamp < today)
                    .all()
                )
                unique_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, unique_counts, {})

                total_counts = (
                    session.query(
                        MonthlyTotalUsersMetrics.timestamp,
                        MonthlyTotalUsersMetrics.count
                    )
                    .filter(MonthlyTotalUsersMetrics.timestamp < today)
                    .all()
                )
                total_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, total_counts, {})

                metrics = []
                for timestamp, unique_count in unique_count_records.items():
                    if timestamp in total_count_records:
                        metrics.append({
                            'timestamp': timestamp,
                            'unique': unique_count,
                            'total': total_count_records[timestamp]
                        })
                return metrics
            if bucket_size == 'week':
                unique_counts = (
                    session.query(
                        func.date_trunc(bucket_size, DailyUniqueUsersMetrics.timestamp).label('timestamp'),
                        func.sum(DailyUniqueUsersMetrics.count).label('count')
                    )
                    .filter(DailyUniqueUsersMetrics.timestamp < today)
                    .group_by(func.date_trunc(bucket_size, DailyUniqueUsersMetrics.timestamp))
                    .all()
                )
                unique_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, unique_counts, {})
                total_counts = (
                    session.query(
                        func.date_trunc(bucket_size, DailyTotalUsersMetrics.timestamp).label('timestamp'),
                        func.sum(DailyTotalUsersMetrics.count).label('count')
                    )
                    .filter(DailyTotalUsersMetrics.timestamp < today)
                    .group_by(func.date_trunc(bucket_size, DailyTotalUsersMetrics.timestamp))
                    .all()
                )
                total_count_records = ft.reduce(lambda acc, curr: \
                    acc.update({str(curr[0]): curr[1]}) or acc, total_counts, {})

                metrics = []
                for timestamp, unique_count in unique_count_records.items():
                    if timestamp in total_count_records:
                        metrics.append({
                            'timestamp': timestamp,
                            'unique': unique_count,
                            'total': total_count_records[timestamp]
                        })
                return metrics
            raise exceptions.ArgumentError("Invalid bucket_size for time_range")
        raise exceptions.ArgumentError("Invalid time_range")

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
        'timestamp': int(time.mktime(metric.time.timetuple())),
        'count': metric.count,
        'unique_count': metric.unique_count,
    }

def _get_route_metrics(session, args):
    # Protocol dashboard optimization:
    # If we're in 'simple' mode (only asking for day/month bucket, no path or query string),
    # query the corresponding matview instead of hitting the DB.
    is_simple_args = (
        args.get('path') == "" and
        args.get('query_string') == None and
        args.get('start_time') and
        args.get('exact') == False and
        args.get('version') == None
    )
    bucket_size = args.get('bucket_size')
    if is_simple_args and bucket_size in ["day", "month"]:
        query = None
        if bucket_size == "day":
            # subtract 1 day from the start_time so that the last day is fully complete
            query = (session.query(RouteMetricsDayMatview)
                     .filter(RouteMetricsDayMatview.time > (args.get('start_time') - timedelta(days=1))))

        else:
            query = (session.query(RouteMetricsMonthMatview)
                     .filter(RouteMetricsMonthMatview.time > (args.get('start_time'))))

        query = (query
                 .order_by(desc('time'))
                 .limit(args.get('limit'))
                 .all())
        metrics = list(map(_make_metrics_tuple, query))
        return metrics

    metrics_query = (
        session.query(
            func.date_trunc(args.get('bucket_size'), RouteMetrics.timestamp).label('timestamp'),
            func.sum(RouteMetrics.count).label('count'),
            func.count(RouteMetrics.ip.distinct()).label('unique_count')
        )
        .filter(
            RouteMetrics.timestamp > args.get('start_time')
        )
    )
    if args.get("exact") == True:
        metrics_query = (
            metrics_query
            .filter(
                RouteMetrics.route_path == args.get("path")
            )
        )
    else:
        metrics_query = (
            metrics_query
            .filter(
                RouteMetrics.route_path.like('{}%'.format(args.get("path")))
            )
        )

    if args.get("query_string", None) != None:
        metrics_query = (
            metrics_query.filter(
                or_(
                    RouteMetrics.query_string.like(
                        '%{}'.format(args.get("query_string"))),
                    RouteMetrics.query_string.like(
                        '%{}&%'.format(args.get("query_string")))
                )
            )
        )

    metrics_query = (
        metrics_query
        .group_by(func.date_trunc(args.get('bucket_size'), RouteMetrics.timestamp))
        .order_by(desc('timestamp'))
        .limit(args.get('limit'))
    )

    metrics = metrics_query.all()

    metrics = [{
        'timestamp': int(time.mktime(m[0].timetuple())),
        'count': m[1],
        'unique_count': m[2],
    } for m in metrics]

    return metrics
