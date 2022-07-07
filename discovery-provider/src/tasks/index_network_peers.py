import logging

from src.models.users.user import User
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)


# What is a "Peer" in this context?
# A peer represents another known entity in the network
# The logic here is to ensure a robust connection from an active indexer
# to all active entities in the network.
# This is to ensure minimal retrieval time within the actual indexing flow itself
# NOTE - The terminology of "peer" in this file overlaps with ipfs swarm peers
#   Even though we 'swarm connect' to an ipfs node embedded within our protocol the
#   concept is very much distinct.


# Query the L1 set of audius protocol contracts and retrieve a list of peer endpoints
def retrieve_peers_from_eth_contracts(self):
    shared_config = update_network_peers.shared_config
    eth_web3 = update_network_peers.eth_web3
    redis = update_network_peers.redis
    eth_abi_values = update_network_peers.eth_abi_values
    return fetch_all_registered_content_nodes(
        eth_web3, shared_config, redis, eth_abi_values
    )


# ####### CELERY TASKS ####### #
@celery.task(name="update_network_peers", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_network_peers(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = update_network_peers.redis
    cid_metadata_client = update_network_peers.cid_metadata_client
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("network_peers_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            # An object returned from web3 chain queries
            peers_from_ethereum = retrieve_peers_from_eth_contracts(self)
            logger.info(
                f"index_network_peers.py | Peers from eth-contracts: {peers_from_ethereum}"
            )
            # Combine the set of known peers from ethereum and within local database
            all_peers = peers_from_ethereum

            # Legacy user metadata node is always added to set of known peers
            user_metadata_url = update_network_peers.shared_config["discprov"][
                "user_metadata_service_url"
            ]
            all_peers.add(user_metadata_url)

            logger.info(f"index_network_peers.py | All known peers {all_peers}")
            peers_list = list(all_peers)
            # Update creator node url list in CID Metadata Client
            # This list of known nodes is used to traverse and retrieve metadata from gateways
            cid_metadata_client.update_cnode_urls(peers_list)
        else:
            logger.info(
                "index_network_peers.py | Failed to acquire update_network_peers"
            )
    except Exception as e:
        logger.error("index_network_peers.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
