from sqlalchemy import func

from src.exceptions import IndexingValidationError
from src.models.comments.comment import Comment
from src.models.comments.comment_mention import CommentMention
from src.models.comments.comment_notification_setting import CommentNotificationSetting
from src.models.comments.comment_reaction import CommentReaction
from src.models.comments.comment_report import (
    COMMENT_REPORT_KARMA_THRESHOLD,
    CommentReport,
)
from src.models.comments.comment_thread import CommentThread
from src.models.moderation.muted_user import MutedUser
from src.models.notifications.notification import Notification
from src.models.users.aggregate_user import AggregateUser
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    safe_add_notification,
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
    if (
        params.metadata["entity_id"]
        not in params.existing_records[EntityType.TRACK.value]
    ):
        raise IndexingValidationError(
            f"Track {params.metadata['entity_id']} does not exist"
        )
    if params.metadata["body"] is None or params.metadata["body"] == "":
        raise IndexingValidationError("Comment body is empty")

    # Validate parent_comment_id if it exists
    parent_comment_id = params.metadata.get("parent_comment_id")
    if parent_comment_id:
        if not isinstance(parent_comment_id, int):
            raise IndexingValidationError(
                f"parent_comment_id {parent_comment_id} must be a number"
            )
        elif parent_comment_id not in params.existing_records[EntityType.COMMENT.value]:
            raise IndexingValidationError(
                f"parent_comment_id {parent_comment_id} does not exist"
            )
        elif (parent_comment_id, comment_id) in params.existing_records[
            EntityType.COMMENT_THREAD.value
        ]:
            raise IndexingValidationError(
                f"comment_thread {(parent_comment_id, comment_id)} already exists"
            )

    mentions = params.metadata.get("mentions")
    if mentions and not all(isinstance(i, int) for i in mentions):
        raise IndexingValidationError(f"Mentions {mentions} must be a list of numbers")


