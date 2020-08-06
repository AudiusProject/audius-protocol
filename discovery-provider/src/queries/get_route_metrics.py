import logging
from sqlalchemy import func, desc, case, and_, or_

from src import exceptions
from src.models import RouteMetrics
from src.utils import helpers
from src.utils import db_session
from src.queries.query_helpers import get_current_user_id, populate_track_metadata, \
    paginate_query, add_users_to_tracks, create_save_count_subquery, \
    create_repost_count_subquery

logger = logging.getLogger(__name__)

def get_route_metrics(args):
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
                        RouteMetrics.query_string.like('%{}'.format(args.get("query_string"))),
                        RouteMetrics.query_string.like('%{}&%'.format(args.get("query_string")))
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
        metrics = [{'route': m[0], 'timestamp': m[1].strftime("%m/%d/%Y, %H:%M:%S"), 'count': m[2]} for m in metrics]
        logger.debug(metrics)
        return metrics
