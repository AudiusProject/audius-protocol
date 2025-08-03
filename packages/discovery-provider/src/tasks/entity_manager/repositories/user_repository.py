from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.users.user import User

from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations.

    This repository handles all database operations related to the User model,
    including querying, creating, updating, and deleting users.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, User)

    def get_by_wallet(self, wallet: str) -> Optional[User]:
        """Retrieve a user by their wallet address.

        Args:
            wallet: The wallet address to search for

        Returns:
            The user if found, None otherwise
        """
        try:
            return cast(
                Optional[User],
                self.session.query(User)
                .filter(User.wallet == wallet)
                .filter(User.is_current == True)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving user with wallet {wallet}: {str(e)}"
            )

    def get_by_handle(self, handle: str) -> Optional[User]:
        """Retrieve a user by their handle.

        Args:
            handle: The handle to search for

        Returns:
            The user if found, None otherwise
        """
        try:
            return cast(
                Optional[User],
                self.session.query(User)
                .filter(User.handle_lc == handle.lower())
                .filter(User.is_current == True)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving user with handle {handle}: {str(e)}"
            )

    def get_users_by_wallet_or_handle(self, identifier: str) -> List[User]:
        """Retrieve users by either wallet address or handle.

        Args:
            identifier: The wallet address or handle to search for

        Returns:
            List of matching users
        """
        try:
            return (
                self.session.query(User)
                .filter(
                    and_(
                        User.is_current == True,
                        or_(
                            User.wallet == identifier,
                            User.handle_lc == identifier.lower(),
                        ),
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving users with identifier {identifier}: {str(e)}"
            )

    def get_user_id_by_wallet(self, wallet: str) -> Optional[int]:
        """Get a user's ID by their wallet address.

        Args:
            wallet: The wallet address to search for

        Returns:
            The user ID if found, None otherwise
        """
        try:
            result = (
                self.session.query(User.user_id)
                .filter(User.wallet == wallet)
                .filter(User.is_current == True)
                .first()
            )
            return result[0] if result else None
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving user ID for wallet {wallet}: {str(e)}"
            )

    def get_current_users_by_ids(self, user_ids: List[int]) -> Dict[int, User]:
        """Retrieve current users by their IDs.

        Args:
            user_ids: List of user IDs to retrieve

        Returns:
            Dictionary mapping user IDs to User objects
        """
        try:
            users = (
                self.session.query(User)
                .filter(User.user_id.in_(user_ids))
                .filter(User.is_current == True)
                .all()
            )
            return {user.user_id: user for user in users}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving users with IDs {user_ids}: {str(e)}"
            )
