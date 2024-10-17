from src.exceptions import IndexingValidationError
from src.models.comments.comment import Comment
from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import CommentReport
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

    # Validate parent_comment_id if it exists
    parent_comment_id = params.metadata.get("parent_comment_id")
    if parent_comment_id is not None and not isinstance(parent_comment_id, int):
        raise IndexingValidationError(
            f"parent_comment_id {parent_comment_id} must be a number"
        )

    mentions = params.metadata.get("mentions")
    if mentions and not all(isinstance(i, int) for i in mentions):
        raise IndexingValidationError(f"Mentions {mentions} must be a list of numbers")


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

    params.add_record(comment_id, comment_record, EntityType.COMMENT)

    if params.metadata.get("mentions"):
        new_mention_user_ids = set(params.metadata["mentions"])
        for mention_user_id in new_mention_user_ids:
            comment_mention = CommentMention(
                comment_id=comment_id,
                user_id=mention_user_id,
                txhash=params.txhash,
                blockhash=params.event_blockhash,
                blocknumber=params.block_number,
                created_at=params.block_datetime,
                updated_at=params.block_datetime,
                is_delete=False,
            )
            params.add_record(
                (comment_id, mention_user_id),
                comment_mention,
                EntityType.COMMENT_MENTION,
            )

    if params.metadata.get("parent_comment_id"):
        parent_comment_id = params.metadata.get("parent_comment_id")
        existing_comment_thread = (
            params.session.query(CommentThread)
            .filter_by(
                parent_comment_id=parent_comment_id,
                comment_id=comment_id,
            )
            .first()
        )

        if existing_comment_thread:
            return

        comment_thread = CommentThread(
            parent_comment_id=parent_comment_id,
            comment_id=comment_id,
        )
        params.add_record(
            (parent_comment_id, comment_id), comment_thread, EntityType.COMMENT_THREAD
        )


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

    params.add_record(comment_id, edited_comment, EntityType.COMMENT)

    if "mentions" in params.metadata:
        new_mentions = set(params.metadata["mentions"])

        existing_mentions = {
            k[1]: v
            for k, v in params.existing_records[
                EntityType.COMMENT_MENTION.value
            ].items()
            if k[0] == comment_id
        }
        existing_mention_ids = set(existing_mentions.keys())

        # Delete mentions that are not in the new mentions list
        for mention_user_id in existing_mention_ids - new_mentions:
            existing_mention = existing_mentions[mention_user_id]

            if existing_mention:
                existing_mention.is_delete = True

                params.add_record(
                    (comment_id, mention_user_id),
                    existing_mention,
                    EntityType.COMMENT_MENTION,
                )

        # Add new mentions
        for mention_user_id in new_mentions - existing_mention_ids:
            new_mention = CommentMention(
                comment_id=comment_id,
                user_id=mention_user_id,
                txhash=params.txhash,
                blockhash=params.event_blockhash,
                blocknumber=params.block_number,
                created_at=params.block_datetime,
                updated_at=params.block_datetime,
                is_delete=False,
            )

            params.add_record(
                (comment_id, mention_user_id), new_mention, EntityType.COMMENT_MENTION
            )


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

    params.add_record(comment_id, deleted_comment, EntityType.COMMENT)


def validate_comment_reaction_tx(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    user_id = params.user_id
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


def validate_report_comment_tx(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    user_id = params.user_id
    comment_reports = params.existing_records[EntityType.COMMENT_REPORT.value]

    if (user_id, comment_id) in comment_reports:
        raise IndexingValidationError(
            f"User {user_id} already reported comment {comment_id}"
        )


def report_comment(params: ManageEntityParameters):
    validate_report_comment_tx(params)
    comment_id = params.entity_id
    user_id = params.user_id

    comment_report = CommentReport(
        comment_id=comment_id,
        user_id=user_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )
    params.add_record((user_id, comment_id), comment_report, EntityType.COMMENT_REPORT)


def validate_pin_tx(params: ManageEntityParameters, is_pin):
    validate_signer(params)
    comment_id = params.entity_id
    comment_records = params.existing_records[EntityType.COMMENT.value]

    if comment_id not in comment_records:
        raise IndexingValidationError(f"Comment {comment_id} doesn't exist")

    user_id = params.user_id
    metadata = params.metadata
    track_records = params.existing_records[EntityType.TRACK.value]
    track_id = metadata["entity_id"]
    if track_id not in track_records:
        raise IndexingValidationError(
            f"Comment {comment_id}'s Track {track_id} does not exist"
        )
    track = track_records[track_id]
    if track.owner_id != user_id:
        raise IndexingValidationError(
            f"Comment {comment_id} cannot be pinned by user {user_id}"
        )
    elif track.pinned_comment_id == comment_id and is_pin:
        raise IndexingValidationError(f"Comment {comment_id} already pinned")
    elif track.pinned_comment_id != comment_id and not is_pin:
        raise IndexingValidationError(f"Comment {comment_id} already unpinned")


def pin_comment(params: ManageEntityParameters):
    validate_pin_tx(params, True)
    comment_id = params.entity_id
    track_id = params.metadata["entity_id"]
    existing_track = params.existing_records[EntityType.TRACK.value][track_id]

    track = copy_record(
        existing_track,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    track.pinned_comment_id = comment_id

    params.add_record(track_id, track, EntityType.TRACK)


def unpin_comment(params: ManageEntityParameters):
    validate_pin_tx(params, False)
    track_id = params.metadata["entity_id"]
    existing_track = params.existing_records[EntityType.TRACK.value][track_id]

    track = copy_record(
        existing_track,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    track.pinned_comment_id = None

    params.add_record(track_id, track, EntityType.TRACK)


def update_comment_notification_setting(params: ManageEntityParameters):
    entity_id = params.entity_id
    entity_type = params.entity_type
    user_id = params.user_id
    action = params.action
    created_at = params.block_datetime
    updated_at = params.block_datetime

    comment_notification_record = CommentNotificationSetting(
        user_id=user_id,
        entity_id=entity_id,
        entity_type=entity_type,
        is_muted=action == Action.MUTE,
        created_at=created_at,
        updated_at=updated_at,
    )
    params.add_record(
        (user_id, entity_id, entity_type),
        comment_notification_record,
        EntityType.COMMENT_NOTIFICATION_SETTING,
    )
