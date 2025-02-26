import logging

from sqlalchemy import func

from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.models.moderation.muted_user import MutedUser
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)

# Constants
COMMENT_ROOT_DEFAULT_LIMIT = 15  # default pagination limit
COMMENT_REPLIES_DEFAULT_LIMIT = 3  # default replies pagination limit


# Returns whether a comment has been reacted to by a particular user
def get_is_reacted(session, user_id, comment_id):
    if not user_id:
        return False
    is_react = (
        session.query(CommentReaction)
        .filter(
            CommentReaction.user_id == user_id,
            CommentReaction.comment_id == comment_id,
            CommentReaction.is_delete == False,
        )
        .first()
    )
    return is_react is not None


def get_base_comments_query(session, current_user_id=None):
    """Base query builder for comments with common functionality"""
    mentioned_users = (
        session.query(
            CommentMention.comment_id,
            CommentMention.user_id,
            User.handle,
            CommentMention.is_delete,
        )
        .join(User, CommentMention.user_id == User.user_id)
        .subquery()
    )

    react_count_subquery = (
        session.query(
            CommentReaction.comment_id,
            func.count(CommentReaction.comment_id).label("react_count"),
        )
        .filter(CommentReaction.is_delete == False)
        .group_by(CommentReaction.comment_id)
        .subquery()
    )

    muted_by_karma = (
        session.query(MutedUser.muted_user_id)
        .join(AggregateUser, MutedUser.user_id == AggregateUser.user_id)
        .filter(MutedUser.is_delete == False)
        .group_by(MutedUser.muted_user_id)
        .having(func.sum(AggregateUser.follower_count) >= COMMENT_KARMA_THRESHOLD)
        .subquery()
    )

    return {
        "mentioned_users": mentioned_users,
        "react_count_subquery": react_count_subquery,
        "muted_by_karma": muted_by_karma,
    }


def _format_comment_response(
    comment,
    react_count,
    is_muted,
    mentions,
    current_user_id,
    session,
    include_replies=False,
    artist_id=None,
):
    """Common formatter for comment responses"""

    def remove_delete(mention):
        del mention["is_delete"]
        return mention

    def filter_mentions(mention):
        return mention["user_id"] is not None and mention["is_delete"] is not True

    response = {
        "id": encode_int_id(comment.comment_id),
        "entity_id": encode_int_id(comment.entity_id),
        "entity_type": comment.entity_type,
        "user_id": encode_int_id(comment.user_id) if not comment.is_delete else None,
        "mentions": list(map(remove_delete, filter(filter_mentions, mentions))),
        "message": comment.text if not comment.is_delete else "[Removed]",
        "is_edited": comment.is_edited,
        "track_timestamp_s": comment.track_timestamp_s,
        "react_count": react_count,
        "is_current_user_reacted": get_is_reacted(
            session, current_user_id, comment.comment_id
        ),
        "created_at": str(comment.created_at),
        "updated_at": str(comment.updated_at),
        "is_muted": is_muted if is_muted is not None else False,
    }

    if include_replies:
        from src.queries.comments.replies import get_replies

        replies = get_replies(
            session, comment.comment_id, current_user_id, artist_id, limit=None
        )
        reply_count = len(replies)
        response.update(
            {
                "reply_count": reply_count,
                "replies": replies[:3],
                "is_tombstone": comment.is_delete and reply_count > 0,
                "is_artist_reacted": (
                    get_is_reacted(session, artist_id, comment.comment_id)
                    if artist_id
                    else False
                ),
            }
        )

    return response


def get_muted_users(current_user_id):
    from src.queries.query_helpers import helpers, populate_user_metadata
    from src.utils.db_session import get_db_read_replica

    db = get_db_read_replica()
    users = []
    with db.scoped_session() as session:
        muted_users = (
            session.query(User)
            .join(MutedUser, MutedUser.muted_user_id == User.user_id)
            .filter(MutedUser.user_id == current_user_id, MutedUser.is_delete == False)
            .all()
        )
        muted_users_list = helpers.query_result_to_list(muted_users)
        user_ids = list(map(lambda user: user["user_id"], muted_users_list))
        users = populate_user_metadata(
            session, user_ids, muted_users_list, current_user_id
        )

    return users


