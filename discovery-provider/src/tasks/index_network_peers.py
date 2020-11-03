import logging
import concurrent.futures
from src.tasks.celery_app import celery
from src import eth_abi_values
from src.utils.helpers import get_ipfs_info_from_cnode_endpoint
from src.models import Block, User, Track, Repost, Follow, Playlist, Save

logger = logging.getLogger(__name__)

sp_factory_arg = bytes("ServiceProviderFactory", "utf-8")
cn_bytes_arg = bytes("creator-node", "utf-8")

# What is a "Peer" in this context?
# A peer represents another known entity in the network
# The logic here is to ensure a robust connection from an active indexer
# to all active entities in the network.
# This is to ensure minimal retrieval time within the actual indexing flow itself

# Perform eth web3 call to fetch endpoint info
def fetch_cnode_info(sp_id, sp_factory_instance):
    cn_endpoint_info = sp_factory_instance.functions.getServiceEndpointInfo(cn_bytes_arg, sp_id).call()
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
        bytes("ServiceProviderFactory", "utf-8")
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    total_cn_type_providers = sp_factory_inst.functions.getTotalServiceTypeProviders(cn_bytes_arg).call()
    ids_list = list(range(1, total_cn_type_providers + 1))
    eth_cn_endpoints = {}
    # Given the total number of nodes in the network we can now fetch node info in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        fetch_cnode_futures = {executor.submit(fetch_cnode_info, i, sp_factory_inst): i for i in ids_list}
        for future in concurrent.futures.as_completed(fetch_cnode_futures):
            single_cnode_fetch_op = fetch_cnode_futures[future]
            try:
                cn_endpoint_info = future.result()
                # 1 index entry in the returned array from ServiceProviderFactory
                eth_cn_endpoints[cn_endpoint_info[1]] = True
            except Exception as exc:
                logger.error(f"index_network_peers.py | fetch_cnode_futures {single_cnode_fetch_op} generated {exc}")
    # Return dictionary with key = endpoint, formatted as { endpoint: True }
    return eth_cn_endpoints

# Determine the known set of distinct peers currently within a user replica set
# This function differs from the above as we are not interacting with eth-contracts,
#   instead we are pulling local db state and retrieving the relevant information
def retrieve_peers_from_db(self):
    db = update_network_peers.db
    shared_config = update_network_peers.shared_config
    interval = int(shared_config["discprov"]["peer_refresh_interval"])
    cnode_endpoints = {}
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
                    cnode_endpoints[cnode_url] = True
    logger.error(f"FROM DB: {cnode_endpoints}")
    return cnode_endpoints

def connect_peers(self, peers_list):
    ipfs_client = update_network_peers.ipfs_client
    for endpoint in peers_list:
        try:
            logger.error(f'From peers list: {endpoint}')
            ipfs_swarm_address = get_ipfs_info_from_cnode_endpoint(endpoint, None)
            logger.error(f'{ipfs_swarm_address}')
            ipfs_client.connect_peer(ipfs_swarm_address)
            logger.error(f'Successfully connected')
        except Exception as exc:
            logger.error(exc)

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
            logger.error("----------")
            # An object returned from web3 chain queries
            peers_from_ethereum = retrieve_peers_from_eth_contracts(self)
            logger.error("Returned peers array1:")
            logger.error(peers_from_ethereum)
            logger.error("Generating 2nd peers array:")
            # An object returned from local database queries
            peers_from_local = retrieve_peers_from_db(self)
            logger.error("Returned peers array2:")
            logger.error(peers_from_local)
            # TODO: COMBINE THIS WITH DB PEERS AND PROCESS ALL AT ONCE
            # Ensure deduping etc
            peers_list = list(peers_from_ethereum.keys())
            connect_peers(self, peers_list)
            logger.error("----------")
        else:
            logger.info("index_network_peers.py | Failed to acquire update_network_peers")
    except Exception as e:
        logger.error("index_network_peers.py | Fatal error in main loop", exc_info=True)
        raise e
    finally:
        if have_lock:
            update_lock.release()
