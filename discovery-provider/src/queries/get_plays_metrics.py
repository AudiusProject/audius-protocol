import logging
import time
from typing import TypedDict

from sqlalchemy import desc, func
from sqlalchemy.orm.session import Session
from src.models.social.hourly_play_counts import HourlyPlayCount
from src.utils import db_session

logger = logging.getLogger(__name__)


class GetPlayMetricsArgs(TypedDict):
    # A date_trunc operation to aggregate timestamps by
    bucket_size: int

    # The max number of responses to return
    start_time: int

    # The max number of responses to return
    limit: int


def get_plays_metrics(args: GetPlayMetricsArgs):
    """
    Returns metrics for play counts

    Args:
        args: GetPlayMetrics the parsed args from the request

    Returns:
        Array of dictionaries with the play counts and timestamp
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_plays_metrics(session, args)


def _get_plays_metrics(session: Session, args: GetPlayMetricsArgs):
    metrics_query = (
        session.query(
            func.date_trunc(
                args.get("bucket_size"), HourlyPlayCount.hourly_timestamp
            ).label("timestamp"),
            func.sum(HourlyPlayCount.play_count).label("count"),
        )
        .filter(HourlyPlayCount.hourly_timestamp > args.get("start_time"))
        .group_by(
            func.date_trunc(args.get("bucket_size"), HourlyPlayCount.hourly_timestamp)
        )
        .order_by(desc("timestamp"))
        .limit(args.get("limit"))
    )

    metrics = metrics_query.all()

    metrics = [
        {"timestamp": int(time.mktime(metric[0].timetuple())), "count": metric[1]}
        for metric in metrics
    ]
    return metrics
