import logging
import time
from sqlalchemy import desc

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

    Returns:
        Array of dictionaries with the timestamp and count
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:

        metrics = (
            session.query(
                AppNameMetrics.timestamp,
                AppNameMetrics.count
            ).filter(
                AppNameMetrics.application_name == app_name,
                AppNameMetrics.timestamp > args.get('start_time')
            )
            .order_by(desc(AppNameMetrics.timestamp))
            .limit(args.get('limit'))
            .all()
        )

        metrics = [{'timestamp': int(time.mktime(
            m[0].timetuple())), 'count': m[1]} for m in metrics]

        return metrics
