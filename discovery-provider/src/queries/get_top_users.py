from src.queries.query_helpers import get_pagination_vars, populate_user_metadata
from src.utils.db_session import get_db_read_replica

sql = """
select users.*
from users
join aggregate_user using (user_id)
where
    is_current
    and user_id in (
        select user_id from aggregate_user
        where track_count > 0
        order by follower_count desc
        limit :limit
        offset :offset
    )
order by follower_count desc, user_id asc;
"""


def get_top_users(current_user_id):
    """Gets the top users by follows of all of Audius"""

    top_users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        (limit, offset) = get_pagination_vars()
        top_users = session.execute(sql, {"limit": limit, "offset": offset})
        top_users = [dict(row) for row in top_users]
        user_ids = list(map(lambda user: user["user_id"], top_users))
        top_users = populate_user_metadata(
            session, user_ids, top_users, current_user_id
        )
    return top_users
