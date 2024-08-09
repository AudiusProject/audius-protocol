import logging
from typing import Optional, TypedDict  # pylint: disable=C0302

from sqlalchemy import distinct

from src.models.tracks.remix import Remix
from src.models.tracks.track import Track
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import add_query_pagination, populate_user_metadata
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetRemixersArgs(TypedDict):
    remixee_user_id: int
    current_user_id: int
    track_id: Optional[int]
    limit: int
    offset: int


def _get_remixers(session, args: GetRemixersArgs):
    """Fetch users who have remixed tracks owned by the given user,
    optionally also filtered by the given parent track ID.
    """

    track_id = args.get("track_id", None)
    remixee_user_id = args.get("remixee_user_id")

    # Get all tracks that are remixes of the given user's tracks
    tracks_subquery = (
        session.query(Remix.child_track_id)
        .join(Track, Remix.parent_track_id == Track.track_id)
        .filter(Track.owner_id == remixee_user_id)
        .filter(Track.is_delete == False)
        .filter(Track.is_unlisted == False)
    )

    # Optionally filter by given parent track ID
    if track_id:
        tracks_subquery = tracks_subquery.filter(Remix.parent_track_id == track_id)

    tracks_subquery = tracks_subquery.subquery()

    # Get all owners of the remixes
    base_query = (
        session.query(distinct(Track.owner_id))
        .join(
            tracks_subquery,
            Track.track_id == tracks_subquery.c.child_track_id,
        )
        .filter(Track.is_delete == False)
        .filter(Track.is_unlisted == False)
    )

    return base_query


def get_remixers_count(args: GetRemixersArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = _get_remixers(session, args)
        return query.count()


def get_remixers(args: GetRemixersArgs):
    remixers = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_remixers(session, args)
        rows = add_query_pagination(query, limit, offset).all()
        remixer_ids = [r[0] for r in rows]
        remix_users = get_unpopulated_users(session, remixer_ids)
        remixers = populate_user_metadata(
            session, remixer_ids, remix_users, current_user_id
        )

    return remixers
