import logging
from datetime import datetime
from typing import List, Tuple, TypedDict

from sqlalchemy import func
from sqlalchemy.orm import Query, aliased
from sqlalchemy.orm.session import Session
from src.models.social.follow import Follow
from src.models.users.aggregate_user_tips import AggregateUserTip
from src.models.users.user import User
from src.models.users.user_tip import UserTip
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import paginate_query, populate_user_metadata
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetTipsArgs(TypedDict):
    limit: int
    offset: int
    user_id: int
    min_slot: int


class TipResult(TypedDict):
    amount: int
    sender: User
    receiver: User
    slot: int
    created_at: datetime
    followee_supporters: List[int]
    tx_signature: str


# Example of query with inputs:
# limit=100
# offset=0
# user_id=8
# min_slot=185524
# ---------------------------------------------------------
# WITH followees AS
# (
#     SELECT
#         follows.followee_user_id AS followee_user_id
#     FROM
#         follows
#     WHERE
#         follows.is_current = true
#         AND follows.is_delete = false
#         AND follows.follower_user_id = 8
# )
# ,
# tips AS
# (
#     SELECT
#         user_tips_1.signature AS signature,
#         user_tips_1.slot AS slot,
#         user_tips_1.sender_user_id AS sender_user_id,
#         user_tips_1.receiver_user_id AS receiver_user_id,
#         user_tips_1.amount AS amount,
#         user_tips_1.created_at AS created_at,
#         user_tips_1.updated_at AS updated_at
#     FROM
#         user_tips AS user_tips_1
#         JOIN
#             aggregate_user
#             ON aggregate_user.user_id = user_tips_1.receiver_user_id
#         JOIN
#             users
#             ON users.user_id = user_tips_1.receiver_user_id
#         LEFT OUTER JOIN
#             followees AS followees_for_receiver
#             ON user_tips_1.receiver_user_id = followees_for_receiver.followee_user_id
#     WHERE
#         AND users.is_current = true
#         AND user_tips_1.slot >= 185524
#         AND followees_for_receiver.followee_user_id IS NOT NULL
#     ORDER BY
#         user_tips_1.slot DESC LIMIT 100 OFFSET 0
# )
# ,
# followee_tippers AS
# (
#     SELECT
#         aggregate_user_tips.sender_user_id AS sender_user_id,
#         aggregate_user_tips.receiver_user_id AS receiver_user_id,
#         followees_for_aggregate.followee_user_id AS followee_user_id
#     FROM
#         followees AS followees_for_aggregate
#         LEFT OUTER JOIN
#             aggregate_user_tips
#             ON aggregate_user_tips.sender_user_id = followees_for_aggregate.followee_user_id
# )
# SELECT
#     tips.signature,
#     tips.slot,
#     tips.sender_user_id,
#     tips.receiver_user_id,
#     tips.amount,
#     tips.created_at,
#     tips.updated_at,
#     array_agg(followee_tippers.sender_user_id) AS array_agg_1
# FROM
#     tips
#     LEFT OUTER JOIN
#         followee_tippers
#         ON followee_tippers.receiver_user_id = tips.receiver_user_id
# GROUP BY
#     tips.signature,
#     tips.slot,
#     tips.sender_user_id,
#     tips.receiver_user_id,
#     tips.amount,
#     tips.created_at,
#     tips.updated_at
# ORDER BY
#     tips.slot DESC


