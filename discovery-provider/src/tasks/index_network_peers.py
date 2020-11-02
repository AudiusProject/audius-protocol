import logging
from src.tasks.celery_app import celery
from src import eth_abi_values

logger = logging.getLogger(__name__)

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
            logger.error("\n\n")
            logger.error("HERE I AM!!!!")
            shared_config = update_network_peers.shared_config
            eth_web3 = update_network_peers.eth_web3
            eth_registry_address = update_network_peers.eth_web3.toChecksumAddress(
                shared_config["eth_contracts"]["registry"]
            )
            logger.error(f"ETH REG 2 - {eth_registry_address}")
            eth_registry_instance = eth_web3.eth.contract(
                address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
            )
            logger.error("WE MADE ETH REGISTRY!")
            sp_factory_arg = bytes("ServiceProviderFactory", "utf-8")
            logger.error('bytes sp arg')
            logger.error(sp_factory_arg)
            logger.error(eth_abi_values)


            logger.error("\n\n")
            sp_factory_address = eth_registry_instance.functions.getContract(
                bytes("ServiceProviderFactory", "utf-8")
            ).call()
            logger.error(f"sp factory address: {sp_factory_address}")
            logger.error("\n\n")
        else:
            logger.info("index_materialized_views.py | Failed to acquire update_network_peers")
    except Exception as e:
        logger.error("index_materialized_views.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
