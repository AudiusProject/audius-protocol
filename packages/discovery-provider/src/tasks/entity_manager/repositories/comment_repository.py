from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment import Comment
from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import CommentReport
from src.models.comments.comment_thread import CommentThread

from .base_repository import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    """Repository for Comment model operations.

    This repository handles all database operations related to the Comment model,
    including querying, creating, updating, and deleting comments, as well as
    related operations like reactions, reports, threads, and mentions.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Comment)

    def get_comments_by_ids(self, comment_ids: List[int]) -> List[Comment]:
        """Retrieve comments by their IDs.

        Args:
            comment_ids: List of comment IDs to retrieve

        Returns:
            List of comments
        """
        try:
            return (
                self.session.query(Comment)
                .filter(Comment.comment_id.in_(comment_ids))
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving comments with IDs {comment_ids}: {str(e)}"
            )

    def get_comment_reactions(
        self, user_id: int, comment_id: int
    ) -> List[CommentReaction]:
        """Retrieve reactions for a comment by a specific user.

        Args:
            user_id: The ID of the user
            comment_id: The ID of the comment

        Returns:
            List of comment reactions
        """
        try:
            return (
                self.session.query(CommentReaction)
                .filter(
                    or_(
                        CommentReaction.user_id == user_id,
                        CommentReaction.comment_id == comment_id,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving reactions for comment {comment_id} by user {user_id}: {str(e)}"
            )

    def get_comment_threads(
        self, parent_comment_id: int, comment_id: int
    ) -> List[CommentThread]:
        """Retrieve comment threads for a parent comment.

        Args:
            parent_comment_id: The ID of the parent comment
            comment_id: The ID of the child comment

        Returns:
            List of comment threads
        """
        try:
            return (
                self.session.query(CommentThread)
                .filter(
                    or_(
                        CommentThread.parent_comment_id == parent_comment_id,
                        CommentThread.comment_id == comment_id,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving threads for parent comment {parent_comment_id} and comment {comment_id}: {str(e)}"
            )

    def get_comment_mentions(self, comment_id: int) -> List[CommentMention]:
        """Retrieve mentions in a comment.

        Args:
            comment_id: The ID of the comment

        Returns:
            List of comment mentions
        """
        try:
            return (
                self.session.query(CommentMention)
                .filter(CommentMention.comment_id == comment_id)
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving mentions for comment {comment_id}: {str(e)}"
            )

    def get_comment_reports(self, user_id: int, comment_id: int) -> List[CommentReport]:
        """Retrieve reports for a comment by a specific user.

        Args:
            user_id: The ID of the user
            comment_id: The ID of the comment

        Returns:
            List of comment reports
        """
        try:
            return (
                self.session.query(CommentReport)
                .filter(
                    or_(
                        CommentReport.user_id == user_id,
                        CommentReport.comment_id == comment_id,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving reports for comment {comment_id} by user {user_id}: {str(e)}"
            )

    def get_notification_settings(
        self, user_id: int, entity_id: int, entity_type: str
    ) -> List[CommentNotificationSetting]:
        """Retrieve notification settings for a user and entity.

        Args:
            user_id: The ID of the user
            entity_id: The ID of the entity (track, comment, etc.)
            entity_type: The type of the entity

        Returns:
            List of notification settings
        """
        try:
            return (
                self.session.query(CommentNotificationSetting)
                .filter(
                    or_(
                        CommentNotificationSetting.user_id == user_id,
                        CommentNotificationSetting.entity_id == entity_id,
                        CommentNotificationSetting.entity_type == entity_type,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification settings for user {user_id} and entity {entity_id}: {str(e)}"
            )
