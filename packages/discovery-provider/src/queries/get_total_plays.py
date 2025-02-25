from sqlalchemy import func

from src.models.social.aggregate_plays import AggregatePlay
from src.utils.db_session import get_db_read_replica


def get_total_plays():
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_total_plays(session)


def _get_total_plays(session):
    """Gets the total number of plays across all tracks

    Args:
        session: SQLAlchemy session

    Returns:
        int: Total number of plays
    """
    total_plays = session.query(
        func.sum(func.coalesce(AggregatePlay.count, 0))
    ).scalar()

    return total_plays if total_plays else 0
