import logging

from sqlalchemy import and_, asc, desc, func, or_
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD, CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.queries.comments.utils import (
    COMMENT_ROOT_DEFAULT_LIMIT,
    _format_comment_response,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_track_comments(args, track_id, current_user_id=None):
    """
    Get comments for a specific track

    Args:
        args: Dictionary containing query parameters
            - sort_method: How to sort the comments (top, newest, timestamp)
            - offset: Pagination offset
            - limit: Pagination limit
        track_id: ID of the track to get comments for
        current_user_id: ID of the user making the request

    Returns:
        List of comment objects with metadata
    """
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    db = get_db_read_replica()
    CommentThreadAlias = aliased(CommentThread)
    ReplyCountAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        base_query = get_base_comments_query(session, current_user_id)
        mentioned_users = base_query["mentioned_users"]
        react_count_subquery = base_query["react_count_subquery"]
        muted_by_karma = base_query["muted_by_karma"]

        # default to top sort
        sort_method = args.get("sort_method", "top")
        if sort_method == "top":
            sort_method_order_by = desc(
                func.coalesce(react_count_subquery.c.react_count, 0)
            )  # Ordering by reaction count in descending order
        elif sort_method == "newest":
            sort_method_order_by = desc(Comment.created_at)
        elif sort_method == "timestamp":
            sort_method_order_by = asc(Comment.track_timestamp_s).nullslast()

        track = session.query(Track).filter(Track.track_id == track_id).first()
        artist_id = track.owner_id
        pinned_comment_id = track.pinned_comment_id

        track_comments = (
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
                        MutedUser.user_id == artist_id,
                        MutedUser.muted_user_id.in_(muted_by_karma),
                    ),
                    current_user_id != Comment.user_id,  # show comment to comment owner
                ),
            )
            .outerjoin(
                ReplyCountAlias, Comment.comment_id == ReplyCountAlias.parent_comment_id
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
                Comment.entity_id == track_id,
                Comment.entity_type == "Track",
                CommentThreadAlias.parent_comment_id
                == None,  # Check if parent_comment_id is null
                or_(
                    CommentReport.comment_id == None,
                    and_(
                        CommentReport.user_id != current_user_id,
                        CommentReport.user_id != artist_id,
                    ),
                    CommentReport.is_delete == True,
                ),
                or_(
                    MutedUser.muted_user_id == None,
                    MutedUser.is_delete == True,
                ),  # Exclude muted users' comments
            )
            .having(
                (func.count(ReplyCountAlias.comment_id) > 0)
                | (Comment.is_delete == False),
            )
            # Ensure that the combined follower count of all users who reported the comment is below the threshold.
            .having(
                func.coalesce(func.sum(AggregateUser.follower_count), 0)
                < COMMENT_KARMA_THRESHOLD,
            )
            .order_by(
                # pinned comments at the top, tombstone comments at the bottom, then all others inbetween
                desc(Comment.comment_id == pinned_comment_id),
                asc(Comment.is_delete),  # required for tombstone
                sort_method_order_by,
                desc(func.sum(AggregateUser.follower_count)),  # karma
                desc(Comment.created_at),
            )
            .offset(offset)
            .limit(limit)
        )

        return [
            _format_comment_response(
                comment,
                react_count,
                is_muted,
                mentions,
                current_user_id,
                session,
                include_replies=True,
                artist_id=artist_id,
            )
            for comment, react_count, is_muted, mentions in track_comments.all()
        ]
