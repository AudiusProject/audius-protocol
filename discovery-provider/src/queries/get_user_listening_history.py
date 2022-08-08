from typing import Optional, TypedDict

from sqlalchemy import Integer, String, asc, desc, or_, text
from sqlalchemy.orm.session import Session
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

    # The current user logged in (from query arg)
    current_user_id: int

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
    query = args["query"]
    sort_method = args["sort_method"]
    sort_direction = args["sort_direction"]
    sort_fn = desc if sort_direction == SortDirection.desc else asc

    if user_id != current_user_id:
        return []

    listening_history_results = (
        session.query(UserListeningHistory.listening_history).filter(
            UserListeningHistory.user_id == current_user_id
        )
    ).scalar()

    if not listening_history_results:
        return []

    # Map out all track ids and listen dates
    track_ids = []
    listen_dates = {}
    for listen in listening_history_results:
        track_ids.append(listen["track_id"])
        listen_dates[listen["track_id"]] = listen["timestamp"]

    # Order by the listening history order
    # This helper just makes sure that we can order by the same ordering
    # of track ids in the history results
    # https://stackoverflow.com/questions/866465/order-by-the-in-value-list
    order = (
        text(
            """
        SELECT * 
        FROM unnest(:track_ids) WITH ORDINALITY t(id, ord)
        """
        )
        .bindparams(track_ids=track_ids)
        .columns(id=String, ord=Integer)
        .alias()
    )

    base_query = (
        session.query(TrackWithAggregates)
        .join(order, order.c.id == TrackWithAggregates.track_id)
        .filter(TrackWithAggregates.is_current == True)
    )

    if query is not None:
        base_query = base_query.join(TrackWithAggregates.user).filter(
            or_(
                TrackWithAggregates.title.ilike(f"%{query.lower()}%"),
                User.name.ilike(f"%{query.lower()}%"),
            )
        )

    if sort_method == SortMethod.title:
        base_query = base_query.order_by(sort_fn(TrackWithAggregates.title))
    elif sort_method == SortMethod.artist_name:
        base_query = base_query.order_by(sort_fn(TrackWithAggregates.user.name))
    elif sort_method == SortMethod.release_date:
        base_query = base_query.order_by(sort_fn(TrackWithAggregates.release_date))
    elif sort_method == SortMethod.last_listen_date:
        base_query = base_query.order_by(sort_fn(order.c.ord))
    elif sort_method == SortMethod.plays:
        base_query = base_query.join(TrackWithAggregates.aggregate_play).order_by(
            sort_fn(AggregatePlay.count)
        )
    elif sort_method == SortMethod.reposts:
        base_query = base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.repost_count)
        )
    elif sort_method == SortMethod.saves:
        base_query = base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.save_count)
        )
    else:
        base_query = base_query.order_by(sort_fn(order.c.ord))

    # Add pagination
    base_query = add_query_pagination(base_query, limit, offset)
    base_query = base_query.all()
    track_ids = track_ids[offset : offset + limit]

    tracks = helpers.query_result_to_list(base_query)

    # bundle peripheral info into track results
    tracks = populate_track_metadata(
        session, track_ids, tracks, current_user_id, track_has_aggregates=True
    )
    tracks = add_users_to_tracks(session, tracks, current_user_id)

    for track in tracks:
        track[response_name_constants.activity_timestamp] = listen_dates[
            track[response_name_constants.track_id]
        ]

    return tracks
