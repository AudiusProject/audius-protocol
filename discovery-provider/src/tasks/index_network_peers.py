import logging
from src.tasks.celery_app import celery
from src import eth_abi_values

logger = logging.getLogger(__name__)

sp_factory_arg = bytes("ServiceProviderFactory", "utf-8")
cn_bytes_arg = bytes("creator-node", "utf-8")

# Query the L1 set of audius protocol contracts and retrieve a list of peer endpoints
def retrieve_peers_from_eth_contracts(self):
    shared_config = update_network_peers.shared_config
    eth_web3 = update_network_peers.eth_web3
    eth_registry_address = update_network_peers.eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        bytes("ServiceProviderFactory", "utf-8")
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    total_cn_type_providers = sp_factory_inst.functions.getTotalServiceTypeProviders(cn_bytes_arg).call()
    eth_cn_endpoints = {}
    for i in range(1, total_cn_type_providers + 1):
        cn_endpoint_info = sp_factory_inst.functions.getServiceEndpointInfo(cn_bytes_arg, i).call()
        eth_cn_endpoints[cn_endpoint_info[1]] = True
    logger.error(eth_cn_endpoints)

######## CELERY TASKS ########
@celery.task(name="update_network_peers", bind=True)
def update_network_peers(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    db = update_network_peers.db
    redis = update_network_peers.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("update_network_peers", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            retrieve_peers_from_eth_contracts(self)
        else:
            logger.info("index_network_peers.py | Failed to acquire update_network_peers")
    except Exception as e:
        logger.error("index_network_peers.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
