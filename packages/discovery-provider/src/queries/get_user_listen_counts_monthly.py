from typing import TypedDict

from sqlalchemy import func
from sqlalchemy.orm.session import Session

from src.models.social.aggregate_monthly_plays import AggregateMonthlyPlay
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import query_result_to_list


class GetUserListenCountsMonthlyArgs(TypedDict):
    # The current user logged in (from route param)
    user_id: int

    # The start time from which to search (from query arg)
    start_time: str

    # The end time until which to search (from query arg)
    end_time: str


def get_user_listen_counts_monthly(args: GetUserListenCountsMonthlyArgs):
    """
    Returns a user's listen counts for all tracks they own, grouped by month.

    Args:
        args: GetUserListenCountsMonthlyArgs The parsed args from the request

    Returns:
        Array of AggregateMonthlyPlay objects that are timestamped within the given
        time frame and whose tracks all belong to the given user id.
    """

    db = get_db_read_replica()
    with db.scoped_session() as session:
        user_listen_counts_monthly = _get_user_listen_counts_monthly(session, args)
        return query_result_to_list(user_listen_counts_monthly)


def _get_user_listen_counts_monthly(
    session: Session, args: GetUserListenCountsMonthlyArgs
):
    user_id = args["user_id"]
    start_time = args["start_time"]
    end_time = args["end_time"]

    query = (
        session.query(
            AggregateMonthlyPlay.play_item_id,
            AggregateMonthlyPlay.timestamp,
            func.sum(AggregateMonthlyPlay.count),
        )
        .join(Track, Track.track_id == AggregateMonthlyPlay.play_item_id)
        .filter(Track.owner_id == user_id)
        .filter(Track.is_current == True)
        .filter(AggregateMonthlyPlay.timestamp >= start_time)
        .filter(AggregateMonthlyPlay.timestamp < end_time)
        .group_by(AggregateMonthlyPlay.play_item_id, AggregateMonthlyPlay.timestamp)
    )
    return query.all()
