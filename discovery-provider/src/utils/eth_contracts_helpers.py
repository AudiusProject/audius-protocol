import concurrent.futures
import logging

from src.utils import web3_provider
from src.utils.config import shared_config
from src.utils.helpers import is_fqdn, load_eth_abi_values
from src.utils.redis_cache import (
    get_json_cached_key,
    get_sp_id_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)

eth_abi_values = load_eth_abi_values()
SP_FACTORY_REGISTRY_KEY = bytes("ServiceProviderFactory", "utf-8")
CONTENT_NODE_SERVICE_TYPE = bytes("content-node", "utf-8")

cnode_info_redis_ttl = 1800


def fetch_cnode_info(sp_id, sp_factory_instance, redis):
    sp_id_key = get_sp_id_key(sp_id)
    sp_info_cached = get_json_cached_key(redis, sp_id_key)
    if sp_info_cached:
        logger.info(
            f"eth_contract_helpers.py | Found cached value for spID={sp_id} - {sp_info_cached}"
        )
        return sp_info_cached

    cn_endpoint_info = sp_factory_instance.functions.getServiceEndpointInfo(
        CONTENT_NODE_SERVICE_TYPE, sp_id
    ).call()
    set_json_cached_key(redis, sp_id_key, cn_endpoint_info, cnode_info_redis_ttl)
    logger.info(
        f"eth_contract_helpers.py | Configured redis {sp_id_key} - {cn_endpoint_info} - TTL {cnode_info_redis_ttl}"
    )
    return cn_endpoint_info


def fetch_all_registered_content_node_endpoints(
    eth_web3, shared_config, redis, eth_abi_values
) -> set:
    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        SP_FACTORY_REGISTRY_KEY
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    total_cn_type_providers = sp_factory_inst.functions.getTotalServiceTypeProviders(
        CONTENT_NODE_SERVICE_TYPE
    ).call()
    ids_list = list(range(1, total_cn_type_providers + 1))
    eth_cn_endpoints_set = set()
    # Given the total number of nodes in the network we can now fetch node info in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        fetch_cnode_futures = {
            executor.submit(fetch_cnode_info, i, sp_factory_inst, redis): i
            for i in ids_list
        }
        for future in concurrent.futures.as_completed(fetch_cnode_futures):
            single_cnode_fetch_op = fetch_cnode_futures[future]
            try:
                cn_endpoint_info = future.result()
                # Validate the endpoint on chain
                # As endpoints get deregistered, this peering system must not slow down with failed connections
                #   or unanticipated load
                eth_sp_endpoint = cn_endpoint_info[1]
                valid_endpoint = is_fqdn(eth_sp_endpoint)
                # Only valid FQDN strings are worth validating
                if valid_endpoint:
                    eth_cn_endpoints_set.add(eth_sp_endpoint)
            except Exception as exc:
                logger.error(
                    f"eth_contract_helpers.py | ERROR in fetch_cnode_futures {single_cnode_fetch_op} generated {exc}"
                )
    return eth_cn_endpoints_set


def fetch_all_registered_content_node_info():
    # Setup eth web3
    service_provider_factory_instance = _get_service_provider_factory_instance()

    # Get all content nodes
    registered_content_nodes = (
        service_provider_factory_instance.functions.getServiceProviderList(
            CONTENT_NODE_SERVICE_TYPE
        )
    )

    return registered_content_nodes


def _get_service_provider_factory_instance():
    eth_web3 = web3_provider.get_eth_web3()

    eth_registry_address = eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        SP_FACTORY_REGISTRY_KEY
    ).call()
    sp_factory_instance = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )

    return sp_factory_instance
