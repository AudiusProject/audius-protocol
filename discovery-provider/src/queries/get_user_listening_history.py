from typing import TypedDict

from sqlalchemy.orm.session import Session
from src.models.tracks.track import Track
from src.models.users.user_listening_history import UserListeningHistory
from src.queries import response_name_constants
from src.queries.query_helpers import add_users_to_tracks, populate_track_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class GetUserListeningHistoryArgs(TypedDict):
    # The current user logged in (from route param)
    user_id: int

    # The current user logged in (from query arg)
    current_user_id: int

    # The maximum number of listens to return
    limit: int

    # The offset for the listen history
    offset: int


def get_user_listening_history(args: GetUserListeningHistoryArgs):
    """
    Returns a user's listening history

    Args:
        args: GetUserListeningHistoryArgs The parsed args from the request

    Returns:
        Array of tracks the user listened to starting from most recently listened
    """

    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_user_listening_history(session, args)


def _get_user_listening_history(session: Session, args: GetUserListeningHistoryArgs):
    user_id = args["user_id"]
    current_user_id = args["current_user_id"]
    limit = args["limit"]
    offset = args["offset"]

    if user_id != current_user_id:
        return []

    listening_history_results = (
        session.query(UserListeningHistory.listening_history).filter(
            UserListeningHistory.user_id == current_user_id
        )
    ).scalar()

    if not listening_history_results:
        return []

    # add query pagination
    listening_history_results = listening_history_results[offset : offset + limit]

    track_ids = []
    listen_dates = []
    for listen in listening_history_results:
        track_ids.append(listen["track_id"])
        listen_dates.append(listen["timestamp"])

    track_results = (session.query(Track).filter(Track.track_id.in_(track_ids))).all()

    track_results_dict = {
        track_result.track_id: track_result for track_result in track_results
    }

    # sort tracks in listening history order
    sorted_track_results = []
    for track_id in track_ids:
        if track_id in track_results_dict:
            sorted_track_results.append(track_results_dict[track_id])

    tracks = helpers.query_result_to_list(sorted_track_results)

    # bundle peripheral info into track results
    tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
    add_users_to_tracks(session, tracks, current_user_id)

    for idx, track in enumerate(tracks):
        track[response_name_constants.activity_timestamp] = listen_dates[idx]

    return tracks
