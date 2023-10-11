import logging

from web3 import Web3

logger = logging.getLogger(__name__)

sp_factory_registry_key = bytes("ServiceProviderFactory", "utf-8")
trusted_notifier_manager_registry_key = bytes("TrustedNotifierManagerProxy", "utf-8")
content_node_service_type = bytes("content-node", "utf-8")

cnode_info_redis_ttl_s = 3600


def fetch_trusted_notifier_info(eth_web3, shared_config, eth_abi_values) -> dict:
    trusted_notifier_id = int(shared_config["eth_contracts"]["trusted_notifier_id"])
    if trusted_notifier_id == 0:
        logger.warn("eth_contracts_helpers.py | trusted notifier id not set")
        return {}

    eth_registry_address = Web3.to_checksum_address(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )
    tn_manager_address = eth_registry_instance.functions.getContract(
        trusted_notifier_manager_registry_key
    ).call()
    tn_manager_instance = eth_web3.eth.contract(
        address=tn_manager_address, abi=eth_abi_values["TrustedNotifierManager"]["abi"]
    )
    trusted_notifier_info = tn_manager_instance.functions.getNotifierForID(
        trusted_notifier_id
    ).call()
    wallet, endpoint, email = trusted_notifier_info
    logger.info(
        f"eth_contracts_helpers.py | got trusted notifier from chain. endpoint: {endpoint}, wallet: {wallet}"
    )
    return {"wallet": wallet, "endpoint": endpoint, "email": email}
