import logging
from typing import TypedDict

from sqlalchemy import func

from src.models.tracks.remix import Remix
from src.models.tracks.track import Track
from src.queries.query_helpers import add_query_pagination
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)


class GetUserTracksRemixedArgs(TypedDict):
    current_user_id: int
    user_id: int
    limit: int
    offset: int


def _get_user_tracks_remixed(session, args: GetUserTracksRemixedArgs):
    """Fetch tracks owned by the given user that have been remixed by other users."""

    user_id = args.get("user_id")

    remix_count = func.count(Remix.child_track_id).label("remix_count")
    query = (
        session.query(
            Remix.parent_track_id.label("track_id"),
            Track.title,
            remix_count,
        )
        .join(Track, Remix.parent_track_id == Track.track_id)
        .filter(Track.owner_id == user_id)
        .group_by(Remix.parent_track_id, Track.title)
        .order_by(remix_count.desc())
    )

    return query


def get_user_tracks_remixed(args: GetUserTracksRemixedArgs):
    remixed_aggregates = []
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_user_tracks_remixed(session, args)
        query_results = add_query_pagination(query, limit, offset).all()
        remixed_aggregates = [
            {"track_id": encode_int_id(row[0]), "title": row[1], "remix_count": row[2]}
            for row in query_results
        ]

    return remixed_aggregates
