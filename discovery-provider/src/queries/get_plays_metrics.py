import logging
import time
from sqlalchemy import func, desc
from src.models import HourlyPlayCounts
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_plays_metrics(args):
    """
    Returns metrics for play counts

    Args:
        args: dict The parsed args from the request
        args.start_time: date The start of the query
        args.limit: number The max number of responses to return
        args.bucket_size: string A date_trunc operation to aggregate timestamps by

    Returns:
        Array of dictionaries with the play counts and timestamp
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_plays_metrics(session, args)


def _get_plays_metrics(session, args):
    metrics_query = (
        session.query(
            func.date_trunc(args.get("bucket_size"), HourlyPlayCounts.hourly_timestamp).label(
                "timestamp"
            ),
            func.sum(HourlyPlayCounts.play_count).label("count"),
        )
        .filter(HourlyPlayCounts.hourly_timestamp > args.get("start_time"))
        .group_by(func.date_trunc(args.get("bucket_size"), HourlyPlayCounts.hourly_timestamp))
        .order_by(desc("timestamp"))
        .limit(args.get("limit"))
    )

    metrics = metrics_query.all()

    metrics = [{"timestamp": int(time.mktime(metric[0].timetuple())), "count": metric[1]} for metric in metrics]
    return metrics
