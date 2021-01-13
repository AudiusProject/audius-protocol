import logging
from datetime import datetime
from src import contract_addresses, eth_abi_values
from src.models import L2ContentNode
from src.tasks.users import lookup_user_record, invalidate_old_user
from src.tasks.index_network_peers import content_node_service_type, sp_factory_registry_key
from src.utils.user_event_constants import user_replica_set_manager_event_types_arr, \
        user_replica_set_manager_event_types_lookup
from src.utils.redis_cache import use_redis_cache, pickle_and_set, get_pickled_key

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

    num_total_changes = 0
    user_ids = set()
    if not user_replica_set_mgr_txs:
        return num_total_changes, user_ids

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

                # Check if _newCnodeId is present
                # If cnode id is found in event args, update local lookup object
                cnode_id = args._newCnodeId if "_newCnodeId" in args else None

                # if the user id is not in the lookup object, it hasn't been initialized yet
                # first, get the user object from the db(if exists or create a new one)
                # then set the lookup object for user_id with the appropriate props
                if user_id and (user_id not in user_replica_set_events_lookup):
                    ret_user = lookup_user_record(update_task, session, entry, block_number, block_timestamp)
                    user_replica_set_events_lookup[user_id] = {"user": ret_user, "events": []}

                # def lookup_poa_cnode_record(self, update_task, session, entry, block_number, block_timestamp):
                if cnode_id and (cnode_id not in cnode_events_lookup):
                    ret_cnode = lookup_poa_cnode_record(self, update_task, session, entry, block_number, block_timestamp)
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
                elif event_type == user_replica_set_manager_event_types_lookup['add_or_update_content_node']:
                    # TODO: Handle indexing creator node fields separately
                    # PROCESSING THIS IS PENDING BELOW PR:
                    # https://github.com/AudiusProject/audius-protocol/pull/1163/files
                    # This is in order to enable bootstrap node events to be indexed outside of the constructor
                    #   without a significant modification to the indexing flow.
                    logger.error('add_or_update_content_node EVENT FOUND')
                    logger.error(f'{event_type}')
                    logger.error(args)
                    cnode_record = parse_poa_cnode_record(
                        self,
                        update_task,
                        session,
                        entry,
                        cnode_events_lookup[cnode_id]["content_node"]
                    )
                    if cnode_record is not None:
                        cnode_events_lookup[cnode_id]["content_node"] = cnode_record
                        cnode_events_lookup[cnode_id]["events"].append(event_type)
            num_total_changes += len(user_events_tx)

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

    return num_total_changes, user_ids

# TODO: Enable a cache from index_network_peers
def get_endpoint_string_from_sp_ids(
    self,
    update_task,
    primary,
    secondaries,
    redis
):
    shared_config = update_task.shared_config
    eth_web3 = update_task.eth_web3
    eth_registry_address = update_task.eth_web3.toChecksumAddress(
        shared_config["eth_contracts"]["registry"]
    )
    logger.error(f"USER REPLICA SET PY: ETH REGISTRY {eth_registry_address}")
    eth_registry_instance = eth_web3.eth.contract(
        address=eth_registry_address, abi=eth_abi_values["Registry"]["abi"]
    )
    sp_factory_address = eth_registry_instance.functions.getContract(
        sp_factory_registry_key
    ).call()
    sp_factory_inst = eth_web3.eth.contract(
        address=sp_factory_address, abi=eth_abi_values["ServiceProviderFactory"]["abi"]
    )
    primary_cn_endpoint_info = sp_factory_inst.functions.getServiceEndpointInfo(
        content_node_service_type,
        primary
    ).call()
    logger.error(primary_cn_endpoint_info)
    logger.error(f"PRIMARY CN INFO {primary_cn_endpoint_info}")
    logger.error(f"Primary ID {primary}:{primary_cn_endpoint_info[1]}")
    logger.error("END get_endpoint_string_from_sp_ids")
    logger.error(f"SECOONDARIES: {secondaries}")
    primary_endpoint = primary_cn_endpoint_info[1]

    endpoint_string = "{}".format(primary_endpoint)
    logger.error(f"ENDPOINT_STR={endpoint_string}")
    for secondary_id in secondaries:
        logger.error(f"PROCESSING SECONDARY: {secondary_id}")
        secondary_info = sp_factory_inst.functions.getServiceEndpointInfo(
            content_node_service_type,
            secondary_id
        ).call()
        secondary_endpoint = secondary_info[1]
        endpoint_string = "{},{}".format(endpoint_string, secondary_endpoint)
    return endpoint_string

def parse_poa_cnode_record(self, update_task, session, entry, cnode_record):
    event_args = entry["args"]
    delegate_owner_wallet = event_args._newCnodeDelegateOwnerWallet
    sp_ids = event_args._proposerSpIds
    proposer_1 = event_args._proposer1Address
    proposer_2 = event_args._proposer2Address
    proposer_3 = event_args._proposer3Address
    cnode_record.delegate_owner_wallet = delegate_owner_wallet
    cnode_record.proposer_1_address = proposer_1
    cnode_record.proposer_2_address = proposer_2
    cnode_record.proposer_3_address = proposer_3
    cnode_record.proposer_sp_ids = sp_ids
    return cnode_record

def lookup_poa_cnode_record(self, update_task, session, entry, block_number, block_timestamp):
    event_blockhash = update_task.web3.toHex(entry.blockHash)
    event_args = entry["args"]

    # Arguments from the event
    cnode_id = event_args._newCnodeId

    cnode_record_exists = session.query(L2ContentNode).filter_by(cnode_id=cnode_id).count() > 0
    logger.error(f"lookup_poa_cnode_record | {cnode_id} record exists={cnode_record_exists}")
    logger.error(f"{event_args}")
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
    # cnode_record.cnode_id = cnode_id
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