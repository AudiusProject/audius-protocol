from typing import Union

from src.models.social.follow import Follow
from src.models.social.repost import Repost
from src.models.social.save import Save
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters

action_to_record_type = {
    Action.FOLLOW: EntityType.FOLLOW,
    Action.UNFOLLOW: EntityType.FOLLOW,
    Action.SAVE: EntityType.SAVE,
    Action.UNSAVE: EntityType.SAVE,
    Action.REPOST: EntityType.REPOST,
    Action.UNREPOST: EntityType.REPOST,
}

create_social_action_types = {Action.FOLLOW, Action.SAVE, Action.REPOST}
delete_social_action_types = {Action.UNFOLLOW, Action.UNSAVE, Action.UNREPOST}

premium_content_validation_actions = {
    Action.SAVE,
    Action.UNSAVE,
    Action.REPOST,
    Action.UNREPOST,
}
premium_content_validation_entities = {EntityType.TRACK}


def create_social_record(params: ManageEntityParameters):

    validate_social_feature(params)

    create_record: Union[Save, Follow, Repost, None] = None
    if params.action == Action.FOLLOW:
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
    if params.action == Action.SAVE:
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
    if params.action == Action.REPOST:
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


def delete_social_record(params):

    validate_social_feature(params)

    deleted_record = None
    if params.action == Action.UNFOLLOW:
        deleted_record = Follow(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            follower_user_id=params.user_id,
            followee_user_id=params.entity_id,
            is_current=True,
            is_delete=True,
            created_at=params.block_datetime,
            txhash=params.txhash,
        )
    elif params.action == Action.UNSAVE:
        deleted_record = Save(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            created_at=params.block_datetime,
            txhash=params.txhash,
            user_id=params.user_id,
            save_item_id=params.entity_id,
            save_type=params.entity_type.lower(),
            is_current=True,
            is_delete=True,
        )
    elif params.action == Action.UNREPOST:
        deleted_record = Repost(
            blockhash=params.event_blockhash,
            blocknumber=params.block_number,
            created_at=params.block_datetime,
            txhash=params.txhash,
            user_id=params.user_id,
            repost_item_id=params.entity_id,
            repost_type=params.entity_type.lower(),
            is_current=True,
            is_delete=True,
        )

    if deleted_record:
        record_type = action_to_record_type[params.action]
        params.add_social_feature_record(
            params.user_id,
            params.entity_type,
            params.entity_id,
            record_type,
            deleted_record,
        )


def validate_social_feature(params: ManageEntityParameters):
    if params.user_id not in params.existing_records[EntityType.USER]:
        raise Exception("User does not exists")

    wallet = params.existing_records[EntityType.USER][params.user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception("User does not match signer")

    if params.entity_id not in params.existing_records[params.entity_type]:
        raise Exception("Entity does not exist")

    if params.action == Action.FOLLOW or params.action == Action.UNFOLLOW:
        if params.user_id == params.entity_id:
            raise Exception("User cannot follow themself")
