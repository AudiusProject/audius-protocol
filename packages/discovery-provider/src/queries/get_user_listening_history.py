from typing import Optional, TypedDict

from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.functions import coalesce

from src.models.social.aggregate_plays import AggregatePlay
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track_with_aggregates import TrackWithAggregates
from src.models.users.user import User
from src.models.users.user_listening_history import UserListeningHistory
from src.queries import response_name_constants
from src.queries.query_helpers import (
    SortDirection,
    SortMethod,
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class GetUserListeningHistoryArgs(TypedDict):
    # The current user logged in (from route param)
    user_id: int

    # The maximum number of listens to return
    limit: int

    # The offset for the listen history
    offset: int

    # Optional filter for the returned results
    query: Optional[str]

    # Optional sort method for the returned results
    sort_method: Optional[SortMethod]
    sort_direction: Optional[SortDirection]


def get_user_listening_history(args: GetUserListeningHistoryArgs):
    """
    Returns a user's listening history.

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
    limit = args["limit"]
    offset = args["offset"]
    query = args["query"]
    sort_method = args["sort_method"]
    sort_direction = args["sort_direction"]
    sort_fn = desc if sort_direction == SortDirection.desc else asc

    listening_history_results = (
        session.query(UserListeningHistory.listening_history).filter(
            UserListeningHistory.user_id == user_id
        )
    ).scalar()

    if not listening_history_results:
        return []

    # order listening history entries by their user's play counts so our track ids will be
    # correct order when querying for track ids
    if sort_method == SortMethod.most_listens_by_user:
        listening_history_results = sort_listening_history_results_by_play_count_desc(
            listening_history_results
        )

    # Map out all track ids and listen dates
    track_ids = []
    listen_dates = {}
    for listen in listening_history_results:
        track_ids.append(listen["track_id"])
        listen_dates[listen["track_id"]] = listen["timestamp"]

    base_query = (
        session.query(TrackWithAggregates)
        .filter(TrackWithAggregates.track_id.in_(track_ids))
        .filter(TrackWithAggregates.is_current == True)
        .filter(TrackWithAggregates.is_delete == False)
        .join(TrackWithAggregates.user)
        .filter(User.is_deactivated == False)
    )

    if query is not None:
        base_query = base_query.filter(
            or_(
                TrackWithAggregates.title.ilike(f"%{query.lower()}%"),
                User.name.ilike(f"%{query.lower()}%"),
            )
        )

    base_query = sort_by_sort_method(sort_method, sort_fn, track_ids, base_query)

    # Add pagination
    base_query = add_query_pagination(base_query, limit, offset)
    query_results = base_query.all()
    track_ids = track_ids[offset : offset + limit]

    tracks = helpers.query_result_to_list(query_results)

    # bundle peripheral info into track results
    tracks = populate_track_metadata(
        session, track_ids, tracks, current_user_id=user_id, track_has_aggregates=True
    )
    tracks = add_users_to_tracks(session, tracks, current_user_id=user_id)

    for track in tracks:
        track[response_name_constants.activity_timestamp] = listen_dates[
            track[response_name_constants.track_id]
        ]

    return tracks


def sort_listening_history_results_by_play_count_desc(listening_history_results):
    listening_histories_by_plays = [
        listening_history for listening_history in listening_history_results
    ]
    listening_histories_by_plays.sort(
        key=lambda listen: listen.get("play_count", 1), reverse=True
    )
    listening_history_results = listening_histories_by_plays
    return listening_history_results


def sort_by_sort_method(sort_method, sort_fn, track_ids, base_query):
    if sort_method == SortMethod.title:
        return base_query.order_by(sort_fn(TrackWithAggregates.title))
    elif sort_method == SortMethod.artist_name:
        return base_query.join(TrackWithAggregates.user, aliased=True).order_by(
            sort_fn(User.name)
        )
    elif sort_method == SortMethod.release_date:
        return base_query.order_by(
            sort_fn(
                coalesce(
                    TrackWithAggregates.release_date,
                    TrackWithAggregates.created_at,
                )
            )
        )
    elif sort_method == SortMethod.last_listen_date:
        return base_query.order_by(
            sort_fn(func.array_position(track_ids, TrackWithAggregates.track_id))
        )
    elif sort_method == SortMethod.plays:
        return base_query.join(TrackWithAggregates.aggregate_play).order_by(
            sort_fn(AggregatePlay.count)
        )
    elif sort_method == SortMethod.reposts:
        return base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.repost_count)
        )
    elif sort_method == SortMethod.saves:
        return base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.save_count)
        )
    elif sort_method == SortMethod.most_listens_by_user:
        return base_query.order_by(
            (func.array_position(track_ids, TrackWithAggregates.track_id))
        )
    else:
        return base_query.order_by(
            sort_fn(func.array_position(track_ids, TrackWithAggregates.track_id))
        )
