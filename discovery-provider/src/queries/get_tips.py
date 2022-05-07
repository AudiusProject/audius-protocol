import logging
from typing import List, Optional, TypedDict

from sqlalchemy import or_
from sqlalchemy.orm import aliased
from sqlalchemy.orm.session import Session
from src.models import AggregateUser, Follow, User, UserTip
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import paginate_query, populate_user_metadata
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import query_result_to_list

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


def _get_tips(session: Session, args: GetTipsArgs):
    query = session.query(UserTip)
    if (
        "user_id" in args
        and args["user_id"] is not None
        and args["current_user_follows"] is not None
    ):
        followers_query = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False,
                Follow.follower_user_id == args["user_id"],
            )
            .cte("followers")
        )
        FollowSender = aliased(followers_query)
        FollowReceiver = aliased(followers_query)
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
    logger.debug(f"get_tips.py | query: {query}")
    tips_results: List[UserTip] = query.all()
    return tips_results


def get_tips(args: GetTipsArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        logger.debug(f"get_tips.py | {args}")
        tips_results = _get_tips(session, args)
        user_ids = set()
        for tip in tips_results:
            user_ids.add(tip.sender_user_id)
            user_ids.add(tip.receiver_user_id)
        users = get_unpopulated_users(session, user_ids)
        users = populate_user_metadata(
            session, user_ids, users, args["user_id"] if "user_id" in args else None
        )
        users_map = {}
        for user in users:
            users_map[user["user_id"]] = user
        tips = query_result_to_list(tips_results)
        for tip in tips:
            tip["sender"] = users_map[tip["sender_user_id"]]
            tip["receiver"] = users_map[tip["receiver_user_id"]]
        return tips
