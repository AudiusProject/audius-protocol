import logging
from datetime import date, timedelta

from sqlalchemy import func

from src.models.metrics.aggregate_daily_total_users_metrics import (
    AggregateDailyTotalUsersMetrics,
)
from src.models.metrics.aggregate_daily_unique_users_metrics import (
    AggregateDailyUniqueUsersMetrics,
)
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_aggregate_route_metrics_trailing_month():
    """
    Returns trailing count and unique count for all routes in the last trailing 30 days

    Returns:
        { unique_count, total_count }
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_aggregate_route_metrics_trailing_month(session)


def _get_aggregate_route_metrics_trailing_month(session):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    counts = (
        session.query(
            func.sum(AggregateDailyUniqueUsersMetrics.count),
            func.sum(AggregateDailyUniqueUsersMetrics.summed_count),
        )
        .filter(thirty_days_ago <= AggregateDailyUniqueUsersMetrics.timestamp)
        .filter(AggregateDailyUniqueUsersMetrics.timestamp < today)
        .first()
    )

    total_count = (
        session.query(func.sum(AggregateDailyTotalUsersMetrics.count))
        .filter(thirty_days_ago <= AggregateDailyTotalUsersMetrics.timestamp)
        .filter(AggregateDailyTotalUsersMetrics.timestamp < today)
        .first()
    )

    return {
        "unique_count": counts[0],
        "summed_unique_count": counts[1],
        "total_count": total_count[0],
    }
