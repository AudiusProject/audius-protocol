import logging
from datetime import datetime
from sqlalchemy.orm.session import make_transient
from src import contract_addresses
from src.utils import helpers
from src.models import User
from src.tasks.metadata import user_metadata_format
from src.utils.user_event_constants import user_replica_set_manager_event_types_arr, user_replica_set_manager_event_types_lookup

logger = logging.getLogger(__name__)


def user_replica_set_state_update(self, update_task, session, user_replica_set_mgr_txs, block_number, block_timestamp):
    """Return int representing number of User model state changes found in transaction."""

    num_total_changes = 0
    if not user_replica_set_mgr_txs:
        return num_total_changes

    user_replica_set_manager_abi = update_task.abi_values["UserReplicaSetManager"]["abi"]
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
                elif event_type == user_replica_set_manager_event_types_lookup['add_or_update_creator_node']:
                    logger.warning(f'{event_type}')
                    logger.warning(args)

            num_total_changes += len(user_events_tx)

    # for each record in user_replica_set_events_lookup, invalidate the old record and add the new record
    # we do this after all processing has completed so the user record is atomic by block, not tx
    for user_id, value_obj in user_replica_set_events_lookup.items():
        logger.info(f"user_replica_set.py | Adding {value_obj['user']}")
        invalidate_old_user(session, user_id)
        session.add(value_obj["user"])

    return num_total_changes

def lookup_user_record(update_task, session, entry, block_number, block_timestamp):
    event_blockhash = update_task.web3.toHex(entry.blockHash)
    event_args = entry["args"]
    user_id = event_args._userId

    # Check if the userId is in the db
    user_exists = session.query(User).filter_by(user_id=event_args._userId).count() > 0

    user_record = None # will be set in this if/else
    if user_exists:
        user_record = (
            session.query(User)
            .filter(User.user_id == user_id, User.is_current == True)
            .first()
        )

        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(user_record)
        make_transient(user_record)
    else:
        user_record = User(
            is_current=True,
            user_id=user_id,
            created_at=datetime.utcfromtimestamp(block_timestamp)
        )

    # update these fields regardless of type
    user_record.blocknumber = block_number
    user_record.blockhash = event_blockhash

    return user_record


def invalidate_old_user(session, user_id):
    # Check if the userId is in the db
    user_exists = session.query(User).filter_by(user_id=user_id).count() > 0

    if user_exists:
        # Update existing record in db to is_current = False
        num_invalidated_users = (
            session.query(User)
            .filter(User.user_id == user_id, User.is_current == True)
            .update({"is_current": False})
        )
        assert (
            num_invalidated_users > 0
        ), "Update operation requires a current user to be invalidated"

