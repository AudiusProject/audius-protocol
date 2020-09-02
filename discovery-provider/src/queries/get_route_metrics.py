import logging
import time
from sqlalchemy import func, desc, or_
from src.models import RouteMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)

def get_route_metrics(args):
    """
    Returns the usage metrics for routes

    Args:
        args: dict THe parsed args from the request
        args.path: string The route path of the query
        args.start_time: date The start of the query
        args.query_string: optional string The query string to filter on
        args.limit: number The max number of responses to return

    Returns:
        Array of dictionaries with the route, timestamp, count, and unique_count
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:

        metrics_query = (
            session.query(
                RouteMetrics.timestamp,
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
            .group_by(RouteMetrics.timestamp)
            .order_by(desc(RouteMetrics.timestamp))
            .limit(args.get('limit'))
        )

        metrics = metrics_query.all()
        metrics = [{
            'timestamp': int(time.mktime(m[0].timetuple())),
            'count': m[1],
            'unique_count': m[2],
        } for m in metrics]

        return metrics
