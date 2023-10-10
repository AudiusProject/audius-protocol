from datetime import datetime
from typing import List

from sqlalchemy import asc, tuple_

from src.models.notifications.notification import Notification
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.models.tracks.track import Track
from src.utils.session_manager import SessionManager


def create_tastemaker_group_id(user_id, repost_item_id):
    return f"tastemaker_user_id:{user_id}:tastemaker_item_id:{repost_item_id}"


def index_tastemaker_notifications(
    db: SessionManager,
    top_trending_tracks: List[Track],
    tastemaker_notification_threshold=10,
):
    with db.scoped_session() as session:
        tastemaker_notifications = []
        for track in top_trending_tracks:
            repost_tastemaker_notifications = create_action_tastemaker_notifications(
                tastemaker_notification_threshold,
                session,
                track=track,
                action_type=Repost,
            )

            save_tastemaker_notifications = create_action_tastemaker_notifications(
                tastemaker_notification_threshold,
                session,
                track=track,
                action_type=Save,
            )
            # If a user is in a track's earliest saves and earliest reposts,
            # only notify them once that they are tastemaker
            tastemaker_notifications_to_add = dedupe_notifications_by_group_id(
                repost_tastemaker_notifications, save_tastemaker_notifications
            )
            # Bulk save objects does not fail silently. If a notification
            # trying to save has a duplicate in the table already,
            # it will crash and not save anything in the batch.
            tastemaker_notifications_to_add = (
                dedupe_notifications_from_existing_notifications(
                    tastemaker_notifications_to_add=tastemaker_notifications_to_add,
                    session=session,
                )
            )
            tastemaker_notifications.extend(tastemaker_notifications_to_add)

        session.bulk_save_objects(
            [notification for notification in tastemaker_notifications]
        )


def dedupe_notifications_by_group_id(repost_notifications, save_notifications):
    deduped_notifications_by_group_id = []
    existing_group_ids = set(
        [repost_notification.group_id for repost_notification in repost_notifications]
    )
    deduped_notifications_by_group_id = repost_notifications + [
        save_notif
        for save_notif in save_notifications
        if save_notif.group_id not in existing_group_ids
    ]
    return deduped_notifications_by_group_id


def dedupe_notifications_from_existing_notifications(
    tastemaker_notifications_to_add, session
):
    specifier_group_ids_to_add = [
        (notification.specifier, notification.group_id)
        for notification in tastemaker_notifications_to_add
    ]
    existing_specifier_group_ids = (
        session.query(Notification.specifier, Notification.group_id)
        .filter(
            tuple_(Notification.specifier, Notification.group_id).in_(
                specifier_group_ids_to_add
            )
        )
        .all()
    )
    deduped_notifications = []
    for notification in tastemaker_notifications_to_add:
        if (
            notification.specifier,
            notification.group_id,
        ) not in existing_specifier_group_ids:
            deduped_notifications.append(notification)
    return deduped_notifications


def create_action_tastemaker_notifications(
    tastemaker_notification_threshold,
    session,
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
        tastemaker_action_notifications.append(
            create_tastemaker_notification(
                track,
                action_item_id=action_item_id,
                action_user_id=action.user_id,
                action_as_string=action_as_string,
                group_id=group_id,
            )
        )
    return tastemaker_action_notifications


def create_tastemaker_notification(
    track, action_item_id, action_user_id, action_as_string, group_id
):
    return Notification(
        timestamp=datetime.now(),
        user_ids=[action_user_id],
        type="tastemaker",
        group_id=group_id,
        specifier=str(action_item_id),
        data={
            "tastemaker_item_id": action_item_id,
            "tastemaker_item_type": "track",
            "tastemaker_item_owner_id": track["owner_id"],
            "action": action_as_string,
            "tastemaker_user_id": action_user_id,
        },
    )
