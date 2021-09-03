import logging
from typing import List
from web3 import Web3, HTTPProvider
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.helpers import load_eth_abi_values

logger = logging.getLogger(__name__)

oracle_addresses_key = "oracle_addresses"

eth_abi_values = load_eth_abi_values()
REWARDS_CONTRACT_ABI = eth_abi_values["EthRewardsManager"]["abi"]


eth_web3 = Web3(HTTPProvider(shared_config["web3"]["eth_provider_url"]))  # type: ignore
eth_registry_address = eth_web3.toChecksumAddress(
    shared_config["eth_contracts"]["registry"]
)
eth_registry_instance = eth_web3.eth.contract(
    address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
)


def get_oracle_addresses_from_chain(redis) -> List[str]:
    try:
        # Note: this call will fail until the eth rewards manager contract is deployed
        eth_rewards_manager_address = eth_registry_instance.functions.getContract(
            bytes("EthRewardsManagerProxy", "utf-8")
        ).call()
        eth_rewards_manager_instance = eth_web3.eth.contract(
            address=eth_rewards_manager_address, abi=REWARDS_CONTRACT_ABI
        )
        oracle_addresses = (
            eth_rewards_manager_instance.functions.getAntiAbuseOracleAddresses().call()
        )
        redis.set(oracle_addresses_key, ",".join(oracle_addresses))
        return oracle_addresses
    except Exception as e:
        logger.error(f"index_oracles.py | Failed to get oracle addresses from chain: {e}")
        return []


@celery.task(name="index_oracles", bind=True)
def index_oracles_task(self):
    redis = index_oracles_task.redis
    have_lock = False
    update_lock = redis.lock("index_oracles_lock", timeout=60)
    try:
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            get_oracle_addresses_from_chain(redis)
        else:
            logger.info("index_oracles.py | Failed to acquire index oracles lock")
    except Exception as e:
        logger.error("index_oracles.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
