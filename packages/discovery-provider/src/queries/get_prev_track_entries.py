from typing import List

from sqlalchemy import and_, func, or_
from sqlalchemy.orm.session import Session

from src.models.tracks.track import Track


def get_prev_track_entries(session: Session, entries: List[Track]):
    """
    Gets the previous state of tracks in the database given a list of tracks.

    Args:
        session: (DB) sqlalchemy scoped db session
        entries: (List<Track>) List of current track entries

    Returns:
        prev_track_entries: (List<Track>) List of previous track entries corresponding to the passed track entries
    """

    if len(entries) == 0:
        return []

    def get_prev_query_pairs(entry):
        return [entry.track_id, entry.blocknumber]

    prev_query_pairs = map(get_prev_query_pairs, entries)

    prev_entries_subquery = (
        session.query(
            Track.track_id, func.max(Track.blocknumber).label("max_blocknumber")
        )
        .filter(
            or_(
                *(
                    and_(Track.track_id == pair[0], Track.blocknumber < pair[1])
                    for pair in prev_query_pairs
                )
            )
        )
        .group_by(Track.track_id)
        .subquery()
    )

    prev_entries_query = session.query(Track).join(
        prev_entries_subquery,
        and_(
            prev_entries_subquery.c.track_id == Track.track_id,
            prev_entries_subquery.c.max_blocknumber == Track.blocknumber,
        ),
    )

    return prev_entries_query.all()
