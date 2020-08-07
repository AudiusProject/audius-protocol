import logging
from sqlalchemy import func, desc, or_
from src.models import RouteMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_route_metrics(args):
    """
    Returns the usage metrics for routes

    Parameters:
        args: {
            path: string
            start_time: timestamp
            query_string: [optional] string
            limit: number
        }
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:

        metrics_query = (
            session.query(
                RouteMetrics.route_path,
                RouteMetrics.timestamp,
                func.sum(RouteMetrics.count).label('count')
            )
            .filter(
                RouteMetrics.route_path == args.get('path'),
                RouteMetrics.timestamp > args.get('start_time')
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
            .group_by(RouteMetrics.route_path, RouteMetrics.timestamp)
            .order_by(desc(RouteMetrics.timestamp))
            .limit(args.get('limit'))
        )

        metrics = metrics_query.all()
        metrics = [{'route': m[0], 'timestamp': m[1].strftime(
            "%m/%d/%Y, %H:%M:%S"), 'count': m[2]} for m in metrics]

        return metrics
