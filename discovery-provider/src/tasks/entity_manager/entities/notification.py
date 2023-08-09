import json
import logging

from src.exceptions import IndexingValidationError
from src.models.notifications.notification import (
    Notification,
    NotificationSeen,
    PlaylistSeen,
)
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters
from src.utils.config import shared_config

logger = logging.getLogger(__name__)


def get_verifier_address():
    if "verified_address" in shared_config["contracts"]:
        return shared_config["contracts"]["verified_address"]


def validate_notification_tx(params: ManageEntityParameters):
    if params.entity_type != EntityType.NOTIFICATION:
        raise IndexingValidationError(
            f"Entity type {params.entity_type} is not a notification"
        )

    if params.action == Action.VIEW:
        user_id = params.user_id
        if user_id not in params.existing_records["User"]:
            raise IndexingValidationError(f"User {user_id} does not exist")

        wallet = params.existing_records["User"][user_id].wallet
        if wallet and wallet.lower() != params.signer.lower():
            raise IndexingValidationError(f"User {user_id} does not match signer")
        return

    elif params.action == Action.CREATE:
        # Validate wallet
        valid_notification_addr = get_verifier_address()
        if (
            not valid_notification_addr
            or valid_notification_addr.lower() != params.signer.lower()
        ):
            raise IndexingValidationError(
                "Invalid Notificaiton Creation Transaction, signer does not match notification address"
            )
        try:
            json.loads(params.metadata)
        except:
            raise IndexingValidationError(
                "Invalid Notificaiton Metadata Json, unable to parse"
            )
    else:
        action = params.action
        raise IndexingValidationError(f"Entity action {action} is not valid")


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


def create_notification(params: ManageEntityParameters):
    validate_notification_tx(params)
    # Get data from cid blob
    data = json.loads(params.metadata)
    # Get all user ids
    user_ids: list[int] = []  # get_notification_user_ids(params, data["userGroup"])
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
    if user_id not in params.existing_records["User"]:
        raise IndexingValidationError(f"User {user_id} does not exist")

    wallet = params.existing_records["User"][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise IndexingValidationError(f"User {user_id} does not match signer")

    playlist_id = params.entity_id
    if playlist_id not in params.existing_records["Playlist"]:
        # Playlist does not exist, throw error
        raise IndexingValidationError(
            "Playlist does not exist, cannot record playlist view"
        )


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
