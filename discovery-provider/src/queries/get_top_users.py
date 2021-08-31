from sqlalchemy.sql.expression import desc
from src.models.models import AggregateUser, User
from src.queries.query_helpers import helpers, paginate_query, populate_user_metadata
from src.utils.db_session import get_db_read_replica


def get_top_users(current_user_id):
    """Gets the top users by follows of all of Audius"""
    top_users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        top_users = (
            session.query(User)
            .select_from(AggregateUser)
            .join(User, User.user_id == AggregateUser.user_id)
            .filter(AggregateUser.track_count > 0, User.is_current)
            .order_by(desc(AggregateUser.follower_count), User.user_id)
        )
        top_users = paginate_query(top_users).all()
        top_users = helpers.query_result_to_list(top_users)
        user_ids = list(map(lambda user: user["user_id"], top_users))
        top_users = populate_user_metadata(
            session, user_ids, top_users, current_user_id
        )
    return top_users
