import concurrent.futures
import logging
from datetime import datetime
from time import time
from typing import Any, Dict, List, Set, Tuple, TypedDict

import base58
from eth_account.messages import defunct_hash_message
from nacl.encoding import HexEncoder
from nacl.signing import VerifyKey
from sqlalchemy.orm.session import Session, make_transient
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.models.users.associated_wallet import AssociatedWallet
from src.models.users.user import User
from src.models.users.user_events import UserEvent
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.queries.skipped_transactions import add_node_level_skipped_transaction
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.utils import helpers
from src.utils.indexing_errors import EntityMissingRequiredFieldError, IndexingError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.user_event_constants import user_event_types_arr, user_event_types_lookup

logger = logging.getLogger(__name__)


def user_state_update(
    self,
    update_task: DatabaseTask,
    session: Session,
    user_factory_txs,
    block_number,
    block_timestamp,
    block_hash,
    ipfs_metadata,
    blacklisted_cids,
) -> Tuple[int, Set]:
    """Return tuple containing int representing number of User model state changes found in transaction and set of processed user IDs."""
    begin_user_state_update = datetime.now()
    metric = PrometheusMetric(PrometheusMetricNames.USER_STATE_UPDATE_DURATION_SECONDS)

    blockhash = update_task.web3.toHex(block_hash)
    num_total_changes = 0
    skipped_tx_count = 0
    user_ids: Set[int] = set()
    if not user_factory_txs:
        return num_total_changes, user_ids

    challenge_bus = update_task.challenge_event_bus

    # This stores the state of the user object along with all the events applied to it
    # before it gets committed to the db
    # Data format is {"user_id": {"user", "events": []}}
    # NOTE - events are stored only for debugging purposes and not used or persisted anywhere
    user_events_lookup: Dict[int, Dict[str, Any]] = {}

    # Array of transactions by user to be applied in parallel
    # Map(user_id=1 <-> [tx1, tx2], user_id=2 <-> [tx1])
    user_transactions_lookup: Dict[int, List[Tuple]] = {}

    # For each user factory transaction, loop through every tx
    # loop through all audius event types within that tx and get all event logs
    # for each event, apply changes to the user in user_events_lookup
    for tx_receipt in user_factory_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in user_event_types_arr:
            print("raymont", event_type)
            user_events_tx = get_user_events_tx(update_task, event_type, tx_receipt)
            # if record does not get added, do not count towards num_total_changes
            for entry in user_events_tx:
                print("raymont", user_events_tx)
                user_id = helpers.get_tx_arg(entry, "_userId")
                if user_id not in user_transactions_lookup:
                    user_transactions_lookup[user_id] = []
                # Append to user level list
                print("raymont", entry, event_type)
                user_transactions_lookup[user_id].append(
                    (entry, event_type, tx_receipt, txhash)
                )

            # num_total_changes += processedEntries

    # Process each user in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        process_user_txs_futures = {}
        for user_id in user_transactions_lookup.keys():
            user_txs = user_transactions_lookup[user_id]
            process_user_txs_futures[
                executor.submit(
                    process_user_txs_serial,
                    self,
                    user_id,
                    user_txs,
                    session,
                    user_events_lookup,
                    update_task,
                    blacklisted_cids,
                    block_number,
                    block_timestamp,
                    blockhash,
                    ipfs_metadata,
                    user_ids,
                    skipped_tx_count,
                )
            ] = user_id
        for future in concurrent.futures.as_completed(process_user_txs_futures):
            try:
                processed_entries = future.result()
                num_total_changes += processed_entries
            except Exception as exc:
                raise exc
    logger.info(
        f"index.py | users.py | There are {num_total_changes} events processed and {skipped_tx_count} skipped transactions."
    )
    print("raymont after thread")

    # For each record in user_events_lookup, invalidate the old record and add the new record
    # we do this after all processing has completed so the user record is atomic by block, not tx
    for user_id, value_obj in user_events_lookup.items():
        logger.info(f"index.py | users.py | Adding {value_obj['user']}")
        if value_obj["events"]:
            invalidate_old_user(session, user_id)
            challenge_bus.dispatch(ChallengeEvent.profile_update, block_number, user_id)
            session.add(value_obj["user"])

    if num_total_changes:
        metric.save_time({"scope": "full"})
        logger.info(
            f"index.py | users.py | user_state_update | finished user_state_update in {datetime.now() - begin_user_state_update} // per event: {(datetime.now() - begin_user_state_update) / num_total_changes} secs"
        )
    return num_total_changes, user_ids


