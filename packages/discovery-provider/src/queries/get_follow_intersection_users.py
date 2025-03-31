from sqlalchemy.sql import text

from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils.db_session import get_db_read_replica

sql = text(
    """
select
  x.follower_user_id
from follows x
join aggregate_user au on x.follower_user_id = au.user_id
join follows me
  on me.follower_user_id = :my_id
  and me.followee_user_id = x.follower_user_id
  and me.is_delete = false
where x.followee_user_id = :other_user_id
  and x.is_delete = false
order by follower_count desc
limit :limit
offset :offset
"""
)


def get_follow_intersection_users(args):
    users = []
    my_id = args.get("my_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        rows = session.execute(sql, args)
        user_ids = [r[0] for r in rows]

        # get all users for above user_ids
        users = get_unpopulated_users(session, user_ids)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, my_id)

    return users
