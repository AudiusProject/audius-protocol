import logging

from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
)

def validate_follow_tx(params: ManageEntityParameters):
    user_id = params.user_id
    followee_user_id = params.entity_id
    if user_id not in params.existing_records["users"]:
        raise Exception("User does not exist")
    if followee_user_id not in params.existing_records["users"]:
        raise Exception("Followee does not exist")