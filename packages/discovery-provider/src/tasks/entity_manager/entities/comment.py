from src.exceptions import IndexingValidationError
from src.models.comments.comment import Comment
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_thread import CommentThread
from src.models.tracks.track import Track
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


def create_comment(params: ManageEntityParameters):
    validate_comment_tx(params)

    comment_id = params.entity_id
    comment_record = Comment(
        comment_id=comment_id,
        user_id=params.user_id,
        text=params.metadata["body"],
        entity_type=params.metadata["entity_type"] or EntityType.TRACK.value,
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
        remix = CommentThread(
            parent_comment_id=params.metadata["parent_comment_id"],
            comment_id=comment_id,
        )
        params.session.add(remix)
    update_entity_comment_count(params, comment_record)


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

    update_entity_comment_count(params, edited_comment)


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

    update_entity_comment_count(params, deleted_comment)


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


def update_entity_comment_count(params: ManageEntityParameters, comment_record: Comment):
    track_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT.value].get(track_id)
    track = params.session.query(Track).filter(Track.track_id == track_id).first()
    if not track:
        raise IndexingValidationError(f"Track {params.entity_id} does not exist")
    if not existing_comment:
        track.coment_count += 1

    else:
        is_now_hidden = not comment_record.is_visible or existing_comment.is_delete
        was_not_hidden = existing_comment.is_visible and not existing_comment.is_delete

        is_now_visible = not is_now_hidden
        was_hidden = not was_not_hidden

        if is_now_hidden and was_not_hidden:
            track.coment_count -= 1
        elif is_now_visible and was_hidden:
            track.comment_count += 1
    params.session.add(track)
