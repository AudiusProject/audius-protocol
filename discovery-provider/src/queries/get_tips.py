import logging
from datetime import datetime
from typing import List, Optional, Tuple, TypedDict, Union, cast

from sqlalchemy import func, or_
from sqlalchemy.orm import Query, aliased
from sqlalchemy.orm.session import Session
from src.models import AggregateUser, AggregateUserTips, Follow, User, UserTip
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import paginate_query, populate_user_metadata
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetTipsArgs(TypedDict):
    limit: int
    offset: int
    user_id: Optional[int]
    receiver_min_followers: Optional[int]
    receiver_is_verified: Optional[bool]
    current_user_follows: Optional[str]
    unique_by: Optional[str]
    min_slot: int


class TipResult(TypedDict):
    amount: int
    sender: str
    receiver: str
    slot: int
    created_at: datetime
    followee_supporters: List[str]
    total_supporter_count: int


def _get_tips(session: Session, args: GetTipsArgs):
    query: Query = (
        session.query(UserTip, func.count(AggregateUserTips.sender_user_id))
        .join(
            AggregateUserTips,
            AggregateUserTips.receiver_user_id == UserTip.receiver_user_id,
        )
        .group_by(UserTip)
    )
    if "user_id" in args and args["user_id"] is not None:
        followers_query = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.follower_user_id == args["user_id"],
            )
            .cte("followers")
        )
        FollowersForAgg = aliased(followers_query, name="follows_for_agg_tips")
        query = query.add_columns(
            func.array_agg(FollowersForAgg.c.followee_user_id)
        ).outerjoin(
            FollowersForAgg,
            FollowersForAgg.c.followee_user_id == AggregateUserTips.sender_user_id,
        )
        if "current_user_follows" in args and args["current_user_follows"] is not None:
            FollowSender = aliased(followers_query, name="follows_for_sender")
            FollowReceiver = aliased(followers_query, name="follows_for_receiver")
            filter_cond = []
            if (
                args["current_user_follows"] == "receiver"
                or args["current_user_follows"] == "sender_or_receiver"
            ):
                query = query.outerjoin(
                    FollowReceiver,
                    UserTip.receiver_user_id == FollowReceiver.c.followee_user_id,
                )
                filter_cond.append(FollowReceiver.c.followee_user_id != None)
            if (
                args["current_user_follows"] == "sender"
                or args["current_user_follows"] == "sender_or_receiver"
            ):
                query = query.outerjoin(
                    FollowSender,
                    UserTip.sender_user_id == FollowSender.c.followee_user_id,
                )
                filter_cond.append(FollowSender.c.followee_user_id != None)
            query = query.filter(or_(*filter_cond))

    if (
        "receiver_min_followers" in args
        and args["receiver_min_followers"] is not None
        and args["receiver_min_followers"] > 0
    ):
        query = query.join(
            AggregateUser, AggregateUser.user_id == UserTip.receiver_user_id
        ).filter(AggregateUser.follower_count >= args["receiver_min_followers"])

    if "receiver_is_verified" in args and args["receiver_is_verified"] == True:
        query = query.join(User, User.user_id == UserTip.receiver_user_id).filter(
            User.is_current == True, User.is_verified == True
        )

    if "unique_by" in args and args["unique_by"] is not None:
        if args["unique_by"] == "sender":
            query = (
                query.order_by(UserTip.sender_user_id.asc(), UserTip.slot.desc())
                .distinct(UserTip.sender_user_id)
                .from_self()
            )
        elif args["unique_by"] == "receiver":
            query = (
                query.order_by(UserTip.receiver_user_id.asc(), UserTip.slot.desc())
                .distinct(UserTip.receiver_user_id)
                .from_self()
            )
    if "min_slot" in args and args["min_slot"] > 0:
        query = query.filter(UserTip.slot >= args["min_slot"])

    query = query.order_by(UserTip.slot.desc())
    query = paginate_query(query)
    tips_results: List[UserTip] = query.all()
    return tips_results


def get_tips(args: GetTipsArgs) -> List[TipResult]:
    db = get_db_read_replica()
    with db.scoped_session() as session:
        tips_results: Union[
            List[Tuple[UserTip, int, List[str]]], List[Tuple[UserTip, int]]
        ] = _get_tips(session, args)
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
                "total_supporter_count": result[1],
                "followee_supporters": list(
                    filter(
                        lambda id: id is not None,
                        # Have to cast until https://github.com/python/mypy/issues/1178 is fixed
                        cast(Tuple[UserTip, int, List[str]], result)[2],
                    )
                )
                if len(result) > 2
                else [],
                "slot": result[0].slot,
                "created_at": result[0].created_at,
            }
            for result in tips_results
        ]
        return tips
