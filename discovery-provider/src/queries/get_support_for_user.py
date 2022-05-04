from typing import Any, Dict, List, Tuple, TypedDict

from sqlalchemy import Integer, column, text
from src.models import AggregateUserTips
from src.queries.query_helpers import get_users_by_id
from src.utils.db_session import get_db_read_replica

sql_support_received = text(
    """
SELECT
    RANK() OVER (ORDER BY amount DESC) AS rank
    , sender_user_id
    , receiver_user_id
    , amount
FROM aggregate_user_tips
WHERE receiver_user_id = :receiver_user_id
ORDER BY amount DESC
LIMIT :limit
OFFSET :offset;
"""
).columns(
    column("rank", Integer),
    AggregateUserTips.sender_user_id,
    AggregateUserTips.receiver_user_id,
    AggregateUserTips.amount,
)


sql_support_sent = text(
    """
SELECT rank, sender_user_id, receiver_user_id, amount 
FROM (
    SELECT 
        B.sender_user_id
        , B.receiver_user_id
        , B.amount
        , RANK() OVER (PARTITION BY B.receiver_user_id ORDER BY B.amount DESC) AS rank
    FROM aggregate_user_tips A
    JOIN aggregate_user_tips B ON A.receiver_user_id = B.receiver_user_id
    WHERE A.sender_user_id = :sender_user_id
) rankings
WHERE sender_user_id = :sender_user_id
ORDER BY amount DESC, receiver_user_id ASC
LIMIT :limit
OFFSET :offset;
"""
).columns(
    column("rank", Integer),
    AggregateUserTips.sender_user_id,
    AggregateUserTips.receiver_user_id,
    AggregateUserTips.amount,
)


class SupportResponse(TypedDict):
    rank: int
    amount: int
    user: Any


def query_result_to_support_response(
    results, users: Dict[int, Any], user_is_sender: bool
) -> List[SupportResponse]:
    return [
        {
            "rank": row[0],
            "amount": row[1].amount,
            "user": users[
                row[1].sender_user_id if user_is_sender else row[1].receiver_user_id
            ],
        }
        for row in results
    ]


def get_support_received_by_user(args) -> List[SupportResponse]:
    support: List[SupportResponse] = []
    receiver_user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit", 100)
    offset = args.get("offset", 0)

    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query("rank", AggregateUserTips)
            .from_statement(sql_support_received)
            .params(receiver_user_id=receiver_user_id, limit=limit, offset=offset)
        )
        rows: List[Tuple[int, AggregateUserTips]] = query.all()

        user_ids = [row[1].sender_user_id for row in rows]
        users = get_users_by_id(session, user_ids, current_user_id)

        support = query_result_to_support_response(rows, users, user_is_sender=True)
    return support


def get_support_sent_by_user(args) -> List[SupportResponse]:
    support: List[SupportResponse] = []
    sender_user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query("rank", AggregateUserTips)
            .from_statement(sql_support_sent)
            .params(sender_user_id=sender_user_id, limit=limit, offset=offset)
        )
        rows: List[Tuple[int, AggregateUserTips]] = query.all()

        user_ids = [row[1].receiver_user_id for row in rows]
        users = get_users_by_id(session, user_ids, current_user_id)

        support = query_result_to_support_response(rows, users, user_is_sender=False)
    return support
