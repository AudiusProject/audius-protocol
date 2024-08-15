import logging  # pylint: disable=C0302

from sqlalchemy import desc, func
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_thread import CommentThread
from src.utils import redis_connection
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)

redis = redis_connection.get_redis()

COMMENT_THREADS_LIMIT = 5
COMMENT_REPLIES_LIMIT = 3


def get_replies(session, parent_comment_id):
    replies = (
        session.query(Comment)
        .join(CommentThread, Comment.comment_id == CommentThread.comment_id)
        .filter(CommentThread.parent_comment_id == parent_comment_id)
        .limit(COMMENT_REPLIES_LIMIT)
        .all()
    )
    return [
        {
            "id": encode_int_id(reply.comment_id),
            "userId": reply.user_id,  # Assuming user_id is an attribute of Comment
            "message": reply.text,
            "track_timestamp_s": reply.track_timestamp_s,
            "react_count": (
                reply.react_count if hasattr(reply, "react_count") else 0
            ),  # Adjust as needed
            "is_pinned": reply.is_pinned,
            "replies": None,
            "created_at": str(reply.created_at),
            "updated_at": str(reply.updated_at) if reply.updated_at else None,
        }
        for reply in replies
    ]


def get_reaction_count(session, parent_comment_id):
    reaction_count = (
        session.query(func.count(CommentReaction.comment_id))
        .filter(
            CommentReaction.comment_id == parent_comment_id,
            CommentReaction.is_delete == False,
        )
        .first()
    )
    return reaction_count[0]


def get_track_comments(args, track_id):
    offset, limit = format_offset(args), format_limit(args, COMMENT_THREADS_LIMIT)

    track_comments = []
    db = get_db_read_replica()

    CommentThreadAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        track_comments = (
            session.query(Comment)
            .outerjoin(
                CommentThreadAlias,
                Comment.comment_id == CommentThreadAlias.comment_id,
            )
            .filter(
                Comment.entity_id == track_id,
                Comment.entity_type == "Track",
                CommentThreadAlias.parent_comment_id
                == None,  # Check if parent_comment_id is null
                Comment.is_delete == False,
            )
            .order_by(desc(Comment.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": encode_int_id(track_comment.comment_id),
                "user_id": track_comment.user_id,
                "message": track_comment.text,
                "is_pinned": track_comment.is_pinned,
                "track_timestamp_s": track_comment.track_timestamp_s,
                "react_count": get_reaction_count(session, track_comment.comment_id),
                "replies": get_replies(session, track_comment.comment_id),
                "created_at": str(track_comment.created_at),
                "updated_at": str(track_comment.updated_at),
            }
            for track_comment in track_comments
        ]
