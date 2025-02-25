import logging
from typing import TypedDict

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


def get_replies(
    session,
    parent_comment_id,
    current_user_id,
    # note: artist id already exists when used via get_track_comments - no need to requery for it
    artist_id=None,
    offset=0,
    limit=COMMENT_REPLIES_DEFAULT_LIMIT,
):
    if artist_id is None:
        artist_id = (
            session.query(Track)
            .join(Comment, Track.track_id == Comment.entity_id)
            .first()
            .owner_id
        )

    base_query = _get_base_comments_query(session, current_user_id)
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
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    db = get_db_read_replica()
    CommentThreadAlias = aliased(CommentThread)
    ReplyCountAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        base_query = _get_base_comments_query(session, current_user_id)
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


class GetUserCommentsArgs(TypedDict):
    sort_method: str
    offset: int
    limit: int
    user_id: int
    current_user_id: int


def _get_base_comments_query(session, current_user_id=None):
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


def get_user_comments(args: GetUserCommentsArgs):
    offset, limit = format_offset(args), format_limit(
        args, default_limit=COMMENT_ROOT_DEFAULT_LIMIT
    )

    user_id = args["user_id"]
    current_user_id = args["current_user_id"]
    db = get_db_read_replica()
    CommentThreadAlias = aliased(CommentThread)

    with db.scoped_session() as session:
        base_query = _get_base_comments_query(session, current_user_id)
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
