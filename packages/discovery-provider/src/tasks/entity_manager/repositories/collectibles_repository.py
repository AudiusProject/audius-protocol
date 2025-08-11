from typing import Dict, List, Optional, cast

from sqlalchemy import and_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.users.collectibles import Collectibles

from .base_repository import BaseRepository


class CollectiblesRepository(BaseRepository[Collectibles]):
    """Repository for Collectibles model operations.

    This repository handles all database operations related to the Collectibles model,
    including querying and managing user collectibles.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Collectibles)

    def get_by_user_id(self, user_id: int) -> Optional[Collectibles]:
        """Retrieve collectibles for a user.

        Args:
            user_id: The ID of the user

        Returns:
            The collectibles record if found, None otherwise
        """
        try:
            return cast(
                Optional[Collectibles],
                self.session.query(Collectibles)
                .filter(Collectibles.user_id == user_id)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving collectibles for user {user_id}: {str(e)}"
            )

    def get_by_user_ids(self, user_ids: List[int]) -> Dict[int, Collectibles]:
        """Retrieve collectibles for multiple users.

        Args:
            user_ids: List of user IDs to retrieve collectibles for

        Returns:
            Dictionary mapping user IDs to their collectibles records
        """
        try:
            collectibles = (
                self.session.query(Collectibles)
                .filter(Collectibles.user_id.in_(user_ids))
                .all()
            )
            return {c.user_id: c for c in collectibles}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving collectibles for users {user_ids}: {str(e)}"
            )
