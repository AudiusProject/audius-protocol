import logging

from src.models.notifications.notification import NotificationSeen
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters

logger = logging.getLogger(__name__)


def validate_notification_tx(params: ManageEntityParameters):
    user_id = params.user_id
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(f"User {user_id} does not exists")

    wallet = params.existing_records[EntityType.USER][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception(f"User {user_id} does not match signer")

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
