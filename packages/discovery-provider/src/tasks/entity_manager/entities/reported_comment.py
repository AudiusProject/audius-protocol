from src.exceptions import IndexingValidationError
from src.models.moderation.reported_comment import ReportedComment
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_report_comment_tx(params: ManageEntityParameters):
    reported_comment_id = params.entity_id
    validate_signer(params)
    if (
        params.action == Action.CREATE
        and (params.user_id, reported_comment_id)
        in params.existing_records[EntityType.REPORTED_COMMENT.value]
    ):
        raise IndexingValidationError(
            f"Comment {reported_comment_id} already reported by user {params.user_id}"
        )


def report_comment(params: ManageEntityParameters):
    validate_report_comment_tx(params)

    reported_comment_id = params.entity_id
    user_id = params.user_id

    muted_user_record = ReportedComment(
        reported_comment_id=reported_comment_id,
        user_id=user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
    )

    params.add_record(
        (user_id, reported_comment_id),
        muted_user_record,
        EntityType.MUTED_USER,
    )
