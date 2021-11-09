
from typing import TypedDict
from sqlalchemy.orm.session import Session
from src.models import Play, Track
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import (
    add_query_pagination,
    populate_track_metadata,
    add_users_to_tracks,
)

class GetTrackHistoryArgs(TypedDict):
    current_user_id: int
    limit: int
    offset: int
    filter_deleted: bool
    with_users: bool

def get_track_history(args: GetTrackHistoryArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_track_history(session, args)

def _get_track_history(session: Session, args: GetTrackHistoryArgs):
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    filter_deleted = args.get("filter_deleted")

    base_query = (
        session.query(Track, Play.created_at)
        .join(Play, Play.play_item_id == Track.track_id)
        .filter(
            Play.user_id == current_user_id,
            Track.is_current == True,
        )
    )

    # Allow filtering of deletes
    if filter_deleted:
        base_query = base_query.filter(Track.is_delete == False)

    base_query = base_query.order_by(Play.created_at.desc())

    query_results = add_query_pagination(base_query, limit, offset).all()

    if not query_results:
        return []

    tracks, save_dates = zip(*query_results)
    tracks = helpers.query_result_to_list(tracks)
    track_ids = list(map(lambda track: track["track_id"], tracks))

    # bundle peripheral info into track results
    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    if args.get("with_users", False):
        add_users_to_tracks(session, tracks, current_user_id)

    for idx, track in enumerate(tracks):
        track[response_name_constants.activity_timestamp] = save_dates[idx]

    return tracks
