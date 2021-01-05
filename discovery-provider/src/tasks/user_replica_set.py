import logging
from datetime import datetime
from src import contract_addresses
from src.tasks.users import lookup_user_record, invalidate_old_user
from src.utils.user_event_constants import user_replica_set_manager_event_types_arr, \
        user_replica_set_manager_event_types_lookup

logger = logging.getLogger(__name__)

def user_replica_set_state_update(self, update_task, session, user_replica_set_mgr_txs, block_number, block_timestamp):
    """Return int representing number of User model state changes found in transaction."""

    num_total_changes = 0
    if not user_replica_set_mgr_txs:
        return num_total_changes

    user_replica_set_manager_abi = update_task.abi_values["UserReplicaSetManager"]["abi"]
    logger.error(f"USER REPLICA SET ABI")
    logger.error(user_replica_set_manager_abi)
    user_contract = update_task.web3.eth.contract(
        address=contract_addresses["user_replica_set_manager"], abi=user_replica_set_manager_abi
    )

    # This stores the state of the user object along with all the events applied to it
    # before it gets committed to the db
    # Data format is {"user_id": {"user", "events": []}}
    # NOTE - events are stored only for debugging purposes and not used or persisted anywhere
    user_replica_set_events_lookup = {}

    for tx_receipt in user_replica_set_mgr_txs:
        for event_type in user_replica_set_manager_event_types_arr:
            user_events_tx = getattr(user_contract.events, event_type)().processReceipt(tx_receipt)
            for entry in user_events_tx:
                args = entry["args"]
                # Check if _userId is present
                # If user id is found in the event args, update the local lookup object
                user_id = args._userId if "_userId" in args else None
                # if the user id is not in the lookup object, it hasn't been initialized yet
                # first, get the user object from the db(if exists or create a new one)
                # then set the lookup object for user_id with the appropriate props
                if user_id and (user_id not in user_replica_set_events_lookup):
                    ret_user = lookup_user_record(update_task, session, entry, block_number, block_timestamp)
                    user_replica_set_events_lookup[user_id] = {"user": ret_user, "events": []}

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

                    user_replica_set_events_lookup[user_id]["user"] = user_record
                elif event_type == user_replica_set_manager_event_types_lookup['add_or_update_content_node']:
                    # TODO: Handle indexing creator node fields separately
                    # PROCESSING THIS IS PENDING BELOW PR:
                    # https://github.com/AudiusProject/audius-protocol/pull/1163/files
                    # This is in order to enable bootstrap node events to be indexed outside of the constructor
                    #   without a significant modification to the indexing flow.
                    logger.error('add_or_update_content_node EVENT FOUND')
                    logger.error(f'{event_type}')
                    logger.error(args)
            num_total_changes += len(user_events_tx)

    # for each record in user_replica_set_events_lookup, invalidate the old record and add the new record
    # we do this after all processing has completed so the user record is atomic by block, not tx
    for user_id, value_obj in user_replica_set_events_lookup.items():
        logger.info(f"user_replica_set.py | Adding {value_obj['user']}")
        invalidate_old_user(session, user_id)
        session.add(value_obj["user"])

    return num_total_changes
