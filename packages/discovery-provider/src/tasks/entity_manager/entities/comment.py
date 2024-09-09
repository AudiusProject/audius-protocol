from src.exceptions import IndexingValidationError
from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_thread import CommentThread
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.utils.structured_logger import StructuredLogger

logger = StructuredLogger(__name__)


def validate_comment_tx(params: ManageEntityParameters):
    comment_id = params.entity_id
    validate_signer(params)
    if (
        params.action == Action.CREATE
        and comment_id in params.existing_records[EntityType.COMMENT.value]
    ):
        raise IndexingValidationError(f"Comment {comment_id} already exists")
    # Entity type only supports track at the moment
    if params.metadata["entity_type"] != "Track":
        raise IndexingValidationError(
            f"Entity type {params.metadata['entity_type']} does not exist"
        )
    if params.metadata["entity_id"] is None:
        raise IndexingValidationError(
            "Entitiy id for a track is required to create comment"
        )
    if params.metadata["body"] is None or params.metadata["body"] == "":
        raise IndexingValidationError("Comment body is empty")


def create_comment(params: ManageEntityParameters):
    validate_comment_tx(params)

    comment_id = params.entity_id
    comment_record = Comment(
        comment_id=comment_id,
        user_id=params.user_id,
        text=params.metadata["body"],
        entity_type=params.metadata.get("entity_type", EntityType.TRACK.value),
        entity_id=params.metadata["entity_id"],
        track_timestamp_s=params.metadata["track_timestamp_s"],
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    params.add_record(comment_id, comment_record)

    if params.metadata["parent_comment_id"]:
        existing_comment_thread = (
            params.session.query(CommentThread)
            .filter_by(
                parent_comment_id=params.metadata["parent_comment_id"],
                comment_id=comment_id,
            )
            .first()
        )
        if existing_comment_thread:
            return

        comment_thread = CommentThread(
            parent_comment_id=params.metadata["parent_comment_id"],
            comment_id=comment_id,
        )
        params.session.add(comment_thread)


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


def validate_comment_reaction_tx(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    user_id = params.user_id
    logger.info(f"asdf params.existing_records {params.existing_records}")
    if (
        params.action == Action.REACT
        and (user_id, comment_id)
        in params.existing_records[EntityType.COMMENT_REACTION.value]
    ):
        raise IndexingValidationError(
            f"User {user_id} already reacted to comment {comment_id}"
        )


def react_comment(params: ManageEntityParameters):
    validate_comment_reaction_tx(params)
    comment_id = params.entity_id
    user_id = params.user_id

    comment_reaction_record = CommentReaction(
        comment_id=comment_id,
        user_id=user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )
    params.add_record(
        (user_id, comment_id), comment_reaction_record, EntityType.COMMENT_REACTION
    )


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
