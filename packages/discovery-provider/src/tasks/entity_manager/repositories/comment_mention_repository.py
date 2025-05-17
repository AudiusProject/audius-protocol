from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment_mention import CommentMention

from .base_repository import BaseRepository


class CommentMentionRepository(BaseRepository[CommentMention]):
    """Repository for CommentMention model operations.

    This repository handles all database operations related to the CommentMention model,
    including querying and managing user mentions in comments.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, CommentMention)

    def get_mentions_by_comment(self, comment_id: int) -> List[CommentMention]:
        """Retrieve all mentions in a comment.

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

    def get_mention_by_ids(
        self, comment_id: int, user_id: int
    ) -> Optional[CommentMention]:
        """Retrieve a specific mention by comment and user IDs.

        Args:
            comment_id: The ID of the comment
            user_id: The ID of the mentioned user

        Returns:
            The comment mention if found, None otherwise
        """
        try:
            return cast(
                Optional[CommentMention],
                self.session.query(CommentMention)
                .filter(
                    and_(
                        CommentMention.comment_id == comment_id,
                        CommentMention.user_id == user_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving mention for comment {comment_id} and user {user_id}: {str(e)}"
            )
