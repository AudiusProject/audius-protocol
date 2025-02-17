from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.users.email import EmailAccess, EncryptedEmail

from .base_repository import BaseRepository


class EncryptedEmailRepository(BaseRepository[EncryptedEmail]):
    """Repository for EncryptedEmail model operations.

    This repository handles all database operations related to the EncryptedEmail model,
    including querying and managing encrypted email records and their access grants.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, EncryptedEmail)

    def get_by_owner_id(self, email_owner_user_id: int) -> Optional[EncryptedEmail]:
        """Retrieve an encrypted email record by owner's user ID.

        Args:
            email_owner_user_id: The user ID of the email owner

        Returns:
            The encrypted email record if found, None otherwise
        """
        try:
            return cast(
                Optional[EncryptedEmail],
                self.session.query(EncryptedEmail)
                .filter(EncryptedEmail.email_owner_user_id == email_owner_user_id)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving encrypted email for user {email_owner_user_id}: {str(e)}"
            )

    def get_email_access(
        self, email_owner_user_id: int, receiving_user_id: int, grantor_user_id: int
    ) -> Optional[EmailAccess]:
        """Retrieve an email access record.

        Args:
            email_owner_user_id: The user ID of the email owner
            receiving_user_id: The user ID of the user receiving access
            grantor_user_id: The user ID of the user granting access

        Returns:
            The email access record if found, None otherwise
        """
        try:
            return cast(
                Optional[EmailAccess],
                self.session.query(EmailAccess)
                .filter(
                    and_(
                        EmailAccess.email_owner_user_id == email_owner_user_id,
                        EmailAccess.receiving_user_id == receiving_user_id,
                        EmailAccess.grantor_user_id == grantor_user_id,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving email access for owner {email_owner_user_id}, receiver {receiving_user_id}, grantor {grantor_user_id}: {str(e)}"
            )

    def get_email_access_by_owner_id(
        self, email_owner_user_id: int
    ) -> List[EmailAccess]:
        """Retrieve all email access records for an owner.

        Args:
            email_owner_user_id: The user ID of the email owner

        Returns:
            List of email access records
        """
        try:
            return (
                self.session.query(EmailAccess)
                .filter(EmailAccess.email_owner_user_id == email_owner_user_id)
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving email access records for owner {email_owner_user_id}: {str(e)}"
            )
