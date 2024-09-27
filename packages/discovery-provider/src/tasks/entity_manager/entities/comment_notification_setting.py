from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.tasks.entity_manager.utils import EntityType, ManageEntityParameters


def update_track_comment_notification_setting(params: ManageEntityParameters):
    entity_id = params.entity_id
    entity_type = params.entity_type
    user_id = params.user_id
    is_muted = params.metadata["is_muted"]
    created_at = params.block_datetime
    updated_at = params.block_datetime

    comment_notification_record = CommentNotificationSetting(
        user_id=user_id,
        entity_id=entity_id,
        entity_type=entity_type,
        is_muted=is_muted,
        created_at=created_at,
        updated_at=updated_at,
    )
    params.add_record(
        (user_id, entity_id, entity_type),
        comment_notification_record,
        EntityType.COMMENT_NOTIFICATION_SETTING,
    )
