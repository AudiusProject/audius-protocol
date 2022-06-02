import logging
from typing import Any, Dict, List, Tuple, TypedDict

from sqlalchemy import Integer, column, func, text
from sqlalchemy.orm import aliased
from src.models import AggregateUserTips
from src.queries.query_helpers import get_users_by_id, paginate_query
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


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

# With supporter_user_id
# ----------------------------
# WITH rankings AS (
#   SELECT
#     rank() OVER (
#       ORDER BY
#         aggregate_user_tips.amount DESC
#     ) AS rank,
#     aggregate_user_tips.sender_user_id AS sender_user_id,
#     aggregate_user_tips.receiver_user_id AS receiver_user_id,
#     aggregate_user_tips.amount AS amount
#   FROM
#     aggregate_user_tips
#   WHERE
#     aggregate_user_tips.receiver_user_id = %(receiver_user_id_1) s
# )
# SELECT
#   rankings.rank AS rankings_rank,
#   rankings.sender_user_id AS rankings_sender_user_id,
#   rankings.receiver_user_id AS rankings_receiver_user_id,
#   rankings.amount AS rankings_amount
# FROM
#   rankings
# WHERE
#   rankings.sender_user_id = %(sender_user_id_1) s


def get_support_received_by_user(args) -> List[SupportResponse]:
    support: List[SupportResponse] = []
    receiver_user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    supporter_user_id = args.get("supporter_user_id", None)

    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = session.query(
            func.rank().over(order_by=AggregateUserTips.amount.desc()).label("rank"),
            AggregateUserTips,
        ).filter(AggregateUserTips.receiver_user_id == receiver_user_id)
        if supporter_user_id is not None:
            rankings = query.cte(name="rankings")
            RankingsAggregateUserTips = aliased(
                AggregateUserTips, rankings, name="aliased_rankings_tips"
            )
            query = (
                session.query(rankings.c.rank, RankingsAggregateUserTips)
                .select_from(rankings)
                .filter(RankingsAggregateUserTips.sender_user_id == supporter_user_id)
            )
        else:
            query = query.order_by(AggregateUserTips.amount.desc())
            query = paginate_query(query)
        logger.debug(f"get_support_for_user.py | {query}")
        rows: List[Tuple[int, AggregateUserTips]] = query.all()
        logger.debug(f"get_support_for_user.py | {rows}")

        user_ids = [row[1].sender_user_id for row in rows]
        users = get_users_by_id(session, user_ids, current_user_id)

        support = query_result_to_support_response(rows, users, user_is_sender=True)
    return support


sql_support_sent = text(
    """
SELECT rank, sender_user_id, receiver_user_id, amount 
FROM (
    SELECT
        RANK() OVER (PARTITION BY B.receiver_user_id ORDER BY B.amount DESC) AS rank
        , B.sender_user_id
        , B.receiver_user_id
        , B.amount
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
