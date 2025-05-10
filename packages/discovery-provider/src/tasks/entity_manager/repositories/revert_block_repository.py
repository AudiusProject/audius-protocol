from typing import Dict, List, Optional, cast

from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.indexing.revert_block import RevertBlock

from .base_repository import BaseRepository


class RevertBlockRepository(BaseRepository[RevertBlock]):
    """Repository for RevertBlock model operations.

    This repository handles all database operations related to the RevertBlock model,
    including querying and creating revert blocks for transaction rollbacks.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, RevertBlock)

    def create_revert_block(
        self, block_number: int, prev_records: Dict[str, List]
    ) -> RevertBlock:
        """Create a new revert block record.

        Args:
            block_number: The block number to revert
            prev_records: Dictionary mapping table names to lists of previous record states

        Returns:
            The created RevertBlock instance
        """
        try:
            revert_block = RevertBlock(
                blocknumber=block_number, prev_records=prev_records
            )
            self.add(revert_block)
            self.flush()
            return revert_block
        except Exception as e:
            raise DataAccessError(
                f"Error creating revert block for block number {block_number}: {str(e)}"
            )

    def get_by_block_number(self, block_number: int) -> Optional[RevertBlock]:
        """Retrieve a revert block by block number.

        Args:
            block_number: The block number to search for

        Returns:
            The revert block if found, None otherwise
        """
        try:
            return cast(
                Optional[RevertBlock],
                self.session.query(RevertBlock)
                .filter(RevertBlock.blocknumber == block_number)
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving revert block for block number {block_number}: {str(e)}"
            )
