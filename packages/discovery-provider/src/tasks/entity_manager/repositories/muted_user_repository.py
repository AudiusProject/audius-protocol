from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.moderation.muted_user import MutedUser

from .base_repository import BaseRepository


class MutedUserRepository(BaseRepository[MutedUser]):
    """Repository for MutedUser model operations.

    This repository handles all database operations related to the MutedUser model,
    including querying and managing user muting relationships.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, MutedUser)

    def get_muted_users_by_user(self, user_id: int) -> List[MutedUser]:
        """Retrieve all users muted by a specific user.

        Args:
            user_id: The ID of the user who muted others

        Returns:
            List of MutedUser records
        """
        try:
            return cast(
                List[MutedUser],
                self.session.query(MutedUser)
                .filter(MutedUser.user_id == user_id)
                .all(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving muted users for user {user_id}: {str(e)}"
            )

    def get_muted_user_by_ids(
        self, user_id: int, muted_user_id: int
    ) -> Optional[MutedUser]:
        """Retrieve a specific muted user relationship.

        Args:
            user_id: The ID of the user who muted
            muted_user_id: The ID of the user who was muted

        Returns:
            The MutedUser record if found, None otherwise
        """
        try:
            return cast(
                Optional[MutedUser],
                self.session.query(MutedUser)
                .filter(
                    and_(
                        MutedUser.user_id == user_id,
                        MutedUser.muted_user_id == muted_user_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving muted user relationship between {user_id} and {muted_user_id}: {str(e)}"
            )
