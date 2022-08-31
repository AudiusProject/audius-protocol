from typing import Union

from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters

action_to_record_type = {
    Action.FOLLOW.value: EntityType.FOLLOW.value,
    Action.UNFOLLOW.value: EntityType.FOLLOW.value,
    Action.SAVE.value: EntityType.SAVE.value,
    Action.UNSAVE.value: EntityType.SAVE.value,
    Action.REPOST.value: EntityType.REPOST.value,
    Action.UNREPOST.value: EntityType.REPOST.value,
}

create_actions = {Action.FOLLOW.value, Action.SAVE.value, Action.REPOST.value}
delete_actions = {Action.UNFOLLOW.value, Action.UNSAVE.value, Action.UNREPOST.value}


def create_social_record(params: ManageEntityParameters):

    validate_social_feature(params)

    create_record: Union[Save, Follow, Repost, None] = None
    if params.action == Action.FOLLOW.value:
        create_record = Follow(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            created_at=params.block_datetime,
            txhash=params.txhash,
            follower_user_id=params.user_id,
            followee_user_id=params.entity_id,
            is_current=True,
            is_delete=False,
        )
    if params.action == Action.SAVE.value:
        create_record = Save(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            created_at=params.block_datetime,
            txhash=params.txhash,
            user_id=params.user_id,
            save_item_id=params.entity_id,
            save_type=params.entity_type.lower(),
            is_current=True,
            is_delete=False,
        )
    if params.action == Action.REPOST.value:
        create_record = Repost(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            created_at=params.block_datetime,
            txhash=params.txhash,
            user_id=params.user_id,
            repost_item_id=params.entity_id,
            repost_type=params.entity_type.lower(),
            is_current=True,
            is_delete=False,
        )

    if create_record:
        params.add_social_feature_record(
            params.user_id,
            params.entity_type,
            params.entity_id,
            action_to_record_type[params.action],
            create_record,
        )


def delete_social_records(params):

    validate_social_feature(params)

    entity_key = (params.user_id, params.entity_type, params.entity_id)
    record_type = action_to_record_type[params.action]
    existing_entity = params.existing_records[record_type][entity_key]

    if entity_key in params.new_records[params.entity_type]:
        # override with last updated playlist is in this block
        existing_entity = params.new_records[params.entity_type][entity_key][-1]

    deleted_record = None
    if params.action == Action.UNFOLLOW.value:
        deleted_record = Follow(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            follower_user_id=existing_entity.follower_user_id,
            followee_user_id=existing_entity.followee_user_id,
            is_current=existing_entity.is_current,
            is_delete=existing_entity.is_delete,
            created_at=existing_entity.created_at,
            txhash=params.txhash,
        )
    elif params.action == Action.UNSAVE.value:
        deleted_record = Save(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            user_id=existing_entity.user_id,
            save_item_id=existing_entity.save_item_id,
            save_type=existing_entity.save_type,
            is_current=existing_entity.is_current,
            is_delete=existing_entity.is_delete,
            created_at=existing_entity.created_at,
            txhash=params.txhash,
        )
    elif params.action == Action.UNREPOST.value:
        deleted_record = Repost(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            user_id=existing_entity.user_id,
            repost_item_id=existing_entity.repost_item_id,
            repost_type=existing_entity.repost_type,
            is_current=existing_entity.is_current,
            is_delete=existing_entity.is_delete,
            created_at=existing_entity.created_at,
            txhash=params.txhash,
        )

    deleted_record.is_delete = True

    if deleted_record:
        params.add_social_feature_record(
            params.user_id,
            params.entity_type,
            params.entity_id,
            record_type,
            deleted_record,
        )


def validate_social_feature(params: ManageEntityParameters):
    if params.user_id not in params.existing_records[EntityType.USER.value]:
        raise Exception("User does not exists")

    wallet = params.existing_records[EntityType.USER.value][params.user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception("User does not match signer")

    if params.entity_id not in params.existing_records[params.entity_type]:
        raise Exception("Entity does not exist")
    # TODO: Validate rest of the options here
    # IE limit set of actions


def copy_follow_record(
    old_follow: Follow, block_number: int, event_blockhash: str, txhash: str
):
    return Follow(
        blockhash=event_blockhash,
        blocknumber=block_number,
        follower_user_id=old_follow.follower_user_id,
        followee_user_id=old_follow.followee_user_id,
        is_current=old_follow.is_current,
        is_delete=old_follow.is_delete,
        created_at=old_follow.created_at,
        txhash=txhash,
    )


def copy_save_record(
    existing_entity: Save, block_number: int, event_blockhash: str, txhash: str
):
    return Save(
        blockhash=event_blockhash,
        blocknumber=block_number,
        user_id=existing_entity.user_id,
        save_item_id=existing_entity.save_item_id,
        save_type=existing_entity.save_type,
        is_current=existing_entity.is_current,
        is_delete=existing_entity.is_delete,
        created_at=existing_entity.created_at,
        txhash=txhash,
    )
