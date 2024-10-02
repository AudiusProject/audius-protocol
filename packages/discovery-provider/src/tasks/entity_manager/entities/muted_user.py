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
    existing_record = None
    if (params.user_id, muted_user_id) in params.existing_records[
        EntityType.MUTED_USER.value
    ]:

        existing_record = params.existing_records[EntityType.MUTED_USER.value][
            (params.user_id, muted_user_id)
        ]

    if (
        params.action == Action.MUTE
        and existing_record
        and existing_record.is_delete == False
    ):
        raise IndexingValidationError(
            f"User {params.user_id} already muted user {muted_user_id}"
        )
    if (params.entity_id) not in params.existing_records[EntityType.USER.value]:
        raise IndexingValidationError(
            f"User {params.entity_id} does not exist and cannot be muted"
        )
    if not existing_record and params.action == Action.UNMUTE:
        raise IndexingValidationError(
            f"Cannot unmute user {params.entity_id} who is not already muted"
        )


def mute_user(params: ManageEntityParameters):
    validate_mute_user_tx(params)

    muted_user_id = params.entity_id
    user_id = params.user_id

    muted_user_record = MutedUser(
        muted_user_id=muted_user_id,
        user_id=user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    params.add_record(
        (user_id, muted_user_id),
        muted_user_record,
        EntityType.MUTED_USER,
    )


def unmute_user(params: ManageEntityParameters):
    validate_signer(params)
    validate_mute_user_tx(params)

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
