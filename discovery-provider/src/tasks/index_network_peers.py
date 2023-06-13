import logging
import os

import requests
from src.tasks.celery_app import celery
from src.utils.eth_contracts_helpers import fetch_all_registered_content_nodes
from src.utils.get_all_other_nodes import get_all_other_discovery_nodes
from src.utils.prometheus_metric import save_duration_metric

logger = logging.getLogger(__name__)

LOCAL_RPC = "http://chain:8545"
DOUBLE_CAST_ERROR_CODE = -32603
CONTENT_PEERS_REDIS_KEY = "content_peers"

# What is a "Peer" in this context?
# A peer represents another known entity in the network
# The logic here is to ensure a robust connection from an active indexer
# to all active entities in the network.
# This is to ensure minimal retrieval time within the actual indexing flow itself


# Query the L1 set of audius protocol contracts and retrieve a list of peer endpoints
def index_content_node_peers(self):
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
    redis.set(CONTENT_PEERS_REDIS_KEY, ",".join(content_peers))
    logger.info(f"index_network_peers.py | All known content peers {content_nodes}")


def clique_propose(wallet: str, vote: bool):
    propose_data = (
        '{"method":"clique_propose","params":["'
        + wallet
        + '", '
        + str(vote).lower()
        + "]}"
    )
    response = requests.post(LOCAL_RPC, data=propose_data)
    return response.json()


def index_discovery_node_peers(self):
    shared_config = update_network_peers.shared_config
    current_wallet = shared_config["delegate"]["owner_wallet"].lower()

    # the maximum signers in addition to the registered static nodes
    max_signers = int(shared_config["discprov"]["max_signers"])

    other_wallets = set(
        [wallet.lower() for wallet in get_all_other_discovery_nodes()[1]]
    )
    logger.info(
        f"index_network_peers.py | Other registered discovery addresses: {other_wallets}"
    )

    # get current signers
    get_signers_data = '{"method":"clique_getSigners","params":[]}'
    signers_response = requests.post(LOCAL_RPC, data=get_signers_data)
    signers_response_dict = signers_response.json()
    current_signers = set(
        [wallet.lower() for wallet in signers_response_dict["result"]]
    )
    logger.info(f"index_network_peers.py | Current chain signers: {current_signers}")

    # only signers can propose
    if current_wallet not in current_signers:
        return

    # propose registered nodes as signers
    current_signers.remove(current_wallet)
    add_wallets = sorted(list(other_wallets - current_signers))[:max_signers]
    for wallet in add_wallets:
        response_dict = clique_propose(wallet, True)
        if (
            "error" in response_dict
            and response_dict["error"]["code"] != DOUBLE_CAST_ERROR_CODE
        ):
            logger.error(
                f"index_network_peers.py | Failed to add signer {wallet} with error {response_dict['error']['message']}"
            )
        else:
            logger.info(f"index_network_peers.py | Proposed to add signer {wallet}")

    # remove unregistered nodes as signers
    remove_wallets = sorted(list(current_signers - other_wallets))
    for wallet in remove_wallets:
        response_dict = clique_propose(wallet, False)
        if (
            "error" in response_dict
            and response_dict["error"]["code"] != DOUBLE_CAST_ERROR_CODE
        ):
            logger.error(
                f"index_network_peers.py | Failed to remove signer {wallet} with error {response_dict['error']['message']}"
            )
        else:
            logger.info(f"index_network_peers.py | Proposed to remove signer {wallet}")


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

            if not os.getenv("audius_discprov_dev_mode"):
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
