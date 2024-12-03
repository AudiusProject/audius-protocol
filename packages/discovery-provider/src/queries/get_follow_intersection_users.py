from src.models.social.follow import Follow
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.query_helpers import (
    get_current_user_id,
    paginate_query,
    populate_user_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_follow_intersection_users(args):
    followee_user_id = args.get("followee_user_id")
    follower_user_id = args.get("follower_user_id")

    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = session.query(User).filter(
            User.is_current == True,
            User.user_id.in_(
                session.query(Follow.follower_user_id)
                .filter(
                    Follow.followee_user_id == followee_user_id,
                    Follow.is_current == True,
                    Follow.is_delete == False,
                )
                .intersect(
                    session.query(Follow.followee_user_id).filter(
                        Follow.follower_user_id == follower_user_id,
                        Follow.is_current == True,
                        Follow.is_delete == False,
                    )
                )
            ),
        )
        users = paginate_query(query).all()
        users = helpers.query_result_to_list(users)
        user_ids = [user[response_name_constants.user_id] for user in users]
        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

        # order by follower_count desc
        users.sort(
            key=lambda user: user[response_name_constants.follower_count], reverse=True
        )

    return users
