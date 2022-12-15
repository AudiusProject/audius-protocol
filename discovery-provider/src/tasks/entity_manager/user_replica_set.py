import logging
from typing import List, Tuple

from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.tasks.user_replica_set import get_endpoint_string_from_sp_ids
from src.utils.eth_manager import ServiceProviderType

logger = logging.getLogger(__name__)


def parse_update_sp_id(params) -> Tuple[List[int], List[int]]:
    sp_ids = params.metadata_cid.split(":")
    if len(sp_ids) != 2:
        raise Exception('Invalid format entity_id should be ":" separated')
    return parse_sp_ids(sp_ids[0]), parse_sp_ids(sp_ids[1])


def parse_sp_ids(sp_ids_str: str) -> List[int]:
    sp_ids = sp_ids_str.split(",")
    for sp_id in sp_ids:
        if not sp_id.isdigit():
            raise Exception(f"sp id of {sp_id} is not a digit")
    if len(sp_ids) < 3:
        raise Exception("Too few updated sp ids")

    return [int(id) for id in sp_ids]


def is_valid_user_replica_set_tx(params: ManageEntityParameters) -> None:
    user_id = params.user_id
    if user_id not in params.existing_records[EntityType.USER]:
        # user does not exist
        raise Exception(f"User {user_id} does not exist")
    # Validate the signer is the user or in the current replica set of content nodes
    user = params.existing_records[EntityType.USER][user_id]
    user_sp_ids = [user.primary_id]
    if user.secondary_ids:
        user_sp_ids = user_sp_ids + user.secondary_ids
    if user.wallet and user.wallet.lower() != params.signer.lower():
        # user does not match signer
        # check the content nodes
        valid_cn_signer = False
        user_replica_set_sp_ids = set(user_sp_ids)
        for sp_id in user_replica_set_sp_ids:
            sp_info_cached = params.eth_manager.fetch_node_info(
                sp_id, ServiceProviderType.CONTENT, params.redis
            )

            delegator_wallet = sp_info_cached["delegator_wallet"]
            if delegator_wallet.lower() == params.signer.lower():
                valid_cn_signer = True
        if not valid_cn_signer:
            raise Exception("Invalid tx signer")

    current_sp_ids, updated_sp_ids = parse_update_sp_id(params)
    if current_sp_ids[0] != user_sp_ids[0] or set(current_sp_ids[1:]) != set(
        user_sp_ids[1:]
    ):
        raise Exception(
            f"Current sp ids does not match parameters, current: {current_sp_ids} and requested {user_sp_ids}"
        )

    if len(set(updated_sp_ids)) != len(updated_sp_ids):
        raise Exception("Duplicate sp ids not allowed")

    for sp_id in updated_sp_ids:
        sp_info_cached = params.eth_manager.fetch_node_info(
            sp_id, ServiceProviderType.CONTENT, params.redis
        )
        if not sp_info_cached or sp_info_cached["endpoint"] == "":
            raise Exception(
                "Cannot set sp ids to invalid set with unregistered service"
            )

    if params.entity_type != EntityType.USER_REPLICA_SET:
        raise Exception("Invalid entity type")

    if params.action != Action.UPDATE:
        raise Exception("Invalid tx action")


def update_user_replica_set(params: ManageEntityParameters):
    is_valid_user_replica_set_tx(params)

    user_id = params.user_id
    existing_user = params.existing_records[EntityType.USER][user_id]
    existing_user.is_current = False  # invalidate
    if (
        user_id in params.new_records[EntityType.USER]
    ):  # override with last updated user is in this block
        existing_user = params.new_records[EntityType.USER][user_id][-1]
    updated_user = copy_record(
        existing_user,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    # Validate the new replica set is valid
    _, updated_sp_ids = parse_update_sp_id(params)

    # Update the user's new replica set in the model and save!
    updated_user.primary_id = updated_sp_ids[0]
    updated_user.secondary_ids = updated_sp_ids[1:]
    updated_user.replica_set_update_signer = params.signer

    # Update cnode endpoint string reconstructed from sp ID
    creator_node_endpoint_str = get_endpoint_string_from_sp_ids(
        params.redis, updated_sp_ids[0], updated_sp_ids[1:]
    )
    updated_user.creator_node_endpoint = creator_node_endpoint_str

    params.add_user_record(user_id, updated_user)
