from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union, cast

from sqlalchemy import Column, literal_column
from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.orm.session import Session
from sqlalchemy.sql.elements import BinaryExpression

from src.exceptions import DataAccessError, EntityNotFoundError
from src.models.base import Base

ModelType = TypeVar("ModelType", bound=Any)


class BaseRepository(Generic[ModelType]):
    """Base repository class that provides common database operations.

    This class serves as a foundation for all entity-specific repositories,
    implementing common database operations and enforcing a consistent interface.

    Attributes:
        session: The SQLAlchemy session for database operations
        model: The SQLAlchemy model class this repository handles
    """

    def __init__(self, session: Session, model: Type[ModelType]):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
            model: The SQLAlchemy model class this repository handles
        """
        self.session = session
        self.model = model

    def get_by_id(self, id_value: int) -> Optional[ModelType]:
        """Retrieve an entity by its ID.

        Args:
            id_value: The ID of the entity to retrieve

        Returns:
            The entity if found, None otherwise
        """
        try:
            return cast(
                Optional[ModelType], self.session.query(self.model).get(id_value)
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving {self.model.__name__} with id {id_value}: {str(e)}"
            )

    def get_by_ids(self, id_values: List[int]) -> Dict[int, ModelType]:
        """Retrieve multiple entities by their IDs.

        Args:
            id_values: List of entity IDs to retrieve

        Returns:
            Dictionary mapping IDs to entities
        """
        try:
            # Get the primary key column
            primary_key = next(
                (col for col in self.model.__table__.columns if col.primary_key), None  # type: ignore
            )
            if not primary_key:
                raise DataAccessError(f"No primary key found for {self.model.__name__}")

            # Get the is_current column if it exists
            is_current = next(
                (
                    col
                    for col in self.model.__table__.columns  # type: ignore
                    if col.name == "is_current"
                ),
                None,
            )

            query = self.session.query(
                self.model, literal_column(f"row_to_json({self.model.__tablename__})")  # type: ignore
            ).filter(primary_key.in_(id_values))

            if is_current is not None:
                query = query.filter(is_current == True)

            records = query.all()
            return {
                getattr(record[0], primary_key.name): record[0] for record in records
            }
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving {self.model.__name__}s with ids {id_values}: {str(e)}"
            )

    def add(self, entity: ModelType) -> None:
        """Add a new entity to the session.

        Args:
            entity: The entity to add
        """
        try:
            self.session.add(entity)
        except Exception as e:
            raise DataAccessError(f"Error adding {self.model.__name__}: {str(e)}")

    def add_all(self, entities: List[ModelType]) -> None:
        """Add multiple entities to the session.

        Args:
            entities: List of entities to add
        """
        try:
            self.session.add_all(entities)
        except Exception as e:
            raise DataAccessError(
                f"Error adding multiple {self.model.__name__}s: {str(e)}"
            )

    def delete(self, entity: ModelType) -> None:
        """Delete an entity from the session.

        Args:
            entity: The entity to delete
        """
        try:
            self.session.delete(entity)
        except Exception as e:
            raise DataAccessError(f"Error deleting {self.model.__name__}: {str(e)}")

    def flush(self) -> None:
        """Flush all pending changes to the database."""
        try:
            self.session.flush()
        except Exception as e:
            raise DataAccessError(f"Error flushing changes: {str(e)}")

    def get_current_by_id(self, id_value: int) -> Optional[ModelType]:
        """Retrieve the current version of an entity by its ID.

        Args:
            id_value: The ID of the entity to retrieve

        Returns:
            The current entity if found, None otherwise
        """
        try:
            # Get the primary key column
            primary_key = next(
                (col for col in self.model.__table__.columns if col.primary_key), None  # type: ignore
            )
            if not primary_key:
                raise DataAccessError(f"No primary key found for {self.model.__name__}")

            # Get the is_current column if it exists
            is_current = next(
                (
                    col
                    for col in self.model.__table__.columns  # type: ignore
                    if col.name == "is_current"
                ),
                None,
            )

            query = self.session.query(self.model).filter(primary_key == id_value)

            if is_current is not None:
                query = query.filter(is_current == True)

            return cast(Optional[ModelType], query.first())
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving current {self.model.__name__} with id {id_value}: {str(e)}"
            )
