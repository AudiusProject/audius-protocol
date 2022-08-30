from src.models.social.follow import Follow
from src.models.social.save import Save
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters

# saves
action_to_record_type = {
    Action.FOLLOW: EntityType.FOLLOW.value,
    Action.UNFOLLOW: EntityType.FOLLOW.value,
    Action.SAVE: EntityType.SAVE.value,
    Action.UNSAVE: EntityType.SAVE.value,
}

create_actions = {Action.FOLLOW.value, Action.SAVE.value}
delete_actions = {Action.UNFOLLOW, Action.UNSAVE}


def create_social_record(params: ManageEntityParameters):

    validate_social_feature(params)

    create_record = None
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
        deleted_record = copy_follow_record(
            existing_entity, params.block_number, params.event_blockhash, params.txhash
        )
    elif params.action == Action.SAVE or params.action == Action.UNSAVE:
        deleted_record = copy_save_record(
            existing_entity, params.block_number, params.event_blockhash, params.txhash
        )

    deleted_record.is_delete = True

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
    old_save: Save, block_number: int, event_blockhash: str, txhash: str
):
    return Save(
        blockhash=event_blockhash,
        blocknumber=block_number,
        user_id=old_save.user_id,
        save_item_id=old_save.save_item_id,
        save_type=old_save.save_type,
        is_current=old_save.is_current,
        is_delete=old_save.is_delete,
        created_at=old_save.created_at,
        txhash=txhash,
    )
