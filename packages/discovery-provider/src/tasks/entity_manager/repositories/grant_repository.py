from typing import Dict, List, Optional, Tuple, Union, cast

from sqlalchemy import and_, func, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.grants.grant import Grant

from .base_repository import BaseRepository


class GrantRepository(BaseRepository[Grant]):
    """Repository for Grant model operations.

    This repository handles all database operations related to the Grant model,
    including querying, creating, updating, and deleting grants.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, Grant)

    def get_grant_by_addresses(
        self, grantee_address: str, grantor_user_id: int
    ) -> Optional[Grant]:
        """Retrieve a grant by grantee address and grantor user ID.

        Args:
            grantee_address: The grantee's address (case-insensitive)
            grantor_user_id: The grantor's user ID

        Returns:
            The grant if found, None otherwise
        """
        try:
            return cast(
                Optional[Grant],
                self.session.query(Grant)
                .filter(
                    and_(
                        func.lower(Grant.grantee_address) == grantee_address.lower(),
                        Grant.user_id == grantor_user_id,
                        Grant.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving grant for grantee {grantee_address} and grantor {grantor_user_id}: {str(e)}"
            )

    def get_grants_by_user_pairs(
        self, user_pairs: List[Tuple[Union[str, int], Union[str, int]]]
    ) -> Dict[Tuple[str, int], Grant]:
        """Retrieve grants by pairs of grantee addresses/user IDs and grantor addresses/user IDs.

        Args:
            user_pairs: List of tuples containing (grantee_address_or_user_id, grantor_address_or_user_id)
                where each element can be either a string (address) or int (user ID)

        Returns:
            Dictionary mapping (grantee_address, grantor_user_id) to Grant objects
        """
        try:
            and_queries = []
            for grantee, grantor in user_pairs:
                # Handle grantee being either address or user ID
                if isinstance(grantee, str):
                    grantee_condition = (
                        func.lower(Grant.grantee_address) == grantee.lower()
                    )
                else:
                    grantee_condition = Grant.grantee_address == str(grantee)

                # Handle grantor being either address or user ID
                if isinstance(grantor, str):
                    grantor_condition = func.lower(Grant.user_id) == grantor.lower()
                else:
                    grantor_condition = Grant.user_id == grantor

                and_queries.append(and_(grantee_condition, grantor_condition))

            grants = (
                self.session.query(Grant)
                .filter(or_(*and_queries))
                .filter(Grant.is_current == True)
                .all()
            )

            return {
                (grant.grantee_address.lower(), grant.user_id): grant
                for grant in grants
            }
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving grants for user pairs {user_pairs}: {str(e)}"
            )
