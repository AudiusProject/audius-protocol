from datetime import datetime
import logging
from sqlalchemy import func
from src.models import Track
from src.utils import db_session

logger = logging.getLogger(__name__)

def get_genre_metrics(args):
    """
    Returns metrics for track genres over the provided bucket

    Args:
        args: dict The parsed args from the request
        args.bucket_size: string A date_trunc operation to aggregate by

    Returns:
        Array of dictionaries with the play counts and timestamp
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_genre_metrics(session, args)


def _get_genre_metrics(session, args):
    metrics_query = (
        session.query(
            Track.genre,
            func.count(Track.track_id).label('count')
        )
        .filter(
            Track.genre != None,
            Track.genre != '',
            Track.is_current == True,
            Track.created_at > func.date_trunc(args.get('bucket_size'), datetime.utcnow()),
        )
        .group_by(
            Track.genre
        )
    )

    genres = {}
    metrics = metrics_query.all()
    for m in metrics:
        genres[m[0]] = m[1]

    return genres