def process_user_txs_serial(
    self,
    user_id,
    user_txs,
    session,
    user_events_lookup,
    update_task,
    blacklisted_cids,
    block_number,
    block_timestamp,
    blockhash,
    ipfs_metadata,
    user_ids,
    skipped_tx_count,
):
    print("raymont process")
    metric = PrometheusMetric(PrometheusMetricNames.USER_STATE_UPDATE_DURATION_SECONDS)
    processed_entries = 0
    for user_tx in user_txs:
        try:
            process_user_txs_start_time = time()
            entry = user_tx[0]
            event_type = user_tx[1]
            tx_receipt = user_tx[2]
            txhash = user_tx[3]
            print("raymont for usertx", event_type, entry, process_user_txs_start_time)

            # look up or populate existing record
            if user_id in user_events_lookup:
                existing_user_record = user_events_lookup[user_id]["user"]
            else:
                existing_user_record = lookup_user_record(
                    update_task,
                    session,
                    entry,
                    block_number,
                    block_timestamp,
                    txhash,
                )

            # parse user event to add metadata to record
            if event_type == user_event_types_lookup["update_multihash"]:
                metadata_multihash = helpers.multihash_digest_to_cid(
                    helpers.get_tx_arg(entry, "_multihashDigest")
                )
                user_record = (
                    parse_user_event(
                        self,
                        update_task,
                        session,
                        tx_receipt,
                        block_number,
                        entry,
                        event_type,
                        existing_user_record,
                        ipfs_metadata[metadata_multihash],
                        block_timestamp,
                    )
                    if metadata_multihash not in blacklisted_cids
                    else None
                )
            else:
                print("raymont in else")
                user_record = parse_user_event(
                    self,
                    update_task,
                    session,
                    tx_receipt,
                    block_number,
                    entry,
                    event_type,
                    existing_user_record,
                    None,
                    block_timestamp,
                )
            print("raymont after user_record")
            # process user record
            if user_record is not None:
                if user_id not in user_events_lookup:
                    user_events_lookup[user_id] = {
                        "user": user_record,
                        "events": [],
                    }
                else:
                    user_events_lookup[user_id]["user"] = user_record
                user_events_lookup[user_id]["events"].append(event_type)
                user_ids.add(user_id)

            processed_entries += 1
            print("raymont processed entries")
            # metric.save_time(
            #     {"scope": "user_tx"}, start_time=process_user_txs_start_time
            # )
        except EntityMissingRequiredFieldError as e:
            print("raymont skipping")
            logger.warning(f"Skipping tx {txhash} with error {e}")
            skipped_tx_count += 1
            add_node_level_skipped_transaction(session, block_number, blockhash, txhash)
            pass
        except Exception as e:
            print("raymont error", e)
            logger.error("Error in parse user transaction")
            raise IndexingError("user", block_number, blockhash, txhash, str(e)) from e

    print("raymont after process")
    return processed_entries


def get_user_events_tx(update_task, event_type, tx_receipt):
    return getattr(update_task.user_contract.events, event_type)().processReceipt(
        tx_receipt
    )


def lookup_user_record(
    update_task, session, entry, block_number, block_timestamp, txhash
):
    event_blockhash = update_task.web3.toHex(entry.blockHash)
    user_id = helpers.get_tx_arg(entry, "_userId")

    # Check if the userId is in the db
    user_record = (
        session.query(User)
        .filter(User.user_id == user_id, User.is_current == True)
        .first()
    )

    if user_record:
        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(user_record)
        make_transient(user_record)
    else:
        user_record = User(
            is_current=True,
            user_id=user_id,
            created_at=datetime.utcfromtimestamp(block_timestamp),
        )

    # update these fields regardless of type
    user_record.blocknumber = block_number
    user_record.blockhash = event_blockhash
    user_record.txhash = txhash

    return user_record


def invalidate_old_user(session, user_id):
    # Update existing record in db to is_current = False
    session.query(User).filter(User.user_id == user_id, User.is_current == True).update(
        {"is_current": False}
    )


