from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment_thread import CommentThread

from .base_repository import BaseRepository


class CommentThreadRepository(BaseRepository[CommentThread]):
    """Repository for CommentThread model operations.

    This repository handles all database operations related to the CommentThread model,
    including querying and managing comment thread relationships.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, CommentThread)

    def get_thread_by_ids(
        self, parent_comment_id: int, comment_id: int
    ) -> Optional[CommentThread]:
        """Retrieve a comment thread by parent and child comment IDs.

        Args:
            parent_comment_id: The ID of the parent comment
            comment_id: The ID of the child comment

        Returns:
            The comment thread if found, None otherwise
        """
        try:
            return cast(
                Optional[CommentThread],
                self.session.query(CommentThread)
                .filter(
                    and_(
                        CommentThread.parent_comment_id == parent_comment_id,
                        CommentThread.comment_id == comment_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving comment thread for parent {parent_comment_id} and comment {comment_id}: {str(e)}"
            )

    def get_threads_by_parent_or_comment(
        self, parent_comment_id: int, comment_id: int
    ) -> List[CommentThread]:
        """Retrieve comment threads by either parent or child comment ID.

        Args:
            parent_comment_id: The ID of the parent comment
            comment_id: The ID of the child comment

        Returns:
            List of matching comment threads
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
                f"Error retrieving comment threads for parent {parent_comment_id} or comment {comment_id}: {str(e)}"
            )
