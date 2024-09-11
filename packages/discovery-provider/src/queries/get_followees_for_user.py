from sqlalchemy.sql import text

from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils.db_session import get_db_read_replica

sql = text(
    """
SELECT
    followee_user_id
from
    follows
    join users on users.user_id = follows.followee_user_id
    left outer join aggregate_user on followee_user_id = aggregate_user.user_id
where
    follows.is_current = true
    and follows.is_delete = false
    and users.is_deactivated = false
    and follower_user_id = :follower_user_id
order by
    follower_count desc,
    aggregate_user.user_id asc
offset :offset
limit :limit;
"""
)


def get_followees_for_user(args):
    users = []
    follower_user_id = args.get("follower_user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        rows = session.execute(
            sql,
            {"follower_user_id": follower_user_id, "limit": limit, "offset": offset},
        )
        user_ids = [r[0] for r in rows]

        # get all users for above user_ids
        users = get_unpopulated_users(session, user_ids)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

    return users
