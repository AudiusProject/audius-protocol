import logging

from src.utils import get_all_other_nodes
import os
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes
from src.utils.prometheus_metric import save_duration_metric
import requests

logger = logging.getLogger(__name__)

LOCAL_RPC = "localhost:8545"

# What is a "Peer" in this context?
# A peer represents another known entity in the network
# The logic here is to ensure a robust connection from an active indexer
# to all active entities in the network.
# This is to ensure minimal retrieval time within the actual indexing flow itself


# Query the L1 set of audius protocol contracts and retrieve a list of peer endpoints
def index_content_node_peers(self):
    cid_metadata_client = update_network_peers.cid_metadata_client
    shared_config = update_network_peers.shared_config
    eth_web3 = update_network_peers.eth_web3
    redis = update_network_peers.redis
    eth_abi_values = update_network_peers.eth_abi_values
    content_nodes = fetch_all_registered_content_nodes(
        eth_web3, shared_config, redis, eth_abi_values
    )

    content_peers = list(content_nodes)
    # Update creator node url list in CID Metadata Client
    # This list of known nodes is used to traverse and retrieve metadata from gateways
    cid_metadata_client.update_cnode_urls(content_peers)
    logger.info(f"index_network_peers.py | All known content peers {content_nodes}")

    

def index_discovery_node_peers(self):
    discovery_nodes = get_all_other_nodes()


    # get current signers
    data = '{"method":"clique_getSigners","params":[],"id":1,"jsonrpc":"2.0"}'
    response = requests.post(LOCAL_RPC, data=data)
    json = response.json()

    # propose missing signers



# ####### CELERY TASKS ####### #
@celery.task(name="update_network_peers", bind=True)
@save_duration_metric(metric_group="celery_task")
def update_network_peers(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/app.py
    redis = update_network_peers.redis
    # Define lock acquired boolean
    have_lock = False
    # Define redis lock object
    update_lock = redis.lock("network_peers_lock", timeout=7200)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            # An object returned from web3 chain queries
            index_content_node_peers(self)

            index_discovery_node_peers(self)
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
