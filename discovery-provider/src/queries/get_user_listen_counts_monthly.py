from typing import TypedDict

from sqlalchemy.orm.session import Session
from src.models.social.aggregate_monthly_plays import AggregateMonthlyPlay
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica


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
        return format_aggregate_monthly_plays_for_user(user_listen_counts_monthly)


def format_aggregate_monthly_plays_for_user(aggregate_monthly_plays_for_user):
    formatted_response_data = {}
    for aggregate_monthly_play in aggregate_monthly_plays_for_user:
        month = aggregate_monthly_play.timestamp.strftime("%Y-%m-%dT%H:%M:%S Z")
        if month not in formatted_response_data:
            formatted_response_data[month] = {}
            formatted_response_by_month = formatted_response_data[month]
            formatted_response_by_month["totalListens"] = 0
            formatted_response_by_month["trackIds"] = []
            formatted_response_by_month["listenCounts"] = []

        formatted_response_by_month = formatted_response_data[month]
        formatted_response_by_month["listenCounts"].append(
            {
                "trackId": aggregate_monthly_play.play_item_id,
                "date": month,
                "listens": aggregate_monthly_play.count,
            }
        )
        formatted_response_by_month["trackIds"].append(
            aggregate_monthly_play.play_item_id
        )
        formatted_response_by_month["totalListens"] += aggregate_monthly_play.count

    return formatted_response_data


def _get_user_listen_counts_monthly(
    session: Session, args: GetUserListenCountsMonthlyArgs
):
    user_id = args["user_id"]
    start_time = args["start_time"]
    end_time = args["end_time"]

    query = (
        session.query(AggregateMonthlyPlay)
        .join(Track, Track.track_id == AggregateMonthlyPlay.play_item_id)
        .filter(Track.owner_id == user_id)
        .filter(Track.is_current == True)
        .filter(AggregateMonthlyPlay.timestamp >= start_time)
        .filter(AggregateMonthlyPlay.timestamp < end_time)
    )
    return query.all()
