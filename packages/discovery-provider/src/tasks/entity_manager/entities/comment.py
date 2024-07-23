from src.models.comments.comment import Comment
from src.tasks.entity_manager.utils import ManageEntityParameters
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def create_comment(params: ManageEntityParameters):
    comment_id = params.entity_id
    comment_record = Comment(
        comment_id=comment_id,
        user_id=params.user_id,
        text=params.metadata["body"],
        entity_type=params.metadata["entity_type"],
        entity_id=params.metadata["entity_id"],
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    params.add_record(comment_id, comment_record)
