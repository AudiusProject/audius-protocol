import logging

from src.models.social.follow import Follow
from src.tasks.entity_manager.utils import Action, EntityType, ManageEntityParameters


def validate_follow_tx(params: ManageEntityParameters):
    user_id = params.user_id
    followee_user_id = params.entity_id
    if user_id not in params.existing_records["users"]:
        raise Exception("User does not exist")
    if followee_user_id not in params.existing_records["users"]:
        raise Exception("Followee does not exist")

    # TODO: Validate rest of the options here
    # IE limit set of actions


def create_follow(params: ManageEntityParameters):
    validate_follow_tx(params)
    print("Valid follow detected")
    # Check if follow already exists first
    follower_user_id = params.user_id
    followee_user_id = params.entity_id
    follow_record = Follow(
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        txhash=params.txhash,
        follower_user_id=follower_user_id,
        followee_user_id=followee_user_id,
        is_current=True,
        is_delete=False,
    )
    # Follow ID = <follower_user_id>,<followee_user_id>
    follow_id = f"{follower_user_id},{followee_user_id}"
    params.add_follow_record(follow_id, follow_record)
