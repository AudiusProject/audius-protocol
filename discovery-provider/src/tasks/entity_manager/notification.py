import json
import logging
from typing import List

from src.models.notifications.notification import (
    Notification,
    NotificationSeen,
    PlaylistSeen,
)
from src.models.users.user import User
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters
from src.utils.config import shared_config

logger = logging.getLogger(__name__)


def get_notification_creator():
    if "notification_creator_addr" in shared_config["contracts"]:
        return shared_config["contracts"]["notification_creator_addr"]


def validate_notification_tx(params: ManageEntityParameters):
    if params.entity_type != EntityType.NOTIFICATION:
        raise Exception(f"Entity type {params.entity_type} is not a notification")

    if params.action == Action.VIEW:
        user_id = params.user_id
        if user_id not in params.existing_records[EntityType.USER]:
            raise Exception(f"User {user_id} does not exist")

        wallet = params.existing_records[EntityType.USER][user_id].wallet
        if wallet and wallet.lower() != params.signer.lower():
            raise Exception(f"User {user_id} does not match signer")
        return

    elif params.action == Action.CREATE:
        # Validate wallet
        valid_notification_addr = get_notification_creator()
        if (
            not valid_notification_addr
            or valid_notification_addr.lower() != params.signer.lower()
        ):
            raise Exception(
                "Invalid Notificaiton Creation Transaction, signer does not match notification address"
            )
        try:
            json.loads(params.metadata_cid)
        except:
            raise Exception("Invalid Notificaiton Metadata Json, unable to parse")
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


def get_notification_user_ids(
    params: ManageEntityParameters, user_group: str
) -> List[int]:
    if user_group == "all":
        # Get all user ids
        users = (
            params.session.query(User.user_id)
            .filter(
                User.is_current == True,
                User.is_deactivated == False,
                User.handle_lc != None,
            )
            .all()
        )
        user_ids = [user[0] for user in users]
        return user_ids
    return []


def create_notification(params: ManageEntityParameters):
    validate_notification_tx(params)
    # Get data from cid blob
    data = json.loads(params.metadata_cid)
    # Get all user ids
    user_ids = get_notification_user_ids(params, data["userGroup"])
    notification = Notification(
        specifier="",
        group_id=f"announcement:blocknumber:{params.block_number}",
        type="announcement",
        blocknumber=params.block_number,
        timestamp=params.block_datetime,
        data=data,
        user_ids=user_ids,
    )
    key = params.block_datetime
    params.add_notification_record(key, notification)


def validate_view_playlist_tx(params: ManageEntityParameters):
    user_id = params.user_id
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(f"User {user_id} does not exist")

    wallet = params.existing_records[EntityType.USER][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception(f"User {user_id} does not match signer")

    playlist_id = params.entity_id
    if playlist_id not in params.existing_records[EntityType.PLAYLIST]:
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
