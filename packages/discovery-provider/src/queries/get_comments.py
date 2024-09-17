import logging  # pylint: disable=C0302

from sqlalchemy import asc, desc, func
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.tracks.track import Track
from src.utils import redis_connection
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)

redis = redis_connection.get_redis()

COMMENT_THREADS_LIMIT = 5
COMMENT_REPLIES_LIMIT = 3


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
    return not is_react.is_delete if is_react else False


def get_replies(
    session,
    parent_comment_id,
    current_user_id,
    # artist id could already have been queried for the track
    artist_id=None,
    offset=0,
    limit=COMMENT_REPLIES_LIMIT,
):
    replies = (
        session.query(
            Comment, func.count(CommentReaction.comment_id).label("react_count")
        )
        .join(CommentThread, Comment.comment_id == CommentThread.comment_id)
        .outerjoin(CommentReaction, Comment.comment_id == CommentReaction.comment_id)
        .group_by(Comment.comment_id)
        .filter(CommentThread.parent_comment_id == parent_comment_id)
        .order_by(asc(Comment.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    if artist_id is None:
        artist_id = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .first()
            .owner_id
        )

    return [
        {
            "id": encode_int_id(reply.comment_id),
            "user_id": reply.user_id,
            "message": reply.text,
            "track_timestamp_s": reply.track_timestamp_s,
            "react_count": react_count,
            "is_pinned": reply.is_pinned,
            "is_current_user_reacted": get_is_reacted(
                session, current_user_id, reply.comment_id
            ),
            "is_artist_reacted": get_is_reacted(session, artist_id, reply.comment_id),
            "replies": None,
            "created_at": str(reply.created_at),
            "updated_at": str(reply.updated_at) if reply.updated_at else None,
        }
        for [reply, react_count] in replies
    ]


def get_reply_count(session, parent_comment_id):
    reply_count = (
        session.query(func.count(CommentThread.comment_id)).filter(
            CommentThread.parent_comment_id == parent_comment_id,
        )
    ).first()
    return reply_count[0]


def get_comment_replies(args, comment_id, current_user_id=None):
    offset, limit = format_offset(args), format_limit(args)
    db = get_db_read_replica()
    with db.scoped_session() as session:
        replies = get_replies(session, comment_id, current_user_id, offset, limit)

    return replies


def get_track_comments(args, track_id, current_user_id=None):
    offset, limit = format_offset(args), format_limit(args, COMMENT_THREADS_LIMIT)
    sort_method = args.get("sort_method", "top")
    if sort_method == "top":
        sort_method_order_by = desc(func.count(CommentReaction.comment_id))
    elif sort_method == "newest":
        sort_method_order_by = desc(Comment.created_at)
    elif sort_method == "timestamp":
        sort_method_order_by = asc(Comment.track_timestamp_s).nullslast()

    track_comments = []
    db = get_db_read_replica()

    CommentThreadAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        artist_id = (
            session.query(Track).filter(Track.track_id == track_id).first().owner_id
        )

        track_comments = (
            session.query(
                Comment, func.count(CommentReaction.comment_id).label("react_count")
            )
            .outerjoin(
                CommentThreadAlias,
                Comment.comment_id == CommentThreadAlias.comment_id,
            )
            .outerjoin(
                CommentReport,
                Comment.comment_id == CommentReport.comment_id,
            )
            .outerjoin(
                CommentReaction, Comment.comment_id == CommentReaction.comment_id
            )
            .group_by(Comment.comment_id)
            .filter(
                Comment.entity_id == track_id,
                Comment.entity_type == "Track",
                CommentThreadAlias.parent_comment_id
                == None,  # Check if parent_comment_id is null
                Comment.is_delete == False,
                (CommentReport.comment_id == None)
                | (current_user_id == None)
                | (CommentReport.user_id != current_user_id),
            )
            .order_by(desc(Comment.is_pinned), sort_method_order_by)
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
                "is_edited": track_comment.is_edited,
                "track_timestamp_s": track_comment.track_timestamp_s,
                "react_count": react_count,
                "is_current_user_reacted": get_is_reacted(
                    session, current_user_id, track_comment.comment_id
                ),
                "is_artist_reacted": get_is_reacted(
                    session, artist_id, track_comment.comment_id
                ),
                "replies": get_replies(
                    session, track_comment.comment_id, current_user_id, artist_id
                ),
                "reply_count": get_reply_count(session, track_comment.comment_id),
                "created_at": str(track_comment.created_at),
                "updated_at": str(track_comment.updated_at),
            }
            for [track_comment, react_count] in track_comments
        ]
