from sqlalchemy import and_, func, or_

from src.models.comments.comment import Comment
from src.models.comments.comment_report import (
    COMMENT_KARMA_THRESHOLD,
    CommentReport,
)
from src.models.moderation.muted_user import MutedUser
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.utils.db_session import get_db_read_replica


def get_track_comment_count(track_id, current_user_id, db_session=None):
    db = get_db_read_replica()

    def _get_count(session):
        track = session.query(Track).filter(Track.track_id == track_id).first()
        artist_id = track.owner_id
        track_comment_count = (
            session.query(func.count(Comment.comment_id))
            .outerjoin(
                CommentReport,
                Comment.comment_id == CommentReport.comment_id,
            )
            .outerjoin(
                AggregateUser,
                AggregateUser.user_id == CommentReport.user_id,
            )
            .outerjoin(
                MutedUser,
                and_(
                    MutedUser.muted_user_id
                    == Comment.user_id,  # match muted users up to their comments
                    MutedUser.user_id
                    == current_user_id,  # compare who did the muting to our current user
                ),
            )
            .filter(
                Comment.entity_id == track_id,
                Comment.entity_type == "Track",
                # Exclude comments that the current user reported
                or_(
                    CommentReport.comment_id == None,
                    current_user_id == None,
                    CommentReport.user_id != current_user_id,
                    CommentReport.user_id != artist_id,
                ),
                or_(
                    MutedUser.muted_user_id == None,
                    MutedUser.is_delete == True,
                ),
                # Exclude deleted comments
                Comment.is_delete == False,
            )
            .group_by(Comment.entity_id)
            # Exclude comments that the combined karma of all users who reported the comment is above the threshold
            # this mainly applies to comments the Audius account reported
            .having(
                func.coalesce(func.sum(AggregateUser.follower_count), 0)
                <= COMMENT_KARMA_THRESHOLD,
            )
            .scalar()
        )
        return track_comment_count or 0

    if db_session:
        return _get_count(db_session)
    else:
        with db.scoped_session() as scoped_session:
            return _get_count(scoped_session)