def parse_user_event(
    self,
    update_task: DatabaseTask,
    session: Session,
    tx_receipt,
    block_number,
    entry,
    event_type,
    user_record,
    ipfs_metadata,
    block_timestamp,
):
    print("raymont parse")
    # type specific field changes
    if event_type == user_event_types_lookup["add_user"]:
        handle_str = helpers.bytes32_to_str(helpers.get_tx_arg(entry, "_handle"))
        user_record.handle = handle_str
        user_record.handle_lc = handle_str.lower()
        user_record.wallet = helpers.get_tx_arg(entry, "_wallet").lower()
    elif event_type == user_event_types_lookup["update_multihash"]:
        metadata_multihash = helpers.multihash_digest_to_cid(
            helpers.get_tx_arg(entry, "_multihashDigest")
        )
        user_record.metadata_multihash = metadata_multihash
    elif event_type == user_event_types_lookup["update_name"]:
        user_record.name = helpers.bytes32_to_str(helpers.get_tx_arg(entry, "_name"))
    elif event_type == user_event_types_lookup["update_location"]:
        user_record.location = helpers.bytes32_to_str(
            helpers.get_tx_arg(entry, "_location")
        )
    elif event_type == user_event_types_lookup["update_bio"]:
        user_record.bio = helpers.get_tx_arg(entry, "_bio")
    elif event_type == user_event_types_lookup["update_profile_photo"]:
        profile_photo_multihash = helpers.multihash_digest_to_cid(
            helpers.get_tx_arg(entry, "_profilePhotoDigest")
        )
        is_blacklisted = is_blacklisted_ipld(session, profile_photo_multihash)
        if is_blacklisted:
            logger.info(
                f"index.py | users.py | Encountered blacklisted CID:"
                f"{profile_photo_multihash} in indexing update user profile photo"
            )
            return None
        user_record.profile_picture = profile_photo_multihash
    elif event_type == user_event_types_lookup["update_cover_photo"]:
        cover_photo_multihash = helpers.multihash_digest_to_cid(
            helpers.get_tx_arg(entry, "_coverPhotoDigest")
        )
        is_blacklisted = is_blacklisted_ipld(session, cover_photo_multihash)
        if is_blacklisted:
            logger.info(
                f"index.py | users.py | Encountered blacklisted CID:"
                f"{cover_photo_multihash} in indexing update user cover photo"
            )
            return None
        user_record.cover_photo = cover_photo_multihash
    elif event_type == user_event_types_lookup["update_is_verified"]:
        user_record.is_verified = helpers.get_tx_arg(entry, "_isVerified")
        if user_record.is_verified:
            update_task.challenge_event_bus.dispatch(
                ChallengeEvent.connect_verified,
                block_number,
                user_record.user_id,
            )

    elif event_type == user_event_types_lookup["update_creator_node_endpoint"]:
        # Ensure any user consuming the new UserReplicaSetManager contract does not process
        # legacy `creator_node_endpoint` changes
        # Reference user_replica_set.py for the updated indexing flow around this field
        replica_set_upgraded = user_replica_set_upgraded(user_record)
        logger.info(
            f"index.py | users.py | {user_record.handle} Replica set upgraded: {replica_set_upgraded}"
        )
        if not replica_set_upgraded:
            user_record.creator_node_endpoint = helpers.get_tx_arg(
                entry, "_creatorNodeEndpoint"
            )

    # New updated_at timestamp
    user_record.updated_at = datetime.utcfromtimestamp(block_timestamp)

    # If the multihash is updated, fetch the metadata (if not fetched) and update the associated wallets column
    if event_type == user_event_types_lookup["update_multihash"]:
        # Look up metadata multihash in IPFS and override with metadata fields
        if ipfs_metadata:
            # Fields also stored on chain
            if "profile_picture" in ipfs_metadata and ipfs_metadata["profile_picture"]:
                user_record.profile_picture = ipfs_metadata["profile_picture"]

            if "cover_photo" in ipfs_metadata and ipfs_metadata["cover_photo"]:
                user_record.cover_photo = ipfs_metadata["cover_photo"]

            if "bio" in ipfs_metadata and ipfs_metadata["bio"]:
                user_record.bio = ipfs_metadata["bio"]

            if "name" in ipfs_metadata and ipfs_metadata["name"]:
                user_record.name = ipfs_metadata["name"]

            if "location" in ipfs_metadata and ipfs_metadata["location"]:
                user_record.location = ipfs_metadata["location"]

            # Fields with no on-chain counterpart
            if (
                "profile_picture_sizes" in ipfs_metadata
                and ipfs_metadata["profile_picture_sizes"]
            ):
                user_record.profile_picture = ipfs_metadata["profile_picture_sizes"]

            if (
                "cover_photo_sizes" in ipfs_metadata
                and ipfs_metadata["cover_photo_sizes"]
            ):
                user_record.cover_photo = ipfs_metadata["cover_photo_sizes"]

            if (
                "collectibles" in ipfs_metadata
                and ipfs_metadata["collectibles"]
                and isinstance(ipfs_metadata["collectibles"], dict)
                and ipfs_metadata["collectibles"].items()
            ):
                user_record.has_collectibles = True
            else:
                user_record.has_collectibles = False

            if "associated_wallets" in ipfs_metadata:
                update_user_associated_wallets(
                    session,
                    update_task,
                    user_record,
                    ipfs_metadata["associated_wallets"],
                    "eth",
                )

            if "associated_sol_wallets" in ipfs_metadata:
                update_user_associated_wallets(
                    session,
                    update_task,
                    user_record,
                    ipfs_metadata["associated_sol_wallets"],
                    "sol",
                )

            if (
                "playlist_library" in ipfs_metadata
                and ipfs_metadata["playlist_library"]
            ):
                user_record.playlist_library = ipfs_metadata["playlist_library"]

            if "is_deactivated" in ipfs_metadata:
                user_record.is_deactivated = ipfs_metadata["is_deactivated"]

            if "events" in ipfs_metadata and ipfs_metadata["events"]:
                update_user_events(
                    session,
                    user_record,
                    ipfs_metadata["events"],
                    update_task.challenge_event_bus,
                )

    # All incoming profile photos intended to be a directory
    # Any write to profile_picture field is replaced by profile_picture_sizes
    if user_record.profile_picture:
        logger.info(
            f"index.py | users.py | Processing user profile_picture {user_record.profile_picture}"
        )
        user_record.profile_picture_sizes = user_record.profile_picture
        user_record.profile_picture = None

    # All incoming cover photos intended to be a directory
    # Any write to cover_photo field is replaced by cover_photo_sizes
    if user_record.cover_photo:
        logger.info(
            f"index.py | users.py | Processing user cover photo {user_record.cover_photo}"
        )
        user_record.cover_photo_sizes = user_record.cover_photo
        user_record.cover_photo = None

    print('raymont parse done')

    if not all_required_fields_present(User, user_record):
        print("raymont good error raised")
        raise EntityMissingRequiredFieldError(
            "user",
            user_record,
            f"Error parsing user {user_record} with entity missing required field(s)",
        )
    print('raymont parse done2')

    return user_record


