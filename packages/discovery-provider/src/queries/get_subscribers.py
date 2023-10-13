from sqlalchemy.sql import text

from src.queries import response_name_constants
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

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
    subscriber_id asc
offset :offset
limit :limit;
"""
)


def get_subscribers_for_user(args):
    subscribers = []
    user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        rows = session.execute(
            sql,
            {"user_id": user_id, "limit": limit, "offset": offset},
        )
        subscriber_ids = [r[0] for r in rows]

        # get all users for above subscriber_ids
        subscribers = get_unpopulated_users(session, subscriber_ids)

        # bundle peripheral info into user results
        subscribers = populate_user_metadata(
            session, subscriber_ids, subscribers, current_user_id
        )

    return subscribers


def get_subscribers_for_users(args):
    subscribers = []
    user_ids = args.get("user_ids")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        for user_id in user_ids:
            rows = session.execute(
                sql,
                {"user_id": user_id, "limit": None, "offset": 0},
            )
            subscriber_ids = [encode_int_id(r[0]) for r in rows]
            subscribers.append(
                {
                    response_name_constants.user_id: encode_int_id(user_id),
                    response_name_constants.subscriber_ids: subscriber_ids,
                }
            )

    return subscribers
