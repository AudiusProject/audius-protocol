import logging

from src.models.notifications.notification import NotificationSeen, PlaylistSeen
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    validate_user_signer,
)

logger = logging.getLogger(__name__)


def validate_notification_tx(params: ManageEntityParameters):
    validate_user_signer(params)

    if params.entity_type != EntityType.NOTIFICATION:
        raise Exception(f"Entity type {params.entity_type} is not a notification")

    if params.action == Action.VIEW:
        return
    else:
        action = params.action
        raise Exception(f"Entity action {action} is not valid")


def view_notification(params: ManageEntityParameters):
    validate_notification_tx(params)
    notification_seen = NotificationSeen(
        user_id=params.user_id,
        seen_at=params.block_datetime,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
    )
    key = (params.user_id, params.block_datetime)

    params.add_notification_seen_record(key, notification_seen)


def validate_view_playlist_tx(params: ManageEntityParameters):
    validate_user_signer(params)
    playlist_id = params.entity_id
    if not playlist_id in params.existing_records[EntityType.PLAYLIST]:
        # Playlist does not exist, throw error
        raise Exception("Playlist does not exist, cannot record playlist view")


def view_playlist(params: ManageEntityParameters):
    validate_view_playlist_tx(params)
    playlist_seen = PlaylistSeen(
        is_current=True,
        user_id=params.user_id,
        playlist_id=params.entity_id,
        seen_at=params.block_datetime,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
    )
    key = (params.user_id, params.entity_id)

    params.add_playlist_seen_record(key, playlist_seen)
