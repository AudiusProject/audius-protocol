from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.social.subscription import Subscription

from .base_repository import BaseRepository


class SocialRepository:
    """Repository for social model operations.

    This repository handles all database operations related to social models
    (Follow, Repost, Save, Subscription), including querying and managing
    social relationships between users and entities.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        self.session = session

    def get_follow(self, follower_id: int, followee_id: int) -> Optional[Follow]:
        """Retrieve a follow relationship.

        Args:
            follower_id: The ID of the following user
            followee_id: The ID of the followed user

        Returns:
            The follow record if found, None otherwise
        """
        try:
            return cast(
                Optional[Follow],
                self.session.query(Follow)
                .filter(
                    and_(
                        Follow.follower_user_id == follower_id,
                        Follow.followee_user_id == followee_id,
                        Follow.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving follow relationship between {follower_id} and {followee_id}: {str(e)}"
            )

    def get_repost(
        self, user_id: int, entity_type: str, entity_id: int
    ) -> Optional[Repost]:
        """Retrieve a repost record.

        Args:
            user_id: The ID of the user who reposted
            entity_type: The type of the reposted entity
            entity_id: The ID of the reposted entity

        Returns:
            The repost record if found, None otherwise
        """
        try:
            return cast(
                Optional[Repost],
                self.session.query(Repost)
                .filter(
                    and_(
                        Repost.user_id == user_id,
                        Repost.repost_type == entity_type.lower(),
                        Repost.repost_item_id == entity_id,
                        Repost.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving repost for user {user_id}, type {entity_type}, id {entity_id}: {str(e)}"
            )

    def get_save(
        self, user_id: int, entity_type: str, entity_id: int
    ) -> Optional[Save]:
        """Retrieve a save record.

        Args:
            user_id: The ID of the user who saved
            entity_type: The type of the saved entity
            entity_id: The ID of the saved entity

        Returns:
            The save record if found, None otherwise
        """
        try:
            return cast(
                Optional[Save],
                self.session.query(Save)
                .filter(
                    and_(
                        Save.user_id == user_id,
                        Save.save_type == entity_type.lower(),
                        Save.save_item_id == entity_id,
                        Save.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving save for user {user_id}, type {entity_type}, id {entity_id}: {str(e)}"
            )

    def get_subscription(
        self, subscriber_id: int, user_id: int
    ) -> Optional[Subscription]:
        """Retrieve a subscription relationship.

        Args:
            subscriber_id: The ID of the subscribing user
            user_id: The ID of the subscribed-to user

        Returns:
            The subscription record if found, None otherwise
        """
        try:
            return cast(
                Optional[Subscription],
                self.session.query(Subscription)
                .filter(
                    and_(
                        Subscription.subscriber_id == subscriber_id,
                        Subscription.user_id == user_id,
                        Subscription.is_current == True,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving subscription between {subscriber_id} and {user_id}: {str(e)}"
            )

    def add(self, entity: Follow | Repost | Save | Subscription) -> None:
        """Add a new social record to the session.

        Args:
            entity: The social record to add
        """
        try:
            self.session.add(entity)
        except Exception as e:
            raise DataAccessError(f"Error adding social record: {str(e)}")

    def delete(self, entity: Follow | Repost | Save | Subscription) -> None:
        """Delete a social record from the session.

        Args:
            entity: The social record to delete
        """
        try:
            self.session.delete(entity)
        except Exception as e:
            raise DataAccessError(f"Error deleting social record: {str(e)}")

    def flush(self) -> None:
        """Flush all pending changes to the database."""
        try:
            self.session.flush()
        except Exception as e:
            raise DataAccessError(f"Error flushing changes: {str(e)}")
