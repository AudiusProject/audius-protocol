import asyncio
import logging
from typing import List, Optional, Tuple

from src.utils import web3_provider
from src.utils.config import shared_config
from src.utils.helpers import is_fqdn, load_eth_abi_values

logger = logging.getLogger(__name__)

eth_abi_values = load_eth_abi_values()
REWARDS_CONTRACT_ABI = eth_abi_values["EthRewardsManager"]["abi"]
SP_FACTORY_REGISTRY_KEY = bytes("ServiceProviderFactory", "utf-8")
DISCOVERY_NODE_SERVICE_TYPE = bytes("discovery-node", "utf-8")


# Perform eth web3 call to fetch endpoint info
def fetch_discovery_node_info(sp_id, sp_factory_instance):
    return sp_factory_instance.functions.getServiceEndpointInfo(
        DISCOVERY_NODE_SERVICE_TYPE, sp_id
    ).call()


def get_node_endpoint() -> Optional[str]:
    """
    Get endpoint for this discovery node from the config
    """
    node_url = shared_config["discprov"]["url"]
    if not node_url or not is_fqdn(node_url):
        return None
    return node_url.rstrip("/")


async def get_async_discovery_node(sp_id, sp_factory_instance):
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None, fetch_discovery_node_info, sp_id, sp_factory_instance
    )

    return result


def get_all_other_nodes() -> Tuple[List[str], List[str]]:
    """
    Get number of discovery nodes
    At each node, get the service info which includes the endpoint
    Return all a tuple of node endpoints except that of this node and all wallets
    (endpoints, wallets)
    """
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
    num_discovery_nodes = sp_factory_inst.functions.getTotalServiceTypeProviders(
        DISCOVERY_NODE_SERVICE_TYPE
    ).call()

    ids_list = list(range(1, num_discovery_nodes + 1))
    all_other_nodes = []
    all_other_wallets = []

    # fetch all discovery nodes info in parallel
    async def fetch_results():
        result = await asyncio.gather(
            *map(
                lambda sp_id: get_async_discovery_node(sp_id, sp_factory_inst), ids_list
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
