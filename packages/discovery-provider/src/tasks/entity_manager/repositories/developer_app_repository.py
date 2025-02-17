from typing import Dict, List, Optional, cast

from sqlalchemy import and_, func
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.grants.developer_app import DeveloperApp

from .base_repository import BaseRepository


class DeveloperAppRepository(BaseRepository[DeveloperApp]):
    """Repository for DeveloperApp model operations.

    This repository handles all database operations related to the DeveloperApp model,
    including querying, creating, updating, and deleting developer apps.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, DeveloperApp)

    def get_by_address(self, address: str) -> Optional[DeveloperApp]:
        """Retrieve a developer app by its address.

        Args:
            address: The address to search for (case-insensitive)

        Returns:
            The developer app if found, None otherwise
        """
        try:
            return cast(
                Optional[DeveloperApp],
                self.session.query(DeveloperApp)
                .filter(func.lower(DeveloperApp.address) == address.lower())
                .filter(DeveloperApp.is_current == True)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving developer app with address {address}: {str(e)}"
            )

    def get_current_by_addresses(self, addresses: List[str]) -> Dict[str, DeveloperApp]:
        """Retrieve current developer apps by their addresses.

        Args:
            addresses: List of addresses to retrieve (case-insensitive)

        Returns:
            Dictionary mapping lowercase addresses to DeveloperApp objects
        """
        try:
            apps = (
                self.session.query(DeveloperApp)
                .filter(
                    func.lower(DeveloperApp.address).in_(
                        [addr.lower() for addr in addresses]
                    )
                )
                .filter(DeveloperApp.is_current == True)
                .all()
            )
            return {app.address.lower(): app for app in apps}
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving developer apps with addresses {addresses}: {str(e)}"
            )
