import logging
import time
from sqlalchemy import func, desc

from src.models import AppNameMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)


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
            func.date_trunc(args.get('bucket_size'), AppNameMetrics.timestamp).label('timestamp'),
            func.sum(AppNameMetrics.count).label('count'),
            func.count(AppNameMetrics.ip.distinct()).label('unique_count')
        ).filter(
            AppNameMetrics.application_name == app_name,
            AppNameMetrics.timestamp > args.get('start_time')
        )
        .group_by(func.date_trunc(args.get('bucket_size'), AppNameMetrics.timestamp))
        .order_by(desc('timestamp'))
        .limit(args.get('limit'))
        .all()
    )

    metrics = [{
        'timestamp': int(time.mktime(m[0].timetuple())),
        'count': m[1],
        'unique_count': m[2]
    } for m in metrics]

    return metrics