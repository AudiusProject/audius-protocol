import logging  # pylint: disable=C0302

from sqlalchemy import asc, func
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.tracks.track import Track
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_thread import CommentThread
from src.utils import redis_connection
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)

redis = redis_connection.get_redis()

COMMENT_THREADS_LIMIT = 5
COMMENT_REPLIES_LIMIT = 3


# Returns whether a comment has been reacted to by a particular user
def get_is_reacted(session, user_id, comment_id):
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


# Sum up reactions to a comment
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
        session.query(Comment)
        .join(CommentThread, Comment.comment_id == CommentThread.comment_id)
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
            "react_count": get_reaction_count(session, reply.comment_id),
            "is_pinned": reply.is_pinned,
            "is_current_user_reacted": get_is_reacted(
                session, current_user_id, reply.comment_id
            ),
            "is_artist_reacted": get_is_reacted(session, artist_id, reply.comment_id),
            "replies": None,
            "created_at": str(reply.created_at),
            "updated_at": str(reply.updated_at) if reply.updated_at else None,
        }
        for reply in replies
    ]


def get_comment_replies(args, comment_id, current_user_id):
    offset, limit = format_offset(args), format_limit(args)
    db = get_db_read_replica()
    with db.scoped_session() as session:
        replies = get_replies(session, comment_id, current_user_id, offset, limit)

    return replies


def get_track_comments(args, track_id, current_user_id):
    offset, limit = format_offset(args), format_limit(args, COMMENT_THREADS_LIMIT)

    track_comments = []
    db = get_db_read_replica()

    CommentThreadAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        artist_id = (
            session.query(Track).filter(Track.track_id == track_id).first().owner_id
        )

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
            .order_by(asc(Comment.created_at))
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
                "is_current_user_reacted": get_is_reacted(
                    session, current_user_id, track_comment.comment_id
                ),
                "is_artist_reacted": get_is_reacted(
                    session, artist_id, track_comment.comment_id
                ),
                "replies": get_replies(
                    session, track_comment.comment_id, current_user_id, artist_id
                ),
                "created_at": str(track_comment.created_at),
                "updated_at": str(track_comment.updated_at),
            }
            for track_comment in track_comments
        ]
