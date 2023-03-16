from datetime import datetime
from typing import List

from sqlalchemy import asc
from src.models.notifications.notification import Notification
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.utils.session_manager import SessionManager


def create_tastemaker_group_id(user_id, repost_item_id):
    return f"tastemaker:{user_id}:tastemaker_item_id:{repost_item_id}"


def index_tastemaker_notifications(
    db: SessionManager,
    top_trending_tracks: List[Track],
    tastemaker_notification_threshold=10,
):
    with db.scoped_session() as session:
        tastemaker_notifications = []
        for track in top_trending_tracks:
            (
                repost_tastemaker_notifications,
                existing_group_ids,
            ) = create_action_tastemaker_notifications(
                tastemaker_notification_threshold,
                session,
                existing_group_ids=set(),
                track=track,
                action_type=Repost,
            )
            tastemaker_notifications.extend(repost_tastemaker_notifications)

            (
                save_tastemaker_notifications,
                existing_group_ids,
            ) = create_action_tastemaker_notifications(
                tastemaker_notification_threshold,
                session,
                existing_group_ids=existing_group_ids,
                track=track,
                action_type=Save,
            )
            tastemaker_notifications.extend(save_tastemaker_notifications)

        session.bulk_save_objects(
            [notification for notification in tastemaker_notifications]
        )


def create_action_tastemaker_notifications(
    tastemaker_notification_threshold,
    session,
    existing_group_ids,
    track,
    action_type,
):
    query_action_item_id = (
        action_type.repost_item_id
        if action_type == Repost
        else action_type.save_item_id
    )
    tastemaker_action_notifications = []
    earliest_actions = (
        session.query(action_type)
        .filter(
            action_type.is_current == True,
            action_type.is_delete == False,
            query_action_item_id == track["track_id"],
        )
        .order_by(asc(action_type.created_at))
        .limit(tastemaker_notification_threshold)
    )

    for action in earliest_actions.all():
        action_item_id = (
            action.repost_item_id if action_type == Repost else action.save_item_id
        )
        action_as_string = "repost" if type(action) == Repost else "save"
        group_id = create_tastemaker_group_id(action.user_id, action_item_id)
        if group_id not in existing_group_ids:
            tastemaker_action_notifications.append(
                create_tastemaker_notification(
                    track,
                    action_item_id=action_item_id,
                    action_user_id=action.user_id,
                    action_as_string=action_as_string,
                    group_id=group_id,
                )
            )
            existing_group_ids.add(group_id)
    return tastemaker_action_notifications, existing_group_ids


def create_tastemaker_notification(
    track, action_item_id, action_user_id, action_as_string, group_id
):
    return Notification(
        timestamp=datetime.now(),
        user_ids=[action_user_id],
        type="tastemaker",
        group_id=group_id,
        specifier=action_item_id,
        data={
            "track_id": action_item_id,
            "track_owner_id": track["owner_id"],
            "action": action_as_string,
            "tastemaker_user_id": action_user_id,
        },
    )
