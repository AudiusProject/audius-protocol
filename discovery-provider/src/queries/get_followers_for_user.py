from sqlalchemy.sql import text

from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils.db_session import get_db_read_replica

sql = text(
    """
SELECT
    follower_user_id
from
    follows
    left outer join aggregate_user on follower_user_id = user_id
where
    is_current = true
    and is_delete = false
    and followee_user_id = :followee_user_id
order by
    follower_count desc,
    user_id asc
offset :offset
limit :limit;
"""
)


def get_followers_for_user(args):
    users = []
    followee_user_id = args.get("followee_user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        rows = session.execute(
            sql,
            {"followee_user_id": followee_user_id, "limit": limit, "offset": offset},
        )
        user_ids = [r[0] for r in rows]

        # get all users for above user_ids
        users = get_unpopulated_users(session, user_ids)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

    return users
