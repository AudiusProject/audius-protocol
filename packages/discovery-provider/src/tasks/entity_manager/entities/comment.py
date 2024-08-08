from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_thread import CommentThread
from src.tasks.entity_manager.utils import (
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
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
    comment_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT.value][comment_id]
    if params.entity_id in params.new_records[EntityType.COMMENT.value]:
        existing_comment = params.new_records[EntityType.COMMENT.value][
            params.entity_id
        ][-1]
    edited_comment = copy_record(
        existing_comment,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    edited_comment.is_edited = True
    edited_comment.text = params.metadata["body"]

    params.add_record(comment_id, edited_comment)


def delete_comment(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT.value][comment_id]
    if params.entity_id in params.new_records[EntityType.COMMENT.value]:
        existing_comment = params.new_records[EntityType.COMMENT.value][
            params.entity_id
        ][-1]
    deleted_comment = copy_record(
        existing_comment,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_comment.is_delete = True

    params.add_record(comment_id, deleted_comment)


def react_comment(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id

    comment_reaction_record = CommentReaction(
        comment_id=comment_id,
        user_id=params.user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )
    params.add_record(comment_id, comment_reaction_record, EntityType.COMMENT_REACTION)


def unreact_comment(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    user_id = params.user_id

    existing_comment_reaction = params.existing_records[
        EntityType.COMMENT_REACTION.value
    ][(user_id, comment_id)]
    deleted_comment_reaction = copy_record(
        existing_comment_reaction,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_comment_reaction.is_delete = True

    params.add_record(
        (user_id, comment_id), deleted_comment_reaction, EntityType.COMMENT_REACTION
    )
