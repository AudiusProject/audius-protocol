import logging
from sqlalchemy import desc

from src.models import AppNameMetrics
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_app_name_metrics(app_name, args):
    """
    Returns the usage metrics for a specified app_name

    Parameters:
        app_name: string
        args: {
            start_time: timestamp
            limit: number
        }
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

        metrics = [{'timestamp': m[0].strftime(
            "%m/%d/%Y, %H:%M:%S"), 'count': m[1]} for m in metrics]

        return metrics