def create_comment(params: ManageEntityParameters):
    validate_comment_tx(params)
    existing_records = params.existing_records
    metadata = params.metadata
    user_id = params.user_id
    entity_id = metadata.get("entity_id")
    entity_type = metadata.get("entity_type", EntityType.TRACK.value)
    entity_user_id = existing_records[EntityType.TRACK.value][entity_id].owner_id
    mentions = set(metadata.get("mentions") or [])
    is_owner_mentioned = entity_user_id in mentions
    parent_comment_id = metadata.get("parent_comment_id")
    parent_comment = (
        existing_records[EntityType.COMMENT.value][parent_comment_id]
        if parent_comment_id
        else None
    )
    parent_comment_user_id = parent_comment.user_id if parent_comment else None
    is_reply = parent_comment_id is not None
    track_owner_notifications_off = params.session.query(
        params.session.query(CommentNotificationSetting)
        .filter(
            CommentNotificationSetting.entity_type == "Track",
            CommentNotificationSetting.entity_id == entity_id,
            CommentNotificationSetting.user_id == entity_user_id,
            CommentNotificationSetting.is_muted == True,
        )
        .exists()
        | params.session.query(MutedUser)
        .filter(
            MutedUser.muted_user_id == user_id,
            MutedUser.user_id == entity_user_id,
            MutedUser.is_delete == False,
        )
        .exists()
    ).scalar()

    comment_id = params.entity_id
    comment_record = Comment(
        comment_id=comment_id,
        user_id=user_id,
        text=metadata["body"],
        entity_type=entity_type,
        entity_id=entity_id,
        track_timestamp_s=metadata["track_timestamp_s"],
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    params.add_record(comment_id, comment_record, EntityType.COMMENT)

    if (
        not is_reply
        and not is_owner_mentioned
        and not track_owner_notifications_off
        and user_id != entity_user_id
    ):
        comment_notification = Notification(
            blocknumber=params.block_number,
            user_ids=[entity_user_id],
            timestamp=params.block_datetime,
            type="comment",
            specifier=str(user_id),
            group_id=f"comment:{entity_id}:type:{entity_type}",
            data={
                "type": entity_type,
                "entity_id": entity_id,
                "comment_user_id": user_id,
            },
        )

        safe_add_notification(params, comment_notification)
    if mentions:
        mention_mutes = (
            params.session.query(MutedUser)
            .filter(MutedUser.muted_user_id == user_id, MutedUser.user_id.in_(mentions))
            .all()
        )

        for mention in mentions:
            comment_mention = CommentMention(
                comment_id=comment_id,
                user_id=mention,
                txhash=params.txhash,
                blockhash=params.event_blockhash,
                blocknumber=params.block_number,
                created_at=params.block_datetime,
                updated_at=params.block_datetime,
                is_delete=False,
            )
            params.add_record(
                (comment_id, mention),
                comment_mention,
                EntityType.COMMENT_MENTION,
            )

            track_owner_mention_mute = (
                mention == entity_user_id and track_owner_notifications_off
            )

            if (
                mention != user_id
                and mention != parent_comment_user_id
                and mention not in mention_mutes
                and not track_owner_mention_mute
            ):
                mention_notification = Notification(
                    blocknumber=params.block_number,
                    user_ids=[mention],
                    timestamp=params.block_datetime,
                    type="comment_mention",
                    specifier=str(mention),
                    group_id=f"comment_mention:{entity_id}:type:{entity_type}",
                    data={
                        "type": entity_type,
                        "entity_id": entity_id,
                        "entity_user_id": entity_user_id,
                        "comment_user_id": user_id,
                    },
                )
                safe_add_notification(params, mention_notification)

    if parent_comment_id:
        comment_thread = CommentThread(
            parent_comment_id=parent_comment_id,
            comment_id=comment_id,
        )
        params.add_record(
            (parent_comment_id, comment_id), comment_thread, EntityType.COMMENT_THREAD
        )

        parent_comment_owner_notifications_off = params.session.query(
            params.session.query(CommentNotificationSetting)
            .filter(
                CommentNotificationSetting.entity_type == EntityType.COMMENT.value,
                CommentNotificationSetting.entity_id == parent_comment_id,
                CommentNotificationSetting.user_id == parent_comment_user_id,
                CommentNotificationSetting.is_muted == True,
            )
            .exists()
            | params.session.query(MutedUser)
            .filter(
                MutedUser.muted_user_id == user_id,
                MutedUser.user_id == parent_comment_user_id,
                MutedUser.is_delete == False,
            )
            .exists()
        ).scalar()

        if (
            user_id != parent_comment_user_id
            and not parent_comment_owner_notifications_off
        ):
            thread_notification = Notification(
                blocknumber=params.block_number,
                user_ids=[parent_comment_user_id],
                timestamp=params.block_datetime,
                type="comment_thread",
                specifier=str(user_id),
                group_id=f"comment_thread:{parent_comment_id}",
                data={
                    "type": entity_type,
                    "entity_id": entity_id,
                    "entity_user_id": entity_user_id,
                    "comment_user_id": user_id,
                },
            )
            safe_add_notification(params, thread_notification)


def validate_update_comment_tx(params: ManageEntityParameters):
    validate_signer(params)
    comment_id = params.entity_id
    existing_comment = params.existing_records[EntityType.COMMENT.value].get(comment_id)
    if not existing_comment:
        raise IndexingValidationError(f"Comment {comment_id} does not exist")
    if existing_comment.is_delete:
        raise IndexingValidationError(f"Comment {comment_id} is deleted")


def get_existing_mentions_for_comment(params: ManageEntityParameters, comment_id: int):
    all_existing_mentions = params.existing_records[EntityType.COMMENT_MENTION.value]
    return {k[1]: v for k, v in all_existing_mentions.items() if k[0] == comment_id}


def update_comment(params: ManageEntityParameters):
    validate_update_comment_tx(params)
    existing_records = params.existing_records
    metadata = params.metadata
    comment_id = params.entity_id
    existing_comment = existing_records[EntityType.COMMENT.value][comment_id]
    user_id = params.user_id
    entity_id = metadata.get("entity_id")
    entity_type = metadata.get("entity_type", EntityType.TRACK.value)
    entity_user_id = existing_records[EntityType.TRACK.value][entity_id].owner_id

    comment_reports = (
        params.session.query(CommentReport)
        .filter(CommentReport.comment_id == comment_id)
        .all()
    )
    reporting_user_ids = [report.user_id for report in comment_reports]

    is_comment_shadowbanned = (
        params.session.query(
            func.sum(AggregateUser.follower_count) >= COMMENT_REPORT_KARMA_THRESHOLD
        )
        .filter(AggregateUser.user_id.in_(reporting_user_ids))
        .scalar()
        or False
    )

    mentions = set(metadata.get("mentions") or [])
    parent_comment_id = metadata.get("parent_comment_id")
    parent_comment = existing_records[EntityType.COMMENT.value].get(parent_comment_id)
    parent_comment_user_id = parent_comment.user_id if parent_comment else None

    track_owner_notifications_off = params.session.query(
        params.session.query(CommentNotificationSetting)
        .filter(
            CommentNotificationSetting.entity_type == "Track",
            CommentNotificationSetting.entity_id == entity_id,
            CommentNotificationSetting.user_id == entity_user_id,
            CommentNotificationSetting.is_muted == True,
        )
        .exists()
        | params.session.query(MutedUser)
        .filter(
            MutedUser.muted_user_id == user_id,
            MutedUser.user_id == entity_user_id,
            MutedUser.is_delete == False,
        )
        .exists()
    ).scalar()

    edited_comment = copy_record(
        existing_comment,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    edited_comment.is_edited = True
    edited_comment.text = metadata["body"]

    params.add_record(comment_id, edited_comment, EntityType.COMMENT)

    if mentions:
        mention_mutes = (
            params.session.query(MutedUser)
            .filter(MutedUser.muted_user_id == user_id, MutedUser.user_id.in_(mentions))
            .all()
        )
        existing_mentions = get_existing_mentions_for_comment(params, comment_id)
        existing_mention_ids = set(existing_mentions.keys())

        # Delete mentions that are not in the new mentions list
        for mention_user_id in existing_mention_ids - mentions:
            existing_mention = existing_mentions[mention_user_id]
            if existing_mention and not existing_mention.is_delete:
                deleted_mention = copy_record(
                    existing_mention,
                    params.block_number,
                    params.event_blockhash,
                    params.txhash,
                    params.block_datetime,
                )
                deleted_mention.is_delete = True
                params.add_record(
                    (comment_id, mention_user_id),
                    deleted_mention,
                    EntityType.COMMENT_MENTION,
                )

        # Add new mentions or reactivate deleted mentions
        for mention_user_id in mentions:
            existing_mention = existing_mentions.get(mention_user_id)
            if existing_mention:
                if existing_mention.is_delete:
                    reactivated_mention = copy_record(
                        existing_mention,
                        params.block_number,
                        params.event_blockhash,
                        params.txhash,
                        params.block_datetime,
                    )
                    reactivated_mention.is_delete = False
                    params.add_record(
                        (comment_id, mention_user_id),
                        reactivated_mention,
                        EntityType.COMMENT_MENTION,
                    )
            else:
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
                    (comment_id, mention_user_id),
                    new_mention,
                    EntityType.COMMENT_MENTION,
                )

                track_owner_mention_mute = (
                    mention_user_id == entity_user_id and track_owner_notifications_off
                )
                if (
                    mention_user_id != user_id
                    and mention_user_id != parent_comment_user_id
                    and mention_user_id not in mention_mutes
                    and not track_owner_mention_mute
                    and not is_comment_shadowbanned
                    and entity_user_id not in reporting_user_ids
                    and mention_user_id not in reporting_user_ids
                ):
                    mention_notification = Notification(
                        blocknumber=params.block_number,
                        user_ids=[mention_user_id],
                        timestamp=params.block_datetime,
                        type="comment_mention",
                        specifier=str(mention_user_id),
                        group_id=f"comment_mention:{entity_id}:type:{entity_type}",
                        data={
                            "type": entity_type,
                            "entity_id": entity_id,
                            "entity_user_id": entity_user_id,
                            "comment_user_id": user_id,
                        },
                    )
                    safe_add_notification(params, mention_notification)


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
