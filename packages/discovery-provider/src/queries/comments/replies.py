import logging

from sqlalchemy import and_, asc, func, or_

from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.tracks.track import Track
from src.queries.comments.utils import (
    COMMENT_REPLIES_DEFAULT_LIMIT,
    _format_comment_response,
    get_base_comments_query,
)
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


# Define these functions locally to break the circular import
def format_limit(args, max_limit=100, default_limit=COMMENT_REPLIES_DEFAULT_LIMIT):
    """
    Returns the limit from the args, bounded by max_limit and default_limit if not present
    """
    if "limit" in args and args["limit"] is not None:
        limit = min(args["limit"], max_limit)
    else:
        limit = default_limit
    return limit


def format_offset(args, max_offset=100000):
    """
    Returns the offset from the args, bounded by max_offset
    """
    if "offset" in args and args["offset"] is not None:
        return min(args["offset"], max_offset)
    return 0


def get_replies(
    session,
    parent_comment_id,
    current_user_id,
    # note: artist id already exists when used via get_track_comments - no need to requery for it
    artist_id=None,
    offset=0,
    limit=COMMENT_REPLIES_DEFAULT_LIMIT,
):
    """
    Get replies to a specific comment

    Args:
        session: Database session
        parent_comment_id: ID of the parent comment to get replies for
        current_user_id: ID of the user making the request
        artist_id: ID of the track owner (optional)
        offset: Pagination offset
        limit: Pagination limit

    Returns:
        List of reply objects with metadata
    """
    if artist_id is None:
        artist_id = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .first()
            .owner_id
        )

    base_query = get_base_comments_query(session, current_user_id)
    mentioned_users = base_query["mentioned_users"]
    muted_by_karma = base_query["muted_by_karma"]

    replies = (
        session.query(
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
        .join(CommentThread, Comment.comment_id == CommentThread.comment_id)
        .outerjoin(CommentReaction, Comment.comment_id == CommentReaction.comment_id)
        .outerjoin(
            mentioned_users,
            Comment.comment_id == mentioned_users.c.comment_id,
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
                current_user_id != Comment.user_id,
            ),
        )
        .outerjoin(CommentReport, Comment.comment_id == CommentReport.comment_id)
        .group_by(Comment.comment_id)
        .filter(
            CommentThread.parent_comment_id == parent_comment_id,
            Comment.is_delete == False,
            or_(
                MutedUser.muted_user_id == None,
                MutedUser.is_delete == True,
            ),  # Exclude muted users' comments
            or_(
                CommentReport.comment_id == None,
                and_(
                    CommentReport.user_id != current_user_id,
                    CommentReport.user_id != artist_id,
                ),
                CommentReport.is_delete == True,
            ),
        )
        .order_by(asc(Comment.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        _format_comment_response(
            reply,
            react_count,
            None,
            mentions,
            current_user_id,
            session,
            include_replies=False,
            artist_id=artist_id,
        )
        for reply, react_count, mentions in replies
    ]


def get_paginated_replies(args, comment_id, current_user_id=None):
    """
    Get paginated replies to a comment (API endpoint handler)

    Args:
        args: Dictionary containing query parameters
            - offset: Pagination offset
            - limit: Pagination limit
        comment_id: ID of the comment to get replies for
        current_user_id: ID of the user making the request

    Returns:
        List of reply objects with metadata
    """
    offset, limit = format_offset(args), format_limit(args)
    db = get_db_read_replica()
    with db.scoped_session() as session:
        replies = get_replies(
            session,
            comment_id,
            current_user_id,
            artist_id=None,
            offset=offset,
            limit=limit,
        )

    return replies
