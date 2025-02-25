import logging
from typing import TypedDict

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD, CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.users.aggregate_user import AggregateUser
from src.queries.comments.utils import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    _format_comment_response,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetUserCommentsArgs(TypedDict):
    sort_method: str
    offset: int
    limit: int
    user_id: int
    current_user_id: int


def get_user_comments(args: GetUserCommentsArgs):
    """
    Get comments made by a specific user

    Args:
        args: Dictionary containing query parameters
            - user_id: ID of the user whose comments to retrieve
            - current_user_id: ID of the user making the request
            - sort_method: How to sort the comments (defaults to newest)
            - offset: Pagination offset
            - limit: Pagination limit

    Returns:
        List of comment objects with metadata
    """
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    user_id = args["user_id"]
    current_user_id = args["current_user_id"]
    db = get_db_read_replica()
    CommentThreadAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        base_query = get_base_comments_query(session, current_user_id)
        mentioned_users = base_query["mentioned_users"]
        react_count_subquery = base_query["react_count_subquery"]
        muted_by_karma = base_query["muted_by_karma"]

        # For user comments, we always sort by newest
        sort_method_order_by = desc(Comment.created_at)

        user_comments = (
            session.query(
                Comment,
                func.coalesce(react_count_subquery.c.react_count, 0).label(
                    "react_count"
                ),
                CommentNotificationSetting.is_muted,
                func.array_agg(
                    func.json_build_object(
                        "user_id",
                        mentioned_users.c.user_id,
                        "handle",
                        mentioned_users.c.handle,
                        "is_delete",
                        mentioned_users.c.is_delete,
                    )
                ).label("mentions"),
            )
            .outerjoin(
                CommentThreadAlias, Comment.comment_id == CommentThreadAlias.comment_id
            )
            .outerjoin(CommentReport, Comment.comment_id == CommentReport.comment_id)
            .outerjoin(AggregateUser, AggregateUser.user_id == CommentReport.user_id)
            .outerjoin(
                mentioned_users, Comment.comment_id == mentioned_users.c.comment_id
            )
            .outerjoin(
                react_count_subquery,
                Comment.comment_id == react_count_subquery.c.comment_id,
            )
            .outerjoin(
                MutedUser,
                and_(
                    MutedUser.muted_user_id == Comment.user_id,
                    or_(
                        MutedUser.user_id == current_user_id,
                        MutedUser.muted_user_id.in_(muted_by_karma),
                    ),
                    current_user_id != Comment.user_id,  # show comment to comment owner
                ),
            )
            .outerjoin(
                CommentNotificationSetting,
                (Comment.comment_id == CommentNotificationSetting.entity_id)
                & (CommentNotificationSetting.entity_type == "Comment"),
            )
            .group_by(
                Comment.comment_id,
                react_count_subquery.c.react_count,
                CommentNotificationSetting.is_muted,
            )
            .filter(
                Comment.user_id == user_id,
                Comment.is_delete == False,
                Comment.is_visible == True,
                Comment.entity_type == "Track",
                or_(
                    CommentReport.comment_id == None,
                    and_(
                        CommentReport.user_id != current_user_id,
                    ),
                    CommentReport.is_delete == True,
                ),
                or_(
                    MutedUser.muted_user_id == None,
                    MutedUser.is_delete == True,
                ),  # Exclude muted users' comments
            )
            # Ensure that the combined follower count of all users who reported the comment is below the threshold.
            .having(
                func.coalesce(func.sum(AggregateUser.follower_count), 0)
                < COMMENT_KARMA_THRESHOLD,
            )
            .order_by(
                sort_method_order_by,
                desc(func.sum(AggregateUser.follower_count)),  # karma
            )
            .offset(offset)
            .limit(limit)
        ).all()

        return [
            _format_comment_response(
                comment,
                react_count,
                is_muted,
                mentions,
                current_user_id,
                session,
                include_replies=False,  # User comments don't include nested replies
            )
            for comment, react_count, is_muted, mentions in user_comments
        ]
