from typing import TypedDict

from sqlalchemy import text
from sqlalchemy.orm.session import Session

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
        return list(_get_user_listen_counts_monthly(session, args))


def _get_user_listen_counts_monthly(
    session: Session, args: GetUserListenCountsMonthlyArgs
):
    sql = text(
        """
    select
        play_item_id,
        timestamp,
        sum(count) as count
    from aggregate_monthly_plays
    where play_item_id in (select track_id from tracks where owner_id = :user_id)
    and timestamp >= :start_time
    and timestamp < :end_time
    group by play_item_id, timestamp
    """
    )

    return session.execute(sql, args)
