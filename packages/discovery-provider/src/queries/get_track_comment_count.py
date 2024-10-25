from sqlalchemy import and_, func, or_

from src.models.comments.comment import Comment
from src.models.comments.comment_report import COMMENT_KARMA_THRESHOLD, CommentReport
from src.models.moderation.muted_user import MutedUser
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.utils.db_session import get_db_read_replica


def get_tracks_comment_count(track_ids, current_user_id, db_session=None):
    def _get_counts(session):
        track = (
            session.query(Track.track_id, Track.owner_id)
            .filter(Track.track_id.in_(track_ids))
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

        counts = (
            session.query(
                Comment.entity_id.label("track_id"),
                func.count(Comment.comment_id).label("comment_count"),
            )
            .outerjoin(track, Comment.entity_id == track.c.track_id)
            .outerjoin(CommentReport, Comment.comment_id == CommentReport.comment_id)
            .outerjoin(AggregateUser, AggregateUser.user_id == CommentReport.user_id)
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
            .filter(
                Comment.entity_id.in_(track_ids),
                Comment.entity_type == "Track",
                or_(
                    CommentReport.comment_id == None,
                    and_(
                        CommentReport.user_id != current_user_id,
                        CommentReport.user_id != track.c.owner_id,
                    ),
                    CommentReport.is_delete == True,
                ),
                or_(
                    MutedUser.muted_user_id == None,
                    MutedUser.is_delete == True,
                ),
                Comment.is_delete == False,
            )
            .group_by(Comment.entity_id)
            .having(
                func.coalesce(func.sum(AggregateUser.follower_count), 0)
                < COMMENT_KARMA_THRESHOLD
            )
            .all()
        )

        return {count.track_id: count.comment_count for count in counts}

    if db_session:
        return _get_counts(db_session)
    else:
        db = get_db_read_replica()
        with db.scoped_session() as scoped_session:
            return _get_counts(scoped_session)


def get_track_comment_count(track_id, current_user_id, db_session=None):
    counts = get_tracks_comment_count([track_id], current_user_id, db_session)
    return counts.get(track_id, 0)
