from typing import Dict, List, Optional, Tuple, cast

from sqlalchemy import and_, or_
from sqlalchemy.orm.session import Session

from src.exceptions import DataAccessError
from src.models.comments.comment_notification_setting import CommentNotificationSetting

from .base_repository import BaseRepository


class CommentNotificationSettingRepository(BaseRepository[CommentNotificationSetting]):
    """Repository for CommentNotificationSetting model operations.

    This repository handles all database operations related to the CommentNotificationSetting model,
    including querying and managing user notification preferences for comments and entities.
    """

    def __init__(self, session: Session):
        """Initialize the repository.

        Args:
            session: SQLAlchemy session for database operations
        """
        super().__init__(session, CommentNotificationSetting)

    def get_setting_by_ids(
        self, user_id: int, entity_id: int, entity_type: str
    ) -> Optional[CommentNotificationSetting]:
        """Retrieve a notification setting by user, entity IDs and type.

        Args:
            user_id: The ID of the user
            entity_id: The ID of the entity (track, comment, etc.)
            entity_type: The type of the entity

        Returns:
            The notification setting if found, None otherwise
        """
        try:
            return cast(
                Optional[CommentNotificationSetting],
                self.session.query(CommentNotificationSetting)
                .filter(
                    and_(
                        CommentNotificationSetting.user_id == user_id,
                        CommentNotificationSetting.entity_id == entity_id,
                        CommentNotificationSetting.entity_type == entity_type,
                    )
                )
                .first(),
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification setting for user {user_id}, entity {entity_id}, type {entity_type}: {str(e)}"
            )

    def get_settings_by_user_or_entity(
        self, user_id: int, entity_id: int, entity_type: str
    ) -> List[CommentNotificationSetting]:
        """Retrieve notification settings by user or entity.

        Args:
            user_id: The ID of the user
            entity_id: The ID of the entity (track, comment, etc.)
            entity_type: The type of the entity

        Returns:
            List of matching notification settings
        """
        try:
            return (
                self.session.query(CommentNotificationSetting)
                .filter(
                    or_(
                        CommentNotificationSetting.user_id == user_id,
                        and_(
                            CommentNotificationSetting.entity_id == entity_id,
                            CommentNotificationSetting.entity_type == entity_type,
                        ),
                    )
                )
                .all()
            )
        except Exception as e:
            raise DataAccessError(
                f"Error retrieving notification settings for user {user_id} or entity {entity_id}: {str(e)}"
            )