def update_user_associated_wallets(
    session, update_task, user_record, associated_wallets, chain
):
    """Updates the user associated wallets table"""
    try:
        if not isinstance(associated_wallets, dict):
            # With malformed associated wallets, we update the associated wallets
            # to be an empty dict. This has the effect of generating new rows for the
            # already associated wallets and marking them as deleted.
            associated_wallets = {}

        prev_user_associated_wallets_response = (
            session.query(AssociatedWallet.wallet)
            .filter_by(
                user_id=user_record.user_id,
                is_current=True,
                is_delete=False,
                chain=chain,
            )
            .all()
        )

        previous_wallets = [
            wallet for [wallet] in prev_user_associated_wallets_response
        ]
        added_associated_wallets = set()

        session.query(AssociatedWallet).filter_by(
            user_id=user_record.user_id, chain=chain
        ).update({"is_current": False})

        # Verify the wallet signatures and create the user id to wallet associations
        for associated_wallet, wallet_metadata in associated_wallets.items():
            if "signature" not in wallet_metadata or not isinstance(
                wallet_metadata["signature"], str
            ):
                continue
            is_valid_signature = validate_signature(
                chain,
                update_task.web3,
                user_record.user_id,
                associated_wallet,
                wallet_metadata["signature"],
            )

            if is_valid_signature:
                # Check that the wallet doesn't already exist
                wallet_exists = (
                    session.query(AssociatedWallet)
                    .filter_by(
                        wallet=associated_wallet,
                        is_current=True,
                        is_delete=False,
                        chain=chain,
                    )
                    .count()
                    > 0
                )
                if not wallet_exists:
                    added_associated_wallets.add(associated_wallet)
                    associated_wallet_entry = AssociatedWallet(
                        user_id=user_record.user_id,
                        wallet=associated_wallet,
                        chain=chain,
                        is_current=True,
                        is_delete=False,
                        blocknumber=user_record.blocknumber,
                        blockhash=user_record.blockhash,
                    )
                    session.add(associated_wallet_entry)

        # Mark the previously associated wallets as deleted
        for previously_associated_wallet in previous_wallets:
            if previously_associated_wallet not in added_associated_wallets:
                associated_wallet_entry = AssociatedWallet(
                    user_id=user_record.user_id,
                    wallet=previously_associated_wallet,
                    chain=chain,
                    is_current=True,
                    is_delete=True,
                    blocknumber=user_record.blocknumber,
                    blockhash=user_record.blockhash,
                )
                session.add(associated_wallet_entry)

        is_updated_wallets = set(previous_wallets) != added_associated_wallets
        if is_updated_wallets:
            enqueue_immediate_balance_refresh(update_task.redis, [user_record.user_id])
    except Exception as e:
        logger.error(
            f"index.py | users.py | Fatal updating user associated wallets while indexing {e}",
            exc_info=True,
        )


