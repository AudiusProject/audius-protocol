from src.models.comments.comment import Comment
from src.models.comments.comment_thread import CommentThread
from src.tasks.entity_manager.utils import ManageEntityParameters, validate_signer
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def create_comment(params: ManageEntityParameters):
    validate_signer(params)

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

    if params.metadata["parent_comment_id"]:
        remix = CommentThread(
            parent_comment_id=params.metadata["parent_comment_id"],
            comment_id=comment_id,
        )
        params.session.add(remix)
