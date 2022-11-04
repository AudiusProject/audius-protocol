from sqlalchemy.sql import text
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils.db_session import get_db_read_replica

sql = text(
    """
SELECT
    subscriber_id
from
    subscriptions
where
    user_id = :user_id
    and is_current = true
    and is_delete = false
order by
    user_id asc
offset :offset
limit :limit;
"""
)


def get_subscribers_for_users(args):
    subscribers = {}
    user_ids = args.get("user_ids")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:

        for user_id in user_ids:
            rows = session.execute(
                sql,
                {"user_id": user_id, "limit": limit, "offset": offset},
            )
            subscriber_ids = [r[0] for r in rows]
            subscribers[user_id] = subscriber_ids

    return subscribers
