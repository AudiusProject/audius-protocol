from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.users.user_events import UserEvent

from .base_repository import BaseRepository


class UserEventRepository(BaseRepository[UserEvent]):
    """Repository for UserEvent model operations.

    This repository handles all database operations related to the UserEvent model,
    including querying and managing user event records.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, UserEvent)

    def get_event_by_user_id(self, user_id: int) -> Optional[UserEvent]:
        """Retrieve the current event record for a user.

        Args:
            user_id: The ID of the user

        Returns:
            The user event if found, None otherwise
        """
        try:
            return cast(
                Optional[UserEvent],
                self.session.query(UserEvent)
                .filter(
                    and_(UserEvent.user_id == user_id, UserEvent.is_current == True)
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving event for user {user_id}: {str(e)}"
            )

    def get_events_by_user_ids(self, user_ids: List[int]) -> Dict[int, UserEvent]:
        """Retrieve current event records for multiple users.

        Args:
            user_ids: List of user IDs to retrieve events for

        Returns:
            Dictionary mapping user IDs to their current event records
        """
        try:
            events = (
                self.session.query(UserEvent)
                .filter(
                    and_(UserEvent.user_id.in_(user_ids), UserEvent.is_current == True)
                )
                .all()
            )
            return {event.user_id: event for event in events}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving events for users {user_ids}: {str(e)}"
            )
