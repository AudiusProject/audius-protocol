from src.exceptions import IndexingValidationError
from src.models.moderation.muted_user import MutedUser

from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_mute_user_tx(params: ManageEntityParameters):
    muted_user_id = params.entity_id
    validate_signer(params)
    if (
        params.action == Action.CREATE
        and (muted_user_id, params.user_id)
        in params.existing_records[EntityType.MUTED_USER.value]
    ):
        raise IndexingValidationError(f"User {muted_user_id} already muted")


def mute_user(params: ManageEntityParameters):
    validate_mute_user_tx(params)

    muted_user_id = params.entity_id
    muted_user_record = MutedUser(
        muted_user_id=muted_user_id,
        user_id=params.user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    params.add_record(muted_user_id, muted_user_record)


def unmute_user(params: ManageEntityParameters):
    validate_signer(params)
    muted_user_id = params.entity_id
    user_id = params.user_id

    existing_muted_user_reaction = params.existing_records[EntityType.MUTED_USER.value][
        (user_id, muted_user_id)
    ]
    deleted_muted_user_reaction = copy_record(
        existing_muted_user_reaction,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_muted_user_reaction.is_delete = True

    params.add_record(
        (user_id, muted_user_id),
        deleted_muted_user_reaction,
        EntityType.MUTED_USER,
    )
