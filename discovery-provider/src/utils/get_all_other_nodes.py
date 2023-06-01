import asyncio
import logging
from typing import List, Optional, Tuple

from src.utils import web3_provider
from src.utils.config import shared_config
from src.utils.helpers import is_fqdn, load_eth_abi_values
from src.utils.redis_cache import get_json_cached_key

logger = logging.getLogger(__name__)

eth_abi_values = load_eth_abi_values()
REWARDS_CONTRACT_ABI = eth_abi_values["EthRewardsManager"]["abi"]
SP_FACTORY_REGISTRY_KEY = bytes("ServiceProviderFactory", "utf-8")
DISCOVERY_NODE_SERVICE_TYPE = bytes("discovery-node", "utf-8")
CONTENT_NODE_SERVICE_TYPE = bytes("content-node", "utf-8")
ALL_DISCOVERY_NODES_CACHE_KEY = "all-discovery-nodes"
ALL_CONTENT_NODES_CACHE_KEY = "all-content-nodes"


# Perform eth web3 call to fetch endpoint info
def fetch_node_info(sp_id, sp_factory_instance, service_type):
    return sp_factory_instance.functions.getServiceEndpointInfo(
        service_type, sp_id
    ).call()


def get_node_endpoint() -> Optional[str]:
    """
    Get endpoint for this discovery node from the config
    """
    node_url = shared_config["discprov"]["url"]
    if not node_url or not is_fqdn(node_url):
        return None
    return node_url.rstrip("/")


async def get_async_node(sp_id, sp_factory_instance, service_type):
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, fetch_node_info, sp_id, sp_factory_instance, service_type
    )

    return result


def get_all_nodes(service_type: str) -> Tuple[List[str], List[str]]:
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
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    num_nodes = sp_factory_inst.functions.getTotalServiceTypeProviders(
        service_type
    ).call()

    ids_list = list(range(1, num_nodes + 1))
    all_other_nodes = []
    all_other_wallets = []

    # fetch all discovery nodes info in parallel
    async def fetch_results():
        result = await asyncio.gather(
            *map(
                lambda sp_id: get_async_node(sp_id, sp_factory_inst, service_type),
                ids_list,
            )
        )
        return result

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    resp = asyncio.run(fetch_results())

    for node_info in resp:
        try:
            wallet = node_info[3]
            if wallet != shared_config["delegate"]["owner_wallet"]:
                endpoint = node_info[1]
                if is_fqdn(endpoint):
                    all_other_nodes.append(endpoint)
                    all_other_wallets.append(wallet)
        except Exception as e:
            logger.error(
                f"get_all_other_nodes.py | ERROR in fetching node info {node_info} generated {e}"
            )

    return all_other_nodes, all_other_wallets


def get_all_other_discovery_nodes() -> Tuple[List[str], List[str]]:
    return get_all_nodes(DISCOVERY_NODE_SERVICE_TYPE)


def get_all_other_content_nodes() -> Tuple[List[str], List[str]]:
    return get_all_nodes(CONTENT_NODE_SERVICE_TYPE)


def get_all_other_discovery_nodes_cached(redis) -> List[str]:
    """
    Attempts to get the number of discovery nodes from redis.
    """

    return get_json_cached_key(redis, ALL_DISCOVERY_NODES_CACHE_KEY)


def get_all_other_content_nodes_cached(redis) -> List[str]:
    """
    Attempts to get the number of content nodes from redis.
    """

    return get_json_cached_key(redis, ALL_CONTENT_NODES_CACHE_KEY)