def get_track_notification_setting(track_id, current_user_id):
    """
    Get notification settings for a track
    """
    if not current_user_id:
        return None

    db = get_db_read_replica()
    with db.scoped_session() as session:
        notification_setting = (
            session.query(CommentNotificationSetting)
            .filter(
                CommentNotificationSetting.entity_id == track_id,
                CommentNotificationSetting.entity_type == "Track",
                CommentNotificationSetting.user_id == current_user_id,
            )
            .first()
        )
        return notification_setting.is_muted if notification_setting else False


# New utility function to share common query logic
def build_comments_query(
    session,
    query_type,
    base_query,
    current_user_id=None,
    artist_id=None,
    entity_id=None,
    user_id=None,
    parent_comment_id=None,
    pinned_comment_id=None,
    sort_method="newest",
):
    """
    Build a query for comments with common filtering and sorting logic

    Args:
        session: Database session
        query_type: Type of query ('track', 'user', or 'replies')
        base_query: Base query components from get_base_comments_query
        current_user_id: ID of the user making the request
        artist_id: ID of the track owner (for track comments and replies)
        entity_id: ID of the entity (track) to get comments for
        user_id: ID of the user whose comments to retrieve (for user comments)
        parent_comment_id: ID of the parent comment (for replies)
        pinned_comment_id: ID of the pinned comment (for track comments)
        sort_method: How to sort the comments (top, newest, timestamp)

    Returns:
        SQLAlchemy query object
    """
    from sqlalchemy import and_, asc, desc, func, or_
    from sqlalchemy.orm import aliased

    from src.models.comments.comment import Comment
    from src.models.comments.comment_notification_setting import (
        CommentNotificationSetting,
    )
    from src.models.comments.comment_report import (
        COMMENT_KARMA_THRESHOLD,
        CommentReport,
    )
    from src.models.comments.comment_thread import CommentThread
    from src.models.moderation.muted_user import MutedUser
    from src.models.users.aggregate_user import AggregateUser

    mentioned_users = base_query["mentioned_users"]
    react_count_subquery = base_query["react_count_subquery"]

    CommentThreadAlias = aliased(CommentThread)

    # Determine sort order
    if sort_method == "top":
        sort_method_order_by = desc(
            func.coalesce(react_count_subquery.c.react_count, 0)
        )
    elif sort_method == "newest":
        sort_method_order_by = desc(Comment.created_at)
    elif sort_method == "timestamp":
        sort_method_order_by = asc(Comment.track_timestamp_s).nullslast()
    else:
        # Default to newest
        sort_method_order_by = desc(Comment.created_at)

    # Start building the query
    if query_type == "replies":
        # For replies, we use a simpler query structure
        query = session.query(
            Comment,
            func.count(CommentReaction.comment_id).label("react_count"),
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
        query = query.join(
            CommentThread, Comment.comment_id == CommentThread.comment_id
        )
        query = query.outerjoin(
            CommentReaction, Comment.comment_id == CommentReaction.comment_id
        )
    else:
        # For track and user comments
        query = session.query(
            Comment,
            func.coalesce(react_count_subquery.c.react_count, 0).label("react_count"),
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
        query = query.outerjoin(
            CommentThreadAlias, Comment.comment_id == CommentThreadAlias.comment_id
        )

    # Common joins for all query types
    query = query.outerjoin(
        mentioned_users, Comment.comment_id == mentioned_users.c.comment_id
    )
    query = query.outerjoin(
        CommentReport, Comment.comment_id == CommentReport.comment_id
    )
    query = query.outerjoin(
        AggregateUser, AggregateUser.user_id == CommentReport.user_id
    )

    # Add query-specific joins
    if query_type != "replies":
        query = query.outerjoin(
            react_count_subquery,
            Comment.comment_id == react_count_subquery.c.comment_id,
        )
        query = query.outerjoin(
            CommentNotificationSetting,
            (Comment.comment_id == CommentNotificationSetting.entity_id)
            & (CommentNotificationSetting.entity_type == "Comment"),
        )

    # Create a subquery to find muted users
    # This approach ensures we correctly filter out comments from users muted by either
    # the current user or the track owner
    muted_users_subquery = None
    if current_user_id is not None or artist_id is not None:
        muted_users_query = session.query(MutedUser.muted_user_id).filter(
            MutedUser.is_delete == False
        )

        mute_conditions = []
        if current_user_id is not None:
            mute_conditions.append(MutedUser.user_id == current_user_id)
        if artist_id is not None and query_type != "user":
            mute_conditions.append(MutedUser.user_id == artist_id)

        if mute_conditions:
            muted_users_query = muted_users_query.filter(or_(*mute_conditions))
            muted_users_subquery = muted_users_query.subquery()

    # Add query-specific filters
    if query_type == "track":
        # For track comments
        query = query.filter(
            Comment.entity_id == entity_id,
            Comment.entity_type == "Track",
            CommentThreadAlias.parent_comment_id
            == None,  # Check if parent_comment_id is null
        )

        # Add ReplyCountAlias for track comments to handle tombstone comments
        ReplyCountAlias = aliased(CommentThread)
        query = query.outerjoin(
            ReplyCountAlias, Comment.comment_id == ReplyCountAlias.parent_comment_id
        )
        query = query.group_by(
            Comment.comment_id,
            react_count_subquery.c.react_count,
            CommentNotificationSetting.is_muted,
        )

        # For track comments, we want to include tombstone comments (deleted comments with replies)
        # This is important for maintaining thread context
        query = query.having(
            (func.count(ReplyCountAlias.comment_id) > 0) | (Comment.is_delete == False),
        )
    elif query_type == "user":
        # For user comments
        query = query.filter(
            Comment.user_id == user_id,
            Comment.is_delete == False,  # Don't show deleted comments in user profile
            Comment.is_visible == True,
            Comment.entity_type == "Track",
        )
        query = query.group_by(
            Comment.comment_id,
            react_count_subquery.c.react_count,
            CommentNotificationSetting.is_muted,
        )
    elif query_type == "replies":
        # For replies
        query = query.filter(
            CommentThread.parent_comment_id == parent_comment_id,
            Comment.is_delete == False,  # Don't show deleted replies
        )
        query = query.group_by(Comment.comment_id)

    # Common filters for all query types
    query = query.filter(
        or_(
            CommentReport.comment_id == None,
            and_(
                CommentReport.user_id != current_user_id,
                CommentReport.is_delete == True,
            ),
        )
    )

    # Filter out comments from muted users, but always show comments to their owners
    if muted_users_subquery is not None:
        if current_user_id is not None:
            query = query.filter(
                or_(
                    Comment.user_id
                    == current_user_id,  # Always show user's own comments
                    ~Comment.user_id.in_(
                        muted_users_subquery
                    ),  # Filter out muted users
                )
            )
        else:
            query = query.filter(~Comment.user_id.in_(muted_users_subquery))

    # Add artist_id filter for track comments and replies
    if artist_id is not None and query_type != "user":
        query = query.filter(
            or_(
                CommentReport.user_id == None,
                CommentReport.user_id != artist_id,
            )
        )

    # Add karma threshold for track and user comments
    if query_type != "replies":
        query = query.having(
            func.coalesce(func.sum(AggregateUser.follower_count), 0)
            < COMMENT_KARMA_THRESHOLD,
        )

    # Add sorting
    if query_type == "track" and pinned_comment_id is not None:
        query = query.order_by(
            # pinned comments at the top, tombstone comments at the bottom, then all others inbetween
            desc(Comment.comment_id == pinned_comment_id),
            asc(Comment.is_delete),  # required for tombstone
            sort_method_order_by,
            desc(func.sum(AggregateUser.follower_count)),  # karma
            desc(Comment.created_at),
        )
    elif query_type == "track" and sort_method == "timestamp":
        # For timestamp sorting, we need special handling to ensure tombstone comments appear at the end
        query = query.order_by(
            asc(Comment.is_delete),  # Non-deleted comments first
            sort_method_order_by,  # Then sort by timestamp
            desc(func.sum(AggregateUser.follower_count)),  # karma
            desc(Comment.created_at),
        )
    elif query_type == "replies":
        query = query.order_by(asc(Comment.created_at))
    else:
        query = query.order_by(
            sort_method_order_by,
            desc(func.sum(AggregateUser.follower_count)),  # karma
            desc(Comment.created_at),
        )

    return query
