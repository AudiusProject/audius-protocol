import logging

from sqlalchemy import func

from src.models.social.aggregate_plays import AggregatePlay

logger = logging.getLogger(__name__)


def get_sum_aggregate_plays(db):
    """Gets the sum of all aggregate plays
    Args:
        db: sqlalchemy db session instance

    Returns:
        int of total play count
    """

    plays = db.query(func.sum(AggregatePlay.count)).scalar()

    return int(plays)


def get_track_play_counts(db, track_ids):
    """Gets the track play counts for the given track_ids
    Args:
        db: sqlalchemy db session instance
        track_ids: list of track ids

    Returns:
        dict of track id keys to track play count values
    """

    track_listen_counts = {}

    if not track_ids:
        return track_listen_counts

    track_plays = (
        db.query(AggregatePlay).filter(AggregatePlay.play_item_id.in_(track_ids)).all()
    )

    for track_play in track_plays:
        track_listen_counts[track_play.play_item_id] = track_play.count

    for track_id in track_ids:
        if track_id not in track_listen_counts:
            track_listen_counts[track_id] = 0

    return track_listen_counts
