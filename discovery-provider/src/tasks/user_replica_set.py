import logging
from datetime import datetime
from sqlalchemy.orm.session import make_transient
from src import contract_addresses, eth_abi_values
from src.models import L2ContentNode
from src.tasks.users import lookup_user_record, invalidate_old_user
from src.tasks.index_network_peers import content_node_service_type, sp_factory_registry_key
from src.utils.user_event_constants import user_replica_set_manager_event_types_arr, \
        user_replica_set_manager_event_types_lookup
from src.utils.redis_cache import get_pickled_key, get_sp_id_key

logger = logging.getLogger(__name__)

def user_replica_set_state_update(
        self,
        update_task,
        session,
        user_replica_set_mgr_txs,
        block_number,
        block_timestamp,
        redis
):
    """Return int representing number of User model state changes found in transaction."""

    num_user_replica_set_changes = 0
    user_ids = set()
    if not user_replica_set_mgr_txs:
        return num_user_replica_set_changes, user_ids

    user_replica_set_manager_abi = update_task.abi_values["UserReplicaSetManager"]["abi"]
    user_contract = update_task.web3.eth.contract(
        address=contract_addresses["user_replica_set_manager"], abi=user_replica_set_manager_abi
    )

    # This stores the state of the user object along with all the events applied to it
    # before it gets committed to the db
    # Data format is {"user_id": {"user", "events": []}}
    # NOTE - events are stored only for debugging purposes and not used or persisted anywhere
    user_replica_set_events_lookup = {}

    # This stores the state of the cnode object along with all events applied
    # Data format is {"cnode_id": {"cnode_record", "events":[]}}
    cnode_events_lookup = {}

    for tx_receipt in user_replica_set_mgr_txs:
        for event_type in user_replica_set_manager_event_types_arr:
            user_events_tx = getattr(user_contract.events, event_type)().processReceipt(tx_receipt)
            for entry in user_events_tx:
                args = entry["args"]
                # Check if _userId is present
                # If user id is found in the event args, update the local lookup object
                user_id = args._userId if "_userId" in args else None
                user_ids.add(user_id)

                # Check if cnodeId is present
                # If cnode id is found in event args, update local lookup object
                cnode_id = args._cnodeId if "_cnodeId" in args else None

                # if the user id is not in the lookup object, it hasn't been initialized yet
                # first, get the user object from the db(if exists or create a new one)
                # then set the lookup object for user_id with the appropriate props
                if user_id and (user_id not in user_replica_set_events_lookup):
                    ret_user = lookup_user_record(update_task, session, entry, block_number, block_timestamp)
                    user_replica_set_events_lookup[user_id] = {"user": ret_user, "events": []}

                if cnode_id and (cnode_id not in cnode_events_lookup):
                    ret_cnode = lookup_usrm_cnode(
                        self,
                        update_task,
                        session,
                        entry,
                        block_number,
                        block_timestamp
                    )
                    cnode_events_lookup[cnode_id] = {"content_node": ret_cnode, "events": []}

                # Add or update the value of the user record for this block in user_replica_set_events_lookup,
                # ensuring that multiple events for a single user result in only 1 row insert operation
                # (even if multiple operations are present)
                if event_type == user_replica_set_manager_event_types_lookup['update_replica_set']:
                    primary = args._primary
                    secondaries = args._secondaries
                    user_record = user_replica_set_events_lookup[user_id]["user"]
                    user_record.updated_at = datetime.utcfromtimestamp(block_timestamp)
                    user_record.primary = primary
                    user_record.secondaries = secondaries

                    # Update cnode endpoint string reconstructed from sp ID
                    creator_node_endpoint_str = get_endpoint_string_from_sp_ids(
                        self,
                        update_task,
                        primary,
                        secondaries,
                        redis
                    )
                    user_record.creator_node_endpoint = creator_node_endpoint_str
                    user_replica_set_events_lookup[user_id]["user"] = user_record
                    user_replica_set_events_lookup[user_id]["events"].append(event_type)
                # Process L2 Content Node operations
                elif event_type == user_replica_set_manager_event_types_lookup['add_or_update_content_node']:
                    cnode_record = parse_usrm_cnode_record(
                        self,
                        update_task,
                        session,
                        entry,
                        cnode_events_lookup[cnode_id]["content_node"]
                    )
                    if cnode_record is not None:
                        cnode_events_lookup[cnode_id]["content_node"] = cnode_record
                        cnode_events_lookup[cnode_id]["events"].append(event_type)
            num_user_replica_set_changes += len(user_events_tx)

    # for each record in user_replica_set_events_lookup, invalidate the old record and add the new record
    # we do this after all processing has completed so the user record is atomic by block, not tx
    for user_id, value_obj in user_replica_set_events_lookup.items():
        logger.info(f"user_replica_set.py | Replica Set Processing Adding {value_obj['user']}")
        invalidate_old_user(session, user_id)
        session.add(value_obj["user"])

    for content_node_id, value_obj in cnode_events_lookup.items():
        logger.info(f"user_replica_set.py | Content Node Processing Adding {value_obj['content_node']}")
        invalidate_old_cnode_record(session, content_node_id)
        session.add(value_obj["content_node"])

    return num_user_replica_set_changes, user_ids

