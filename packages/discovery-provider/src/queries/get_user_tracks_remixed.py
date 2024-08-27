import logging
from typing import TypedDict  # pylint: disable=C0302

from src.models.tracks.remix import Remix
from src.models.tracks.track import Track
from src.queries.query_helpers import add_query_pagination, populate_track_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetUserTracksRemixedArgs(TypedDict):
    current_user_id: int
    user_id: int
    limit: int
    offset: int


def _get_user_tracks_remixed(session, args: GetUserTracksRemixedArgs):
    """Fetch tracks owned by the given user that have been remixed by other users."""

    user_id = args.get("user_id")

    query = (
        session.query(Track)
        .distinct(Track.track_id)
        .join(Remix, Remix.parent_track_id == Track.track_id)
        .filter(Track.owner_id == user_id)
    )

    return query


def get_user_tracks_remixed(args: GetUserTracksRemixedArgs):
    user_tracks_remixed = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_user_tracks_remixed(session, args)
        query_results = add_query_pagination(query, limit, offset).all()
        tracks = helpers.query_result_to_list(query_results)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        user_tracks_remixed = populate_track_metadata(
            session, track_ids, tracks, current_user_id
        )

    return user_tracks_remixed
