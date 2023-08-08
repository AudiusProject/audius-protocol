import logging
from enum import Enum
from typing import Any, TypedDict

from redis import Redis
from web3 import Web3

from src.utils.helpers import load_eth_abi_values
from src.utils.redis_cache import (
    get_cn_sp_id_key,
    get_dn_sp_id_key,
    get_json_cached_key,
    set_json_cached_key,
)

logger = logging.getLogger(__name__)
eth_abi_values = load_eth_abi_values()


class ServiceProviderType(Enum):
    DISCOVERY = bytes("discovery-node", "utf-8")
    CONTENT = bytes("content-node", "utf-8")


class SPInfo(TypedDict):
    operator_wallet: str
    delegator_wallet: str
    endpoint: str
    block_number: int


class EthManager:
    sp_factory_registry_key = bytes("ServiceProviderFactory", "utf-8")
    sp_type = ServiceProviderType

    cnode_info_redis_ttl = 3600

    def __init__(self, eth_web3: Web3, eth_abi_values: Any, registry_address: str):
        self.eth_web3 = eth_web3
        self.eth_abi_values = eth_abi_values
        self.registry_address = registry_address

    def init_contracts(self):
        eth_registry = self.eth_web3.eth.contract(
            address=self.registry_address, abi=eth_abi_values["Registry"]["abi"]
        )

        sp_factory_address = eth_registry.functions.getContract(
            EthManager.sp_factory_registry_key
        ).call()
        sp_factory = self.eth_web3.eth.contract(
            address=sp_factory_address,
            abi=self.eth_abi_values["ServiceProviderFactory"]["abi"],
        )

        self.eth_registry = eth_registry
        self.sp_factory = sp_factory

    def fetch_node_info(
        self, sp_id: int, sp_type: ServiceProviderType, redis: Redis
    ) -> SPInfo:
        sp_id_key = (
            get_cn_sp_id_key(sp_id)
            if ServiceProviderType.CONTENT == sp_type
            else get_dn_sp_id_key(sp_id)
        )
        sp_info_cached = get_json_cached_key(redis, sp_id_key)

        if sp_info_cached:
            logger.info(
                f"eth_manager.py | Found cached value for spID={sp_id} - {sp_info_cached}"
            )
            return {
                "operator_wallet": sp_info_cached[0],
                "endpoint": sp_info_cached[1],
                "block_number": sp_info_cached[2],
                "delegator_wallet": sp_info_cached[3],
            }

        endpoint_info = self.sp_factory.functions.getServiceEndpointInfo(
            sp_type.value, sp_id
        ).call()

        set_json_cached_key(redis, sp_id_key, endpoint_info, self.cnode_info_redis_ttl)
        logger.info(
            f"eth_manager.py | Configured redis {sp_id_key} - {endpoint_info} - TTL {self.cnode_info_redis_ttl}"
        )
        sp_info: SPInfo = {
            "operator_wallet": endpoint_info[0],
            "endpoint": endpoint_info[1],
            "block_number": endpoint_info[2],
            "delegator_wallet": endpoint_info[3],
        }
        return sp_info
