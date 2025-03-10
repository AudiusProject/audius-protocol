from typing import Dict, List, Optional, cast

from sqlalchemy import and_, func
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser

from .base_repository import BaseRepository


class DashboardWalletUserRepository(BaseRepository[DashboardWalletUser]):
    """Repository for DashboardWalletUser model operations.

    This repository handles all database operations related to the DashboardWalletUser model,
    including querying, creating, updating, and deleting dashboard wallet users.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, DashboardWalletUser)

    def get_by_wallet(self, wallet: str) -> Optional[DashboardWalletUser]:
        """Retrieve a dashboard wallet user by wallet address.

        Args:
            wallet: The wallet address to search for (case-insensitive)

        Returns:
            The dashboard wallet user if found, None otherwise
        """
        try:
            return cast(
                Optional[DashboardWalletUser],
                self.session.query(DashboardWalletUser)
                .filter(func.lower(DashboardWalletUser.wallet) == wallet.lower())
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving dashboard wallet user with wallet {wallet}: {str(e)}"
            )

    def get_by_wallets(self, wallets: List[str]) -> Dict[str, DashboardWalletUser]:
        """Retrieve dashboard wallet users by their wallet addresses.

        Args:
            wallets: List of wallet addresses to retrieve (case-insensitive)

        Returns:
            Dictionary mapping lowercase wallet addresses to DashboardWalletUser objects
        """
        try:
            users = (
                self.session.query(DashboardWalletUser)
                .filter(
                    func.lower(DashboardWalletUser.wallet).in_(
                        [w.lower() for w in wallets]
                    )
                )
                .all()
            )
            return {user.wallet.lower(): user for user in users}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving dashboard wallet users with wallets {wallets}: {str(e)}"
            )