def _get_tips(session: Session, args: GetTipsArgs):
    UserTipAlias = aliased(UserTip)
    query: Query = session.query(UserTipAlias)

    if args.get("min_slot", 0) > 0:
        query = query.filter(UserTipAlias.slot >= args["min_slot"])

    # Unique receivers
    distinct_inner = (
        query.order_by(UserTipAlias.receiver_user_id.asc(), UserTipAlias.slot.desc())
        .distinct(UserTipAlias.receiver_user_id)
        .subquery()
    )

    UserTipAlias = aliased(UserTip, distinct_inner, name="user_tips_uniqued")
    query = session.query(UserTipAlias)

    # We have to get the other users that this user follows for two uses:
    # 1) To filter tips to recipients the user follows
    # 2) To get the followees of the current user that have also tipped the receiver
    followees_query = (
        session.query(Follow.followee_user_id)
        .filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.follower_user_id == args["user_id"],
        )
        .cte("followees")
    )

    # filter the receivers to users the current user follows
    FolloweesReceiver = aliased(followees_query, name="followees_for_receiver")
    query = query.join(
        FolloweesReceiver,
        UserTipAlias.receiver_user_id == FolloweesReceiver.c.followee_user_id,
    )

    # Order and paginate before adding follower filters/aggregates
    query = query.order_by(UserTipAlias.slot.desc())
    query = paginate_query(query)

    # Get the tips for the user as a subquery
    # because now we need to get the other users that tipped that receiver
    # and joining on this already paginated/limited result will be much faster
    Tips = query.cte("tips")
    FolloweesAggregate = aliased(followees_query, name="followees_for_aggregate")

    # Get all of the followees joined on their aggregate user tips first
    # rather than joining each on the tips separately to help with speed
    FolloweeTippers = (
        session.query(
            AggregateUserTip.sender_user_id,
            AggregateUserTip.receiver_user_id,
            FolloweesAggregate.c.followee_user_id,
        )
        .select_from(FolloweesAggregate)
        .outerjoin(
            AggregateUserTip,
            AggregateUserTip.sender_user_id == FolloweesAggregate.c.followee_user_id,
        )
        .cte("followee_tippers")
    )
    # Now we have the tips listed multiple times, one for each followee sender.
    # So group by the tip and aggregate up the followee sender IDs into a list
    query = (
        session.query(UserTip, func.array_agg(FolloweeTippers.c.sender_user_id))
        .select_entity_from(Tips)
        .outerjoin(
            FolloweeTippers,
            FolloweeTippers.c.receiver_user_id == Tips.c.receiver_user_id,
        )
        .group_by(Tips)
    )

    query = query.order_by(UserTipAlias.slot.desc())
    query = paginate_query(query)

    tips_results: List[UserTip] = query.all()
    return tips_results


def get_tips(args: GetTipsArgs) -> List[TipResult]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        tips_results: List[Tuple[UserTip, List[int]]] = _get_tips(session, args)

        # Collect user IDs and fetch users
        user_ids = set()
        for result in tips_results:
            user_ids.add(result[0].sender_user_id)
            user_ids.add(result[0].receiver_user_id)
        users = get_unpopulated_users(session, user_ids)
        users = populate_user_metadata(
            session, user_ids, users, args["user_id"] if "user_id" in args else None
        )
        users_map = {}
        for user in users:
            users_map[user["user_id"]] = user

        # Not using model_to_dictionary() here because TypedDict complains about dynamic keys
        tips: List[TipResult] = [
            {
                "amount": result[0].amount,
                "sender": users_map[result[0].sender_user_id],
                "receiver": users_map[result[0].receiver_user_id],
                "followee_supporters": list(
                    filter(
                        lambda id: id is not None,
                        result[1],
                    )
                ),
                "slot": result[0].slot,
                "created_at": result[0].created_at,
                "tx_signature": result[0].signature,
            }
            for result in tips_results
        ]

        return tips


class TipIDResult(TypedDict):
    amount: int
    sender_id: int
    receiver_id: int
    slot: int
    created_at: datetime
    followee_supporters: List[int]
    tx_signature: str


def get_tip_ids(args: GetTipsArgs) -> List[TipIDResult]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        tips_results: List[Tuple[UserTip, List[int]]] = _get_tips(session, args)
        tips: List[TipIDResult] = [
            {
                "amount": result[0].amount,
                "sender_id": result[0].sender_user_id,
                "receiver_id": result[0].receiver_user_id,
                "followee_supporters": list(
                    filter(
                        lambda id: id is not None,
                        result[1],
                    )
                ),
                "slot": result[0].slot,
                "created_at": result[0].created_at,
                "tx_signature": result[0].signature,
            }
            for result in tips_results
        ]
        return tips