def validate_signature(
    chain: str, web3, user_id: int, associated_wallet: str, signature: str
):
    if chain == "eth":
        signed_wallet = recover_user_id_hash(web3, user_id, signature)
        return signed_wallet == associated_wallet
    if chain == "sol":
        try:
            message = f"AudiusUserID:{user_id}"
            verify_key = VerifyKey(base58.b58decode(bytes(associated_wallet, "utf-8")))
            # Verify raises an error if the message is tampered w/ else returns the original msg
            verify_key.verify(str.encode(message), HexEncoder.decode(signature))
            return True
        except Exception as e:
            logger.error(
                f"index.py | users.py | Verifying SPL validation signature for user_id {user_id} {e}",
                exc_info=True,
            )
            return False
    return False


class UserEventMetadata(TypedDict, total=False):
    referrer: int
    is_mobile_user: bool


def update_user_events(
    session: Session,
    user_record: User,
    events: UserEventMetadata,
    bus: ChallengeEventBus,
) -> None:
    """Updates the user events table"""
    try:
        if not isinstance(events, dict) or not user_record.blocknumber:
            # There is something wrong with events, don't process it
            return

        # Get existing UserEvent entry
        existing_user_events = (
            session.query(UserEvent)
            .filter_by(user_id=user_record.user_id, is_current=True)
            .one_or_none()
        )
        existing_referrer = (
            existing_user_events.referrer if existing_user_events else None
        )
        existing_mobile_user = (
            existing_user_events.is_mobile_user if existing_user_events else False
        )
        user_events = UserEvent(
            user_id=user_record.user_id,
            is_current=True,
            blocknumber=user_record.blocknumber,
            blockhash=user_record.blockhash,
            referrer=existing_referrer,
            is_mobile_user=existing_mobile_user,
        )
        for event, value in events.items():
            if (
                event == "referrer"
                and isinstance(value, int)
                and user_events.referrer is None
                and user_record.user_id != value
            ):
                user_events.referrer = value
                bus.dispatch(
                    ChallengeEvent.referral_signup,
                    user_record.blocknumber,
                    value,
                    {"referred_user_id": user_record.user_id},
                )
                bus.dispatch(
                    ChallengeEvent.referred_signup,
                    user_record.blocknumber,
                    user_record.user_id,
                )
            elif (
                event == "is_mobile_user"
                and isinstance(value, bool)
                and not user_events.is_mobile_user
            ):
                user_events.is_mobile_user = value
                if value:
                    bus.dispatch(
                        ChallengeEvent.mobile_install,
                        user_record.blocknumber,
                        user_record.user_id,
                    )
        # Only add a row if there's an update
        if (
            existing_user_events is None
            or user_events.is_mobile_user != existing_mobile_user
            or user_events.referrer != existing_referrer
        ):
            # Mark existing UserEvent entries as not current
            session.query(UserEvent).filter_by(
                user_id=user_record.user_id, is_current=True
            ).update({"is_current": False})
            session.add(user_events)

    except Exception as e:
        logger.error(
            f"index.py | users.py | Fatal updating user events while indexing {e}",
            exc_info=True,
        )


def recover_user_id_hash(web3, user_id, signature):
    message_hash = defunct_hash_message(text=f"AudiusUserID:{user_id}")
    wallet_address: str = web3.eth.account.recoverHash(
        message_hash, signature=signature
    )
    return wallet_address


# Determine whether this user has identity established on the UserReplicaSetManager contract
def user_replica_set_upgraded(user_record):
    primary_replica_set_configured = (
        user_record.primary_id is not None and user_record.primary_id > 0
    )
    return primary_replica_set_configured
