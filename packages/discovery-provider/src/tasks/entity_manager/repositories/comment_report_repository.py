from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment_report import CommentReport

from .base_repository import BaseRepository


class CommentReportRepository(BaseRepository[CommentReport]):
    """Repository for CommentReport model operations.

    This repository handles all database operations related to the CommentReport model,
    including querying and managing user reports on comments.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, CommentReport)

    def get_report_by_ids(
        self, user_id: int, comment_id: int
    ) -> Optional[CommentReport]:
        """Retrieve a specific report by user and comment IDs.

        Args:
            user_id: The ID of the user who reported
            comment_id: The ID of the reported comment

        Returns:
            The comment report if found, None otherwise
        """
        try:
            return cast(
                Optional[CommentReport],
                self.session.query(CommentReport)
                .filter(
                    and_(
                        CommentReport.user_id == user_id,
                        CommentReport.comment_id == comment_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving report for user {user_id} and comment {comment_id}: {str(e)}"
            )

    def get_reports_by_user_or_comment(
        self, user_id: int, comment_id: int
    ) -> List[CommentReport]:
        """Retrieve reports by either user or comment ID.

        Args:
            user_id: The ID of the user
            comment_id: The ID of the comment

        Returns:
            List of matching comment reports
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
                f"Error retrieving reports for user {user_id} or comment {comment_id}: {str(e)}"
            )
