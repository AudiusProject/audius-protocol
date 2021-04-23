import logging
import concurrent.futures
from src.tasks.celery_app import celery
from src.app import eth_abi_values
from src.utils.helpers import get_ipfs_info_from_cnode_endpoint, is_fqdn
from src.models import User
from src.utils.redis_cache import pickle_and_set, get_sp_id_key, get_pickled_key

logger = logging.getLogger(__name__)

sp_factory_registry_key = bytes("ServiceProviderFactory", "utf-8")
content_node_service_type = bytes("content-node", "utf-8")

cnode_info_redis_ttl = 1800

# What is a "Peer" in this context?
# A peer represents another known entity in the network
# The logic here is to ensure a robust connection from an active indexer
# to all active entities in the network.
# This is to ensure minimal retrieval time within the actual indexing flow itself
# NOTE - The terminology of "peer" in this file overlaps with ipfs swarm peers
#   Even though we 'swarm connect' to an ipfs node embedded within our protocol the
#   concept is very much distinct.

# Perform eth web3 call to fetch endpoint info
def fetch_cnode_info(sp_id, sp_factory_instance):
    redis = update_network_peers.redis
    sp_id_key = get_sp_id_key(sp_id)
    sp_info_cached = get_pickled_key(redis, sp_id_key)
    if sp_info_cached:
        logger.info(f"index_network_peers.py | Found cached value for spID={sp_id} - {sp_info_cached}")
        return sp_info_cached

    cn_endpoint_info = sp_factory_instance.functions.getServiceEndpointInfo(
        content_node_service_type,
        sp_id
    ).call()
    pickle_and_set(redis, sp_id_key, cn_endpoint_info, cnode_info_redis_ttl)
    logger.info(
        f"index_network_peers.py | Configured redis {sp_id_key} - {cn_endpoint_info} - TTL {cnode_info_redis_ttl}"
    )
    return cn_endpoint_info

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
        sp_factory_registry_key
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    total_cn_type_providers = sp_factory_inst.functions.getTotalServiceTypeProviders(content_node_service_type).call()
    ids_list = list(range(1, total_cn_type_providers + 1))
    eth_cn_endpoints_set = set()
    # Given the total number of nodes in the network we can now fetch node info in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        fetch_cnode_futures = {executor.submit(fetch_cnode_info, i, sp_factory_inst): i for i in ids_list}
        for future in concurrent.futures.as_completed(fetch_cnode_futures):
            single_cnode_fetch_op = fetch_cnode_futures[future]
            try:
                cn_endpoint_info = future.result()
               # Validate the endpoint on chain
                # As endpoints get deregistered, this peering system must not slow down with failed connections
                #   or unanticipated load
                eth_sp_endpoint = cn_endpoint_info[1]
                valid_endpoint = is_fqdn(eth_sp_endpoint)
                # Only valid FQDN strings are worth validating
                if valid_endpoint:
                    eth_cn_endpoints_set.add(cn_endpoint_info[1])
            except Exception as exc:
                logger.error(
                    f"index_network_peers.py | ERROR in fetch_cnode_futures {single_cnode_fetch_op} generated {exc}"
                )
    # Return dictionary with key = endpoint, formatted as { endpoint: True }
    return eth_cn_endpoints_set

# Determine the known set of distinct peers currently within a user replica set
# This function differs from the above as we are not interacting with eth-contracts,
#   instead we are pulling local db state and retrieving the relevant information
def retrieve_peers_from_db(self):
    db = update_network_peers.db
    cnode_endpoints_set = set()
    with db.scoped_session() as session:
        db_cnode_endpts = (
            session.query(
                User.creator_node_endpoint).filter(
                    User.creator_node_endpoint != None, User.is_current == True
                ).distinct()
        )
        # Generate dictionary of unique creator node endpoints
        for entry in db_cnode_endpts:
            for cnode_user_set in entry:
                cnode_entries = cnode_user_set.split(',')
                for cnode_url in cnode_entries:
                    if cnode_url == "''":
                        continue
                    cnode_endpoints_set.add(cnode_url)
    return cnode_endpoints_set

# Function submitted to future in threadpool executor
def connect_peer(endpoint, ipfs_client):
    logger.info(f"index_network_peers.py | Peering with {endpoint}")
    ipfs_swarm_address = get_ipfs_info_from_cnode_endpoint(endpoint, None)
    ipfs_client.connect_peer(ipfs_swarm_address)
    logger.info(f"index_network_peers.py | Successfully peered with {endpoint}")

# Actively connect to all peers in parallel
def connect_peers(self, peers_list):
    ipfs_client = update_network_peers.ipfs_client
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_connect_peer_request = {
            executor.submit(connect_peer, endpoint, ipfs_client): endpoint for endpoint in peers_list
        }
        for future in concurrent.futures.as_completed(future_to_connect_peer_request):
            try:
                # No return value expected here so we just ensure all futures are resolved
                future.result()
            except Exception as exc:
                logger.error(exc)

######## CELERY TASKS ########
@celery.task(name="update_network_peers", bind=True)
def update_network_peers(self):
    # Cache custom task class properties
    # Details regarding custom task context can be found in wiki
    # Custom Task definition can be found in src/__init__.py
    redis = update_network_peers.redis
    ipfs_client = update_network_peers.ipfs_client
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
            logger.info(f"index_network_peers.py | Peers from eth-contracts: {peers_from_ethereum}")
            # An object returned from local database queries
            peers_from_local = retrieve_peers_from_db(self)
            logger.info(f"index_network_peers.py | Peers from db : {peers_from_local}")
            # Combine the set of known peers from ethereum and within local database
            all_peers = peers_from_ethereum
            all_peers.update(peers_from_local)

            # Legacy user metadata node is always added to set of known peers
            user_metadata_url = update_network_peers.shared_config["discprov"]["user_metadata_service_url"]
            all_peers.add(user_metadata_url)

            logger.info(f"index_network_peers.py | All known peers {all_peers}")
            peers_list = list(all_peers)
            # Update creator node url list in IPFS Client
            # This list of known nodes is used to traverse and retrieve metadata from gateways
            ipfs_client.update_cnode_urls(peers_list)
            # Connect to all peers
            connect_peers(self, peers_list)
        else:
            logger.info("index_network_peers.py | Failed to acquire update_network_peers")
    except Exception as e:
        logger.error("index_network_peers.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
