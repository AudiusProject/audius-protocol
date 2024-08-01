from src.models.comments.comment import Comment
from src.models.comments.comment_thread import CommentThread
from src.tasks.entity_manager.utils import (
    EntityType,
    ManageEntityParameters,
    validate_signer,
    copy_record,
)
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


def update_comment(params: ManageEntityParameters):
    validate_signer(params)
    logger.info(f"asdf validated ")
    logger.info(
        f"asdf existing params.existing_records[EntityType.COMMENT] {params.existing_records[EntityType.COMMENT]}"
    )
    comment_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT][comment_id]
    if params.entity_id in params.new_records[EntityType.COMMENT]:
        existing_comment = params.new_records[EntityType.COMMENT][params.entity_id][-1]
    logger.info(f"asdf existing_comment {existing_comment}")
    edited_comment = copy_record(
        existing_comment,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    logger.info(f"asdf params.metadata: ", params.metadata)
    edited_comment.is_edited = True
    edited_comment.text = params.metadata["body"]
    logger.info(f"asdf deleted_comment {edited_comment}")

    params.add_record(comment_id, deleted_comment)


def delete_comment(params: ManageEntityParameters):
    validate_signer(params)
    logger.info(f"asdf validated ")
    logger.info(
        f"asdf existing params.existing_records[EntityType.COMMENT] {params.existing_records[EntityType.COMMENT]}"
    )
    comment_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT][comment_id]
    if params.entity_id in params.new_records[EntityType.COMMENT]:
        existing_comment = params.new_records[EntityType.COMMENT][params.entity_id][-1]
    logger.info(f"asdf existing_comment {existing_comment}")
    deleted_comment = copy_record(
        existing_comment,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_comment.is_delete = True
    logger.info(f"asdf deleted_comment {deleted_comment}")

    params.add_record(comment_id, deleted_comment)
