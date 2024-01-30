import logging

from sqlalchemy import asc, desc

from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.queries.query_helpers import add_query_pagination, populate_user_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_top_genre_users(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_top_genre_users(session, args)


def _get_top_genre_users(session, args):
    genres = []
    if "genre" in args:
        genres = args.get("genre")
        if isinstance(genres, str):
            genres = [genres]

    with_users = args.get("with_users", True)
    limit = args.get("limit", 10)
    offset = args.get("offset", 0)

    top_users_query = (
        session.query(User)
        .join(AggregateUser, User.user_id == AggregateUser.user_id)
        .filter(
            AggregateUser.dominant_genre.in_(genres),
            User.is_deactivated == False,
            User.is_available == True,
        )
        .order_by(desc(AggregateUser.follower_count), asc(User.user_id))
    )
    users = add_query_pagination(top_users_query, limit, offset).all()
    users = helpers.query_result_to_list(users)
    print(users, limit, offset)
    user_ids = list(map(lambda user: user["user_id"], users))

    if with_users:
        users = populate_user_metadata(session, user_ids, users, None)

        # Sort the users so that it's in the same order as the previous query
        user_map = {user["user_id"]: user for user in users}
        users = [user_map[user_id] for user_id in user_ids]
        return users

    return user_ids
