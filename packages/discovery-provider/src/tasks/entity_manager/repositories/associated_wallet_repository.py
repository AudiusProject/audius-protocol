from typing import Dict, List, Optional, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.users.associated_wallet import AssociatedWallet

from .base_repository import BaseRepository


class AssociatedWalletRepository(BaseRepository[AssociatedWallet]):
    """Repository for AssociatedWallet model operations.

    This repository handles all database operations related to the AssociatedWallet model,
    including querying and managing user wallet associations.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, AssociatedWallet)

    def get_by_user_id(self, user_id: int) -> List[AssociatedWallet]:
        """Retrieve all associated wallets for a user.

        Args:
            user_id: The ID of the user

        Returns:
            List of associated wallet records
        """
        try:
            return (
                self.session.query(AssociatedWallet)
                .filter(
                    and_(
                        AssociatedWallet.user_id == user_id,
                        AssociatedWallet.is_current == True,
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving associated wallets for user {user_id}: {str(e)}"
            )

    def get_by_wallet(self, wallet: str) -> Optional[AssociatedWallet]:
        """Retrieve an associated wallet by wallet address.

        Args:
            wallet: The wallet address to search for

        Returns:
            The associated wallet record if found, None otherwise
        """
        try:
            return cast(
                Optional[AssociatedWallet],
                self.session.query(AssociatedWallet)
                .filter(
                    and_(
                        AssociatedWallet.wallet == wallet,
                        AssociatedWallet.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving associated wallet with address {wallet}: {str(e)}"
            )
