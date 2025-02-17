from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment_reaction import CommentReaction

from .base_repository import BaseRepository


class CommentReactionRepository(BaseRepository[CommentReaction]):
    """Repository for CommentReaction model operations.

    This repository handles all database operations related to the CommentReaction model,
    including querying and managing user reactions to comments.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, CommentReaction)

    def get_reaction_by_ids(
        self, user_id: int, comment_id: int
    ) -> Optional[CommentReaction]:
        """Retrieve a specific reaction by user and comment IDs.

        Args:
            user_id: The ID of the user who reacted
            comment_id: The ID of the comment

        Returns:
            The comment reaction if found, None otherwise
        """
        try:
            return cast(
                Optional[CommentReaction],
                self.session.query(CommentReaction)
                .filter(
                    and_(
                        CommentReaction.user_id == user_id,
                        CommentReaction.comment_id == comment_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving reaction for user {user_id} and comment {comment_id}: {str(e)}"
            )

    def get_reactions_by_user_or_comment(
        self, user_id: int, comment_id: int
    ) -> List[CommentReaction]:
        """Retrieve reactions by either user or comment ID.

        Args:
            user_id: The ID of the user
            comment_id: The ID of the comment

        Returns:
            List of matching comment reactions
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
                f"Error retrieving reactions for user {user_id} or comment {comment_id}: {str(e)}"
            )
