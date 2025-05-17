from typing import Dict, List, Optional, cast

from sqlalchemy import and_, any_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.notifications.notification import Notification

from .base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository for Notification model operations.

    This repository handles all database operations related to the Notification model,
    including querying and managing user notifications.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Notification)

    def get_notifications_by_user(
        self,
        user_id: int,
        notification_type: Optional[str] = None,
    ) -> List[Notification]:
        """Retrieve notifications for a user, optionally filtered by type.

        Args:
            user_id: The ID of the user to get notifications for
            notification_type: Optional notification type to filter by

        Returns:
            List of matching notifications
        """
        try:
            query = self.session.query(Notification).filter(
                user_id == any_(Notification.user_ids)  # type: ignore
            )

            if notification_type is not None:
                query = query.filter(Notification.type == notification_type)

            return cast(List[Notification], query.all())
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notifications for user {user_id}: {str(e)}"
            )

    def get_notification_by_id_and_user(
        self, notification_id: int, user_id: int
    ) -> Optional[Notification]:
        """Retrieve a specific notification for a user.

        Args:
            notification_id: The ID of the notification
            user_id: The ID of the user

        Returns:
            The notification if found, None otherwise
        """
        try:
            return cast(
                Optional[Notification],
                self.session.query(Notification)
                .filter(
                    and_(
                        Notification.id == notification_id,
                        user_id == any_(Notification.user_ids),  # type: ignore
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification {notification_id} for user {user_id}: {str(e)}"
            )
