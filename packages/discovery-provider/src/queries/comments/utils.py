import logging

from sqlalchemy import func

from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD
from src.models.moderation.muted_user import MutedUser
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
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
    from src.utils.db_session import get_db_read_replica

    db = get_db_read_replica()
    with db.scoped_session() as session:
        notification_setting = (
            session.query(
                CommentNotificationSetting, CommentNotificationSetting.is_muted
            )
            .filter(
                CommentNotificationSetting.user_id == current_user_id,
                CommentNotificationSetting.entity_id == track_id,
                CommentNotificationSetting.entity_type == "Track",
            )
            .first()
        )

        return {
            "is_muted": notification_setting.is_muted if notification_setting else False
        }
