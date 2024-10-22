import logging  # pylint: disable=C0302

from sqlalchemy import and_, asc, desc, func, or_
from sqlalchemy.orm import aliased

from src.api.v1.helpers import format_limit, format_offset
from src.models.comments.comment import Comment
from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD, CommentReport
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.queries.query_helpers import helpers, populate_user_metadata
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
    # note: artist id already exists when used via get_track_comments - no need to requery for it
    artist_id=None,
    offset=0,
    limit=COMMENT_REPLIES_LIMIT,
):
    muted_by_karma = (
        session.query(MutedUser.muted_user_id)
        .join(AggregateUser, MutedUser.user_id == AggregateUser.user_id)
        .filter(MutedUser.is_delete == False)
        .group_by(MutedUser.muted_user_id)
        .having(func.sum(AggregateUser.follower_count) > COMMENT_KARMA_THRESHOLD)
        .subquery()
    )

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
                current_user_id == None,
                CommentReport.user_id != current_user_id,
                CommentReport.user_id != artist_id,
                CommentReport.is_delete == True,
            ),
        )
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

    def remove_delete(mention):
        del mention["is_delete"]
        return mention

    def filter_mentions(mention):
        return mention["user_id"] is not None and mention["is_delete"] is not True

    return [
        {
            "id": encode_int_id(reply.comment_id),
            "user_id": encode_int_id(reply.user_id),
            "message": reply.text,
            "mentions": list(map(remove_delete, filter(filter_mentions, mentions))),
            "track_timestamp_s": reply.track_timestamp_s,
            "react_count": react_count,
            "is_current_user_reacted": get_is_reacted(
                session, current_user_id, reply.comment_id
            ),
            "is_artist_reacted": get_is_reacted(session, artist_id, reply.comment_id),
            "replies": None,
            "created_at": str(reply.created_at),
            "updated_at": str(reply.updated_at) if reply.updated_at else None,
        }
        for [reply, react_count, mentions] in replies
    ]


# This method is only used by the API endpoint to get paginated replies directly /comments/<comment_id>/replies
# NOT used by the get_track_comments
def get_paginated_replies(args, comment_id, current_user_id=None):
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


def get_track_comments(args, track_id, current_user_id=None):
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_THREADS_LIMIT
    )

    track_comments = []
    db = get_db_read_replica()

    CommentThreadAlias = aliased(CommentThread)
    ReplyCountAlias = aliased(CommentThread)

    with db.scoped_session() as session:
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
            .having(func.sum(AggregateUser.follower_count) > COMMENT_KARMA_THRESHOLD)
            .subquery()
        )

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
                CommentThreadAlias,
                Comment.comment_id == CommentThreadAlias.comment_id,
            )
            .outerjoin(
                CommentReport,
                Comment.comment_id == CommentReport.comment_id,
            )
            .outerjoin(
                AggregateUser,
                AggregateUser.user_id == CommentReport.user_id,
            )
            .outerjoin(
                mentioned_users,
                Comment.comment_id == mentioned_users.c.comment_id,
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
                ReplyCountAlias,
                Comment.comment_id == ReplyCountAlias.parent_comment_id,
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
                    current_user_id == None,
                    CommentReport.user_id != current_user_id,
                    CommentReport.user_id != artist_id,
                ),
                or_(
                    CommentReport.comment_id == None,
                    CommentReport.comment_id != artist_id,
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
                <= COMMENT_KARMA_THRESHOLD,
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

        track_comment_res = []
        for [track_comment, react_count, is_muted, mentions] in track_comments.all():
            replies = get_replies(
                session,
                track_comment.comment_id,
                current_user_id,
                artist_id,
                limit=None,
            )

            def remove_delete(mention):
                del mention["is_delete"]
                return mention

            def filter_mentions(mention):
                return (
                    mention["user_id"] is not None and mention["is_delete"] is not True
                )

            reply_count = len(replies)
            track_comment_res.append(
                {
                    "id": encode_int_id(track_comment.comment_id),
                    "user_id": (
                        encode_int_id(track_comment.user_id)
                        if not track_comment.is_delete
                        else None
                    ),
                    "mentions": list(
                        map(remove_delete, filter(filter_mentions, mentions))
                    ),
                    "message": (
                        track_comment.text
                        if not track_comment.is_delete
                        else "[Removed]"
                    ),
                    "is_edited": track_comment.is_edited,
                    "track_timestamp_s": track_comment.track_timestamp_s,
                    "react_count": react_count,
                    "reply_count": reply_count,
                    "is_current_user_reacted": get_is_reacted(
                        session, current_user_id, track_comment.comment_id
                    ),
                    "is_artist_reacted": get_is_reacted(
                        session, artist_id, track_comment.comment_id
                    ),
                    "replies": replies[:3],
                    "created_at": str(track_comment.created_at),
                    "updated_at": str(track_comment.updated_at),
                    "is_tombstone": track_comment.is_delete and reply_count > 0,
                    "is_muted": is_muted if is_muted is not None else False,
                }
            )
        return track_comment_res


def get_muted_users(current_user_id):
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
