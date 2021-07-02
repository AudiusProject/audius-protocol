import logging  # pylint: disable=C0302

from sqlalchemy import func
from src.models import User, TagTrackUserMatview
from src.utils import helpers
from src.queries import response_name_constants
from src.queries.query_helpers import populate_user_metadata

logger = logging.getLogger(__name__)


def search_user_tags(session, args):
    """
    Gets the users with tracks with a given tag

    Args:
        session: sqlalchemy db session instance
        args: dict of arguments
        args.search_str: string the tag search string
        args.current_user_id: id | null The user id making the query
        args.limit: number the query limit of number of returns tracks
        args.offset: number the query offset for results
        args.user_tag_count: number The number of tracks with the query tag

    Returns:
        list of users sorted by followee count
    """
    user_ids = (
        session.query(TagTrackUserMatview.owner_id)
        .filter(TagTrackUserMatview.tag == args["search_str"].lower())
        .group_by(TagTrackUserMatview.owner_id)
        .having(func.count(TagTrackUserMatview.owner_id) >= args["user_tag_count"])
        .all()
    )

    # user_ids is list of tuples - simplify to 1-D list
    user_ids = [i[0] for i in user_ids]

    users = (
        session.query(User)
        .filter(User.is_current == True, User.user_id.in_(user_ids))
        .all()
    )
    users = helpers.query_result_to_list(users)

    users = populate_user_metadata(session, user_ids, users, args["current_user_id"])

    followee_sorted_users = sorted(
        users, key=lambda i: i[response_name_constants.follower_count], reverse=True
    )

    followee_sorted_users = followee_sorted_users[
        slice(args["offset"], args["offset"] + args["limit"], 1)
    ]

    return followee_sorted_users
