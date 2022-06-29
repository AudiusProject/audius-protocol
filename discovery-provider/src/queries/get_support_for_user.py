import logging
from typing import Any, Dict, List, Tuple, TypedDict

from sqlalchemy import func
from sqlalchemy.orm import aliased
from src.models.users.aggregate_user_tips import AggregateUserTips
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


# Without supporter_user_id:
# ----------------------------
# SELECT
#   rank() OVER (
#     ORDER BY
#       aggregate_user_tips.amount DESC
#   ) AS rank,
#   aggregate_user_tips.sender_user_id AS aggregate_user_tips_sender_user_id,
#   aggregate_user_tips.receiver_user_id AS aggregate_user_tips_receiver_user_id,
#   aggregate_user_tips.amount AS aggregate_user_tips_amount
# FROM
#   aggregate_user_tips
# WHERE
#   aggregate_user_tips.receiver_user_id = %(receiver_user_id_1) s
# ORDER BY
#   aggregate_user_tips.amount DESC, aggregate_user_tips.sender_user_id ASC
# LIMIT
#   %(param_1) s OFFSET %(param_2) s


# With supporter_user_id:
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

        # Filter to supporter we care about after ranking
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
        # Only paginate if not looking for single supporter
        else:
            query = query.order_by(
                AggregateUserTips.amount.desc(), AggregateUserTips.sender_user_id.asc()
            )
            query = paginate_query(query)

        rows: List[Tuple[int, AggregateUserTips]] = query.all()
        user_ids = [row[1].sender_user_id for row in rows]
        users = get_users_by_id(session, user_ids, current_user_id)

        support = query_result_to_support_response(rows, users, user_is_sender=True)
    return support


# Without supported_user_id:
# ----------------------------
# SELECT
#   rankings.rank AS rankings_rank,
#   rankings.sender_user_id AS rankings_sender_user_id,
#   rankings.receiver_user_id AS rankings_receiver_user_id,
#   rankings.amount AS rankings_amount
# FROM
#   (
#     SELECT
#       rank() OVER (
#         PARTITION BY joined_aggregate_tips.receiver_user_id
#         ORDER BY joined_aggregate_tips.amount DESC
#       ) AS rank,
#       joined_aggregate_tips.sender_user_id AS sender_user_id,
#       joined_aggregate_tips.receiver_user_id AS receiver_user_id,
#       joined_aggregate_tips.amount AS amount
#     FROM
#       aggregate_user_tips
#       JOIN
#         aggregate_user_tips AS joined_aggregate_tips
#         ON joined_aggregate_tips.receiver_user_id = aggregate_user_tips.receiver_user_id
#     WHERE
#       aggregate_user_tips.sender_user_id = % (sender_user_id_1)s
#   )
#   AS rankings
# WHERE
#   rankings.sender_user_id = % (sender_user_id_2)s
# ORDER BY
#   rankings.amount DESC,
#   rankings.receiver_user_id ASC LIMIT % (param_1)s OFFSET % (param_2)s


# With supported_user_id:
# ----------------------------
# SELECT
#   rankings.rank AS rankings_rank,
#   rankings.sender_user_id AS rankings_sender_user_id,
#   rankings.receiver_user_id AS rankings_receiver_user_id,
#   rankings.amount AS rankings_amount
# FROM
#   (
#     SELECT
#       rank() OVER (
#         PARTITION BY joined_aggregate_tips.receiver_user_id
#         ORDER BY joined_aggregate_tips.amount DESC
#       ) AS rank,
#       joined_aggregate_tips.sender_user_id AS sender_user_id,
#       joined_aggregate_tips.receiver_user_id AS receiver_user_id,
#       joined_aggregate_tips.amount AS amount
#     FROM
#       aggregate_user_tips
#       JOIN
#         aggregate_user_tips AS joined_aggregate_tips
#         ON joined_aggregate_tips.receiver_user_id = aggregate_user_tips.receiver_user_id
#     WHERE
#       aggregate_user_tips.sender_user_id = % (sender_user_id_1)s
#       AND aggregate_user_tips.receiver_user_id = % (receiver_user_id_1)s
#   )
#   AS rankings
# WHERE
#   rankings.sender_user_id = % (sender_user_id_2)s


def get_support_sent_by_user(args) -> List[SupportResponse]:
    support: List[SupportResponse] = []
    sender_user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    supported_user_id = args.get("supported_user_id", None)

    db = get_db_read_replica()
    with db.scoped_session() as session:
        AggregateUserTipsB = aliased(AggregateUserTips, name="joined_aggregate_tips")
        query = (
            session.query(
                func.rank()
                .over(
                    partition_by=AggregateUserTipsB.receiver_user_id,
                    order_by=AggregateUserTipsB.amount.desc(),
                )
                .label("rank"),
                AggregateUserTipsB,
            )
            .select_from(AggregateUserTips)
            .join(
                AggregateUserTipsB,
                AggregateUserTipsB.receiver_user_id
                == AggregateUserTips.receiver_user_id,
            )
            .filter(AggregateUserTips.sender_user_id == sender_user_id)
        )

        # Filter to the receiver we care about early
        if supported_user_id is not None:
            query = query.filter(
                AggregateUserTips.receiver_user_id == supported_user_id
            )

        subquery = query.subquery(name="rankings")
        AggregateUserTipsAlias = aliased(
            AggregateUserTips, subquery, name="aggregate_user_tips_alias"
        )
        query = (
            session.query(subquery.c.rank, AggregateUserTipsAlias)
            .select_from(subquery)
            .filter(AggregateUserTipsAlias.sender_user_id == sender_user_id)
        )

        # Only paginate if not looking for single supporting
        if supported_user_id is None:
            query = query.order_by(
                AggregateUserTipsAlias.amount.desc(),
                AggregateUserTipsAlias.receiver_user_id.asc(),
            )
            query = paginate_query(query)

        rows: List[Tuple[int, AggregateUserTips]] = query.all()
        user_ids = [row[1].receiver_user_id for row in rows]
        users = get_users_by_id(session, user_ids, current_user_id)

        support = query_result_to_support_response(rows, users, user_is_sender=False)
    return support