# Reconstruct endpoint string from primary and secondary IDs
# Note that this is BEST EFFORT and may fail, however unlikely
# In the case of failure where a given user has valid primary/secondaries but no
# endpoint string, a client must fetch the endpoint associated with ID
# Indexing CANNOT block on this endpoint string optimization.
def get_endpoint_string_from_sp_ids(
        self,
        update_task,
        primary,
        secondaries,
        redis
):
    sp_factory_inst = None
    endpoint_string = None
    primary_endpoint = None
    try:
        # Get primary cache key
        primary_cache_key = get_sp_id_key(primary)
        # Attempt to fetch from cache
        primary_info_cached = get_pickled_key(update_task.redis, primary_cache_key)
        if primary_info_cached:
            primary_endpoint = primary_info_cached[1]
            logger.info(f"user_replica_set.py | CACHE HIT FOR {primary_cache_key}, found {primary_info_cached}")

        # If cache miss, fetch from eth-contract
        if not primary_endpoint:
            logger.info(f"user_replica_set.py | CACHE MISS FOR {primary_cache_key}, found {primary_info_cached}")
            if sp_factory_inst is None:
                sp_factory_inst = get_sp_factory_inst(self, update_task)
            primary_cn_endpoint_info = sp_factory_inst.functions.getServiceEndpointInfo(
                content_node_service_type,
                primary
            ).call()
            logger.info(primary_cn_endpoint_info)
            primary_endpoint = primary_cn_endpoint_info[1]

        endpoint_string = "{}".format(primary_endpoint)
        for secondary_id in secondaries:
            secondary_endpoint = None
            secondary_cache_key = get_sp_id_key(secondary_id)
            secondary_info_cached = get_pickled_key(update_task.redis, secondary_cache_key)
            if secondary_info_cached:
                secondary_endpoint = secondary_info_cached[1]
                logger.info(f"user_replica_set.py | CACHE HIT FOR {secondary_cache_key}, found {secondary_info_cached}")

            if not secondary_endpoint:
                logger.info(
                    f"user_replica_set.py | CACHE MISS FOR {secondary_cache_key}, found {secondary_info_cached}"
                )
                if sp_factory_inst is None:
                    sp_factory_inst = get_sp_factory_inst(self, update_task)
                secondary_info = sp_factory_inst.functions.getServiceEndpointInfo(
                    content_node_service_type,
                    secondary_id
                ).call()
                secondary_endpoint = secondary_info[1]

            if secondary_endpoint:
                endpoint_string = "{},{}".format(endpoint_string, secondary_endpoint)
            else:
                logger.info(f"user_replica_set.py | Failed to find secondary info for {secondary_endpoint}")
    except Exception as exc:
        logger.error(f"user_replica_set.py | ERROR in get_endpoint_string_from_sp_ids {exc}")
    logger.info(f"user_replica_set.py | constructed {endpoint_string} from {primary},{secondaries}")
    return endpoint_string

# Return instance of ServiceProviderFactory initialized with configs
def get_sp_factory_inst(self, update_task):
    shared_config = update_task.shared_config
    eth_web3 = update_task.eth_web3
    eth_registry_address = eth_web3.toChecksumAddress(
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
    return sp_factory_inst

# Update cnode_record with event arguments
def parse_usrm_cnode_record(self, update_task, session, entry, cnode_record):
    event_args = entry["args"]
    cnode_record.delegate_owner_wallet = event_args._cnodeDelegateOwnerWallet 
    cnode_record.proposer_1_address = event_args._proposer1Address
    cnode_record.proposer_2_address = event_args._proposer2Address
    cnode_record.proposer_3_address = event_args._proposer3Address
    cnode_record.proposer_sp_ids = event_args._proposerSpIds
    return cnode_record

# Return or create instance of record pointing to this content_node
def lookup_usrm_cnode(self, update_task, session, entry, block_number, block_timestamp):
    event_blockhash = update_task.web3.toHex(entry.blockHash)
    event_args = entry["args"]

    # Arguments from the event
    cnode_id = event_args._cnodeId

    cnode_record_exists = session.query(L2ContentNode).filter_by(cnode_id=cnode_id).count() > 0
    cnode_record = None
    if cnode_record_exists:
        cnode_record = (
            session.query(L2ContentNode)
            .filter(L2ContentNode.cnode_id == cnode_id, L2ContentNode.is_current == True)
            .first()
        )
        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(cnode_record)
        make_transient(cnode_record)
    else:
        cnode_record = L2ContentNode(
            is_current=True,
            cnode_id=cnode_id,
            created_at=datetime.utcfromtimestamp(block_timestamp)
        )
    # update these fields regardless of type
    cnode_record.blockhash = event_blockhash
    return cnode_record

def invalidate_old_cnode_record(session, cnode_id):
    cnode_record_exists = session.query(L2ContentNode).filter_by(cnode_id=cnode_id).count() > 0
    if cnode_record_exists:
        num_invalidated_records = (
            session.query(L2ContentNode)
            .filter(L2ContentNode.cnode_id == cnode_id, L2ContentNode.is_current == True)
            .update({"is_current": False})
        )
        assert (
            num_invalidated_records > 0
        ), "Update operation requires a current cnode to be invalidated"
