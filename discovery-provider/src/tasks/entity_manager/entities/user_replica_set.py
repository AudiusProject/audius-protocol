import logging
from typing import Any, List, Tuple

from redis import Redis
from web3 import Web3

from src.app import get_eth_abi_values
from src.exceptions import IndexingValidationError
from src.tasks.entity_manager.utils import (
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.utils import web3_provider
from src.utils.config import shared_config
from src.utils.eth_contracts_helpers import (
    cnode_info_redis_ttl_s,
    content_node_service_type,
    sp_factory_registry_key,
)
from src.utils.eth_manager import ServiceProviderType
from src.utils.redis_cache import (
    get_cn_sp_id_key,
    get_json_cached_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)


eth_web3 = web3_provider.get_eth_web3()


# Fetch content node endpoint info from cache or from mainnet eth.
# If unavailable, then a fallback to ethereum mainnet contracts will occur
# Note that in the case of an invalid spID - one that is not yet registered on
# the ethereum mainnet contracts, there will be an empty value in the returned
# creator_node_endpoint
# If this discrepancy occurs, a client replica set health check sweep will
# result in a client-initiated failover operation to a valid set of replicas
def get_endpoint_string_from_sp_ids(
    redis: Redis, primary: int, secondaries: List[int]
) -> str:
    sp_factory_inst = None
    endpoint_string = None
    primary_endpoint = None
    try:
        sp_factory_inst, primary_endpoint = get_endpoint_from_id(
            redis, sp_factory_inst, primary
        )
        endpoint_string = f"{primary_endpoint}"
        for secondary_id in secondaries:
            secondary_endpoint = None
            sp_factory_inst, secondary_endpoint = get_endpoint_from_id(
                redis, sp_factory_inst, secondary_id
            )
            # Conditionally log if endpoint is None after fetching
            if not secondary_endpoint:
                logger.info(
                    f"index.py | user_replica_set.py | Failed to find secondary info for {secondary_id}"
                )
            # Append to endpoint string regardless of status
            endpoint_string = f"{endpoint_string},{secondary_endpoint}"
    except Exception as exc:
        logger.error(
            f"index.py | user_replica_set.py | ERROR in get_endpoint_string_from_sp_ids {exc}"
        )
        raise exc
    logger.info(
        f"index.py | user_replica_set.py | constructed:"
        f"{endpoint_string} from {primary},{secondaries}",
        exc_info=True,
    )
    return endpoint_string


# Initializes sp_factory if necessary and retrieves spID
# Returns initialized instance of contract and endpoint
def get_endpoint_from_id(redis: Redis, sp_factory_inst, sp_id: int) -> Tuple[Any, str]:
    endpoint = None
    # Get sp_id cache key
    cache_key = get_cn_sp_id_key(sp_id)
    # Attempt to fetch from cache
    sp_info_cached = get_json_cached_key(redis, cache_key)
    if sp_info_cached:
        endpoint = sp_info_cached[1]
        logger.info(
            f"index.py | user_replica_set.py | CACHE HIT FOR {cache_key}, found {sp_info_cached}"
        )
        return sp_factory_inst, endpoint

    if not endpoint:
        logger.info(
            f"index.py | user_replica_set.py | CACHE MISS FOR {cache_key}, found {sp_info_cached}"
        )
        if sp_factory_inst is None:
            sp_factory_inst = get_sp_factory_inst()

        cn_endpoint_info = sp_factory_inst.functions.getServiceEndpointInfo(
            content_node_service_type, sp_id
        ).call()
        logger.info(
            f"index.py | user_replica_set.py | spID={sp_id} fetched {cn_endpoint_info}"
        )
        set_json_cached_key(redis, cache_key, cn_endpoint_info, cnode_info_redis_ttl_s)
        endpoint = cn_endpoint_info[1]

    return sp_factory_inst, endpoint


# Return instance of ServiceProviderFactory initialized with configs
def get_sp_factory_inst():
    eth_registry_address = Web3.to_checksum_address(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=get_eth_abi_values()["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        sp_factory_registry_key
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address,
        abi=get_eth_abi_values()["ServiceProviderFactory"]["abi"],
    )
    return sp_factory_inst


def parse_update_sp_id(params) -> Tuple[List[int], List[int]]:
    sp_ids = params.metadata.split(":")
    if len(sp_ids) != 2:
        raise IndexingValidationError(
            'Invalid format entity_id should be ":" separated'
        )
    return parse_sp_ids(sp_ids[0]), parse_sp_ids(sp_ids[1])


def parse_sp_ids(sp_ids_str: str) -> List[int]:
    sp_ids = sp_ids_str.split(",")
    for sp_id in sp_ids:
        if not sp_id.isdigit():
            raise IndexingValidationError(f"sp id of {sp_id} is not a digit")
    if len(sp_ids) < 3:
        raise IndexingValidationError("Too few updated sp ids")

    return [int(id) for id in sp_ids]


def is_valid_user_replica_set_tx(params: ManageEntityParameters) -> None:
    user_id = params.user_id
    if user_id not in params.existing_records["User"]:
        # user does not exist
        raise IndexingValidationError(f"User {user_id} does not exist")
    # Validate the signer is the user or in the current replica set of content nodes
    user = params.existing_records["User"][user_id]
    user_sp_ids: List[int] = [user.primary_id] if user.primary_id else []
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
            raise IndexingValidationError("Invalid tx signer")

    current_sp_ids, updated_sp_ids = parse_update_sp_id(params)
    if current_sp_ids[0] != user_sp_ids[0] or set(current_sp_ids[1:]) != set(
        user_sp_ids[1:]
    ):
        raise IndexingValidationError(
            f"Current sp ids does not match parameters, current: {current_sp_ids} and requested {user_sp_ids}"
        )

    if len(set(updated_sp_ids)) != len(updated_sp_ids):
        raise IndexingValidationError("Duplicate sp ids not allowed")

    for sp_id in updated_sp_ids:
        sp_info_cached = params.eth_manager.fetch_node_info(
            sp_id, ServiceProviderType.CONTENT, params.redis
        )
        if not sp_info_cached or sp_info_cached["endpoint"] == "":
            raise IndexingValidationError(
                "Cannot set sp ids to invalid set with unregistered service"
            )

    if params.entity_type != EntityType.USER_REPLICA_SET:
        raise IndexingValidationError("Invalid entity type")

    if params.action != Action.UPDATE:
        raise IndexingValidationError("Invalid tx action")


def update_user_replica_set(params: ManageEntityParameters):
    is_valid_user_replica_set_tx(params)

    user_id = params.user_id
    existing_user = params.existing_records["User"][user_id]

    if (
        user_id in params.new_records["User"]
    ):  # override with last updated user is in this block
        existing_user = params.new_records["User"][user_id][-1]
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

    params.add_record(user_id, updated_user, record_type=EntityType.USER)
