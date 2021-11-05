import concurrent.futures
import logging
from typing import List, Tuple, Optional
from src.utils import web3_provider
from src.utils.helpers import is_fqdn, load_eth_abi_values
from src.utils.config import shared_config

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
    Get endpoint for this discovery node
    At each node, get the service info which includes the endpoint
    return node endpoint of node with matching delegate_owner_wallet
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
    logger.info(f"number of discovery nodes: {num_discovery_nodes}")

    ids_list = list(range(1, num_discovery_nodes + 1))

    endpoint: Optional[str] = None

    # fetch all discovery nodes info in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        discovery_node_futures = {
            executor.submit(fetch_discovery_node_info, i, sp_factory_inst): i
            for i in ids_list
        }
        for future in concurrent.futures.as_completed(discovery_node_futures):
            node_op = discovery_node_futures[future]
            try:
                node_info = future.result()
                wallet = node_info[3]
                if wallet == shared_config["delegate"]["owner_wallet"]:
                    endpoint = node_info[1]
                    break
            except Exception as e:
                logger.error(
                    f"get_all_other_nodes.py | ERROR in discovery_node_futures {node_op} generated {e}"
                )

    logger.info(f"this node's endpoint: {endpoint}")

    return endpoint


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
    logger.info(f"number of discovery nodes: {num_discovery_nodes}")

    ids_list = list(range(1, num_discovery_nodes + 1))
    all_other_nodes = []
    all_other_wallets = []

    # fetch all discovery nodes info in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        discovery_node_futures = {
            executor.submit(fetch_discovery_node_info, i, sp_factory_inst): i
            for i in ids_list
        }
        for future in concurrent.futures.as_completed(discovery_node_futures):
            node_op = discovery_node_futures[future]
            try:
                node_info = future.result()
                wallet = node_info[3]
                if wallet != shared_config["delegate"]["owner_wallet"]:
                    endpoint = node_info[1]
                    all_other_wallets.append(wallet)
                    if is_fqdn(endpoint):
                        all_other_nodes.append(endpoint)
            except Exception as e:
                logger.error(
                    f"index_metrics.py | ERROR in discovery_node_futures {node_op} generated {e}"
                )

    logger.info(
        f"this node's delegate owner wallet: {shared_config['delegate']['owner_wallet']}"
    )
    logger.info(f"all the other nodes: {all_other_nodes}")
    return all_other_nodes, all_other_wallets
