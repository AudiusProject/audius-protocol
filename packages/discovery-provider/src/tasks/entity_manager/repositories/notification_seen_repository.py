from typing import Dict, List, Optional, cast

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.notifications.notification import NotificationSeen

from .base_repository import BaseRepository


class NotificationSeenRepository(BaseRepository[NotificationSeen]):
    """Repository for NotificationSeen model operations.

    This repository handles all database operations related to the NotificationSeen model,
    including querying and managing user notification seen records.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, NotificationSeen)

    def get_seen_by_user_id(self, user_id: int) -> Optional[NotificationSeen]:
        """Retrieve the most recent seen record for a user.

        Args:
            user_id: The ID of the user

        Returns:
            The notification seen record if found, None otherwise
        """
        try:
            return cast(
                Optional[NotificationSeen],
                self.session.query(NotificationSeen)
                .filter(NotificationSeen.user_id == user_id)
                .order_by(desc(NotificationSeen.seen_at))
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification seen record for user {user_id}: {str(e)}"
            )

    def get_seen_by_user_ids(self, user_ids: List[int]) -> Dict[int, NotificationSeen]:
        """Retrieve most recent seen records for multiple users.

        Args:
            user_ids: List of user IDs to retrieve seen records for

        Returns:
            Dictionary mapping user IDs to their most recent seen records
        """
        try:
            # Using a subquery to get the latest seen_at for each user
            latest_seen = (
                self.session.query(
                    NotificationSeen.user_id,
                    func.max(NotificationSeen.seen_at).label("max_seen_at"),
                )
                .filter(NotificationSeen.user_id.in_(user_ids))
                .group_by(NotificationSeen.user_id)
                .subquery()
            )

            seen_records = (
                self.session.query(NotificationSeen)
                .join(
                    latest_seen,
                    and_(
                        NotificationSeen.user_id == latest_seen.c.user_id,
                        NotificationSeen.seen_at == latest_seen.c.max_seen_at,
                    ),
                )
                .all()
            )
            return {record.user_id: record for record in seen_records}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification seen records for users {user_ids}: {str(e)}"
            )
