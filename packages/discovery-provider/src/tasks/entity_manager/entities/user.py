import json
import logging
import re
from typing import Dict, TypedDict, Union

import base58
from eth_account.messages import defunct_hash_message
from nacl.encoding import HexEncoder
from nacl.signing import VerifyKey

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.exceptions import IndexingValidationError
from src.models.indexing.cid_data import CIDData
from src.models.tracks.track import Track
from src.models.users.associated_wallet import AssociatedWallet
from src.models.users.user import User
from src.models.users.user_events import UserEvent
from src.queries.get_balances import enqueue_immediate_balance_refresh
from src.tasks.entity_manager.entities.user_replica_set import (
    get_endpoint_string_from_sp_ids,
    parse_sp_ids,
)
from src.tasks.entity_manager.utils import (
    CHARACTER_LIMIT_USER_BIO,
    USER_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    generate_metadata_cid_v1,
    get_metadata_type_and_format,
    parse_metadata,
    validate_signer,
)
from src.tasks.metadata import immutable_user_fields
from src.utils.config import shared_config
from src.utils.hardcoded_data import genres_lower, moods_lower, reserved_handles_lower
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present

logger = logging.getLogger(__name__)


def get_verifier_address():
    if "verified_address" in shared_config["contracts"]:
        return shared_config["contracts"]["verified_address"]


def validate_user_tx(params: ManageEntityParameters):
    user_id = params.user_id

    if params.entity_type != EntityType.USER:
        raise IndexingValidationError(
            f"Invalid User Transaction, wrong entity type {params.entity_type}"
        )

    if params.action == Action.CREATE or params.action == Action.UPDATE:
        user_bio = None
        # TODO remove this clause for non-dict params.metadata after single
        # transaction sign up is fully rolled out, as all metadata for CREATEs
        # or UPDATEs should have been deserialized into dicts at this point.
        if not isinstance(params.metadata, dict):
            try:
                user_metadata, _ = parse_metadata(
                    params.metadata, Action.UPDATE, EntityType.USER
                )
                if user_metadata:
                    user_bio = user_metadata.get("bio")
            except Exception:
                # enforce json metadata after single transaction sign up
                # dont want to raise here, only check bio IF it exists
                pass
        else:
            user_bio = params.metadata.get("bio")

        if user_bio and len(user_bio) > CHARACTER_LIMIT_USER_BIO:
            raise IndexingValidationError(
                f"User {user_id} bio exceeds character limit {CHARACTER_LIMIT_USER_BIO}"
            )

    if params.action == Action.CREATE:
        if user_id in params.existing_records["User"]:
            raise IndexingValidationError(
                f"Invalid User Transaction, user {user_id} already exists"
            )
        if user_id < USER_ID_OFFSET:
            raise IndexingValidationError(
                f"Invalid User Transaction, user id {user_id} offset incorrect"
            )
        if params.signer.lower() in params.existing_records["DeveloperApp"]:
            raise IndexingValidationError(
                f"Invalid developer app {params.signer.lower()} cannot create user"
            )

    elif params.action == Action.UPDATE:
        # update / delete specific validations
        validate_signer(params)

    elif params.action == Action.VERIFY:
        verifier_address = get_verifier_address()
        if not verifier_address or verifier_address.lower() != params.signer.lower():
            raise IndexingValidationError(
                "Invalid User Transaction, signer does not match verifier address"
            )
    else:
        raise IndexingValidationError(
            f"Invalid User Transaction, action {params.action} is not valid"
        )


def validate_user_metadata(session, user_record: User, user_metadata: Dict):
    if not isinstance(user_metadata, dict):
        raise IndexingValidationError("Invalid user metadata")
    # If the user's handle is not set, validate that it is unique
    if not user_record.handle:
        handle_lower = validate_user_handle(user_metadata["handle"])
        user_handle_exists = session.query(
            session.query(User).filter(User.handle_lc == handle_lower).exists()
        ).scalar()
        if user_handle_exists:
            # Invalid user handle - should not continue to save...
            raise IndexingValidationError(
                f"User handle {user_metadata['handle']} already exists"
            )
        user_record.handle = user_metadata["handle"]
        user_record.handle_lc = handle_lower

    # If an artist pick track id is specified, validate that it is a valid track id
    if (
        "artist_pick_track_id" in user_metadata
        and user_metadata["artist_pick_track_id"]
    ):
        track_id_exists = session.query(
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id == user_metadata["artist_pick_track_id"],
                Track.owner_id == user_record.user_id,
            )
            .exists()
        ).scalar()
        if not track_id_exists:
            # Invalid artist pick. Should not continue to save
            raise IndexingValidationError(
                f"Cannot set artist pick. Track {user_metadata['artist_pick_track_id']} does not exist"
            )


def validate_user_handle(handle: Union[str, None]):
    if not handle:
        raise IndexingValidationError("Handle is missing")
    handle = handle.lower()
    if handle != re.sub(r"[^a-z0-9_\.]", "", handle):
        raise IndexingValidationError(f"Handle {handle} contains illegal characters")
    if len(handle) > 30:
        raise IndexingValidationError(f"Handle {handle} is too long")
    if handle in reserved_handles_lower:
        raise IndexingValidationError(f"Handle {handle} is a reserved word")
    if handle in genres_lower:
        raise IndexingValidationError(f"Handle {handle} is a genre name")
    if handle in moods_lower:
        raise IndexingValidationError(f"Handle {handle} is a mood name")
    return handle


def create_user(
    params: ManageEntityParameters,
    cid_type: Dict[str, str],
    cid_metadata: Dict[str, Dict],
):
    validate_user_tx(params)

    user_id = params.user_id

    user_record = User(
        user_id=user_id,
        wallet=params.signer.lower(),
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_current=False,
    )

    user_metadata = None
    try:
        # for single tx signup
        # TODO move metadata parsing and saving after v2 upgrade
        # Override with Update User to parse metadata
        user_metadata, metadata_cid = parse_metadata(
            params.metadata, Action.UPDATE, EntityType.USER
        )
    except Exception:
        # fallback to multi tx signup if parsing fails
        pass

    # If parsing succeeds, we know this is a single tx signup
    if user_metadata is not None:
        validate_user_metadata(
            params.session,
            user_record,
            user_metadata,
        )

        user_record = update_user_metadata(user_record, user_metadata, params)
        metadata_type, _ = get_metadata_type_and_format(params.entity_type)
        cid_type[metadata_cid] = metadata_type
        cid_metadata[metadata_cid] = user_metadata
        user_record.metadata_multihash = metadata_cid

    if params.metadata == "v2":
        user_record.is_storage_v2 = True
    elif not user_metadata:  # update replica set case
        sp_ids = parse_sp_ids(params.metadata)

        # Update the user's new replica set in the model and save!
        user_record.primary_id = sp_ids[0]
        user_record.secondary_ids = sp_ids[1:]

        # Update cnode endpoint string reconstructed from sp ID
        creator_node_endpoint_str = get_endpoint_string_from_sp_ids(
            params.redis, sp_ids[0], sp_ids[1:]
        )
        user_record.creator_node_endpoint = creator_node_endpoint_str

    user_record = validate_user_record(user_record)
    params.add_record(user_id, user_record)
    return user_record


def update_user(
    params: ManageEntityParameters,
    cid_type: Dict[str, str],
    cid_metadata: Dict[str, Dict],
):
    validate_user_tx(params)

    user_id = params.user_id
    existing_user = params.existing_records["User"][user_id]
    if (
        user_id in params.new_records["User"] and params.new_records["User"][user_id]
    ):  # override with last updated user is in this block
        existing_user = params.new_records["User"][user_id][-1]

    user_record = copy_record(
        existing_user,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    validate_user_metadata(
        params.session,
        user_record,
        params.metadata,
    )

    user_record = update_user_metadata(user_record, params.metadata, params)

    updated_metadata, updated_metadata_cid = merge_metadata(
        params, user_record, cid_metadata
    )
    metadata_type, _ = get_metadata_type_and_format(params.entity_type)
    cid_type[updated_metadata_cid] = metadata_type
    cid_metadata[updated_metadata_cid] = updated_metadata
    user_record.metadata_multihash = updated_metadata_cid

    user_record = update_legacy_user_images(user_record)
    user_record = validate_user_record(user_record)
    params.add_record(user_id, user_record)
    params.challenge_bus.dispatch(
        ChallengeEvent.profile_update,
        params.block_number,
        user_id,
    )

    return user_record


def update_user_metadata(user_record: User, metadata: Dict, params):
    session = params.session
    redis = params.redis
    web3 = params.web3
    challenge_event_bus = params.challenge_bus
    # Iterate over the user_record keys
    user_record_attributes = user_record.get_attributes_dict()
    for key, _ in user_record_attributes.items():
        # Update the user_record when the corresponding field exists
        # in metadata
        if key in metadata:
            if key in immutable_user_fields:
                continue
            setattr(user_record, key, metadata[key])

    if "collectibles" in metadata:
        if (
            metadata["collectibles"]
            and isinstance(metadata["collectibles"], dict)
            and metadata["collectibles"].items()
        ):
            user_record.has_collectibles = True
        else:
            user_record.has_collectibles = False

    if "associated_wallets" in metadata:
        update_user_associated_wallets(
            session,
            web3,
            redis,
            user_record,
            metadata["associated_wallets"],
            "eth",
            params,
        )

    if "associated_sol_wallets" in metadata:
        update_user_associated_wallets(
            session,
            web3,
            redis,
            user_record,
            metadata["associated_sol_wallets"],
            "sol",
            params,
        )
    if "events" in metadata and metadata["events"]:
        update_user_events(user_record, metadata["events"], challenge_event_bus, params)

    return user_record


# get previous CIDData and merge new metadata into it
# this is to support fields (collectibles, associated_wallets) which aren't being indexed yet
# once those are indexed and backfilled this can be removed
def merge_metadata(
    params: ManageEntityParameters, record: User, cid_metadata: Dict[str, Dict]
):
    cid = record.metadata_multihash

    # Check for previous metadata in cid_metadata in case multiple tx are in the same block
    if cid in cid_metadata:
        prev_cid_metadata = cid_metadata[cid]
    else:
        prev_cid_data_record = (
            params.session.query(CIDData)
            .filter_by(
                cid=record.metadata_multihash,
            )
            .first()
        )
        prev_cid_metadata = (
            dict(prev_cid_data_record.data) if prev_cid_data_record else {}
        )
    # merge previous and current metadata
    updated_metadata = prev_cid_metadata | params.metadata

    # generate a cid
    updated_metadata_cid = str(generate_metadata_cid_v1(json.dumps(updated_metadata)))

    return updated_metadata, updated_metadata_cid


class UserEventMetadata(TypedDict, total=False):
    referrer: int
    is_mobile_user: bool


def update_user_events(
    user_record: User, events: UserEventMetadata, bus: ChallengeEventBus, params
) -> None:
    """Updates the user events table"""
    try:
        if not isinstance(events, dict) or not user_record.blocknumber:
            # There is something wrong with events, don't process it
            return
        # Get existing UserEvent entry
        existing_user_events: UserEvent | None = None
        if (
            EntityType.USER_EVENT in params.existing_records
            and user_record.user_id in params.existing_records[EntityType.USER_EVENT]
        ):
            existing_user_events = params.existing_records[EntityType.USER_EVENT][
                user_record.user_id
            ]

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
            params.add_record(user_record.user_id, user_events, EntityType.USER_EVENT)

    except Exception as e:
        logger.error(
            f"index.py | users.py | Fatal updating user events while indexing {e}",
            exc_info=True,
        )
        raise e


def update_user_associated_wallets(
    session, web3, redis, user_record, associated_wallets, chain, params
):
    """Updates the user associated wallets table"""
    try:
        if not isinstance(associated_wallets, dict):
            # With malformed associated wallets, we update the associated wallets
            # to be an empty dict. This has the effect of generating new rows for the
            # already associated wallets and marking them as deleted.
            associated_wallets = {}
        previous_wallets = []
        for _, wallet in params.existing_records[EntityType.ASSOCIATED_WALLET].items():
            if wallet.chain == chain and wallet.user_id == user_record.user_id:
                previous_wallets.append(wallet)

        # Verify the wallet signatures and create the user id to wallet associations
        added_wallets = []
        for associated_wallet, wallet_metadata in associated_wallets.items():
            if "signature" not in wallet_metadata or not isinstance(
                wallet_metadata["signature"], str
            ):
                continue
            is_valid_signature = validate_signature(
                chain,
                web3,
                user_record.user_id,
                associated_wallet,
                wallet_metadata["signature"],
            )

            if is_valid_signature:
                # Check that the wallet doesn't already exist
                associated_wallet_entry = AssociatedWallet(
                    user_id=user_record.user_id,
                    wallet=associated_wallet,
                    chain=chain,
                    is_current=True,
                    is_delete=False,
                    blocknumber=user_record.blocknumber,
                    blockhash=user_record.blockhash,
                )
                added_wallets.append(associated_wallet_entry)
        is_updated_wallets = set(
            [prev_wallet.wallet for prev_wallet in previous_wallets]
        ) != set([wallet.wallet for wallet in added_wallets])

        if is_updated_wallets:
            for wallet in added_wallets:
                session.add(wallet)
            for previous_wallet in previous_wallets:
                session.delete(previous_wallet)

            enqueue_immediate_balance_refresh(redis, [user_record.user_id])
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


def recover_user_id_hash(web3, user_id, signature):
    message_hash = defunct_hash_message(text=f"AudiusUserID:{user_id}")
    wallet_address: str = web3.eth.account._recover_hash(
        message_hash, signature=signature
    )
    return wallet_address


def update_legacy_user_images(user_record):
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

    return user_record


def validate_user_record(user_record):
    if not all_required_fields_present(User, user_record):
        raise EntityMissingRequiredFieldError(
            "user",
            user_record,
            f"Error parsing user {user_record} with entity missing required field(s)",
        )

    return user_record


def verify_user(params: ManageEntityParameters):
    validate_user_tx(params)

    user_id = params.user_id
    existing_user = params.existing_records["User"][user_id]
    user_record = copy_record(
        existing_user,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    user_record = validate_user_record(user_record)
    user_record.is_verified = True
    params.add_record(user_id, user_record)
    params.challenge_bus.dispatch(
        ChallengeEvent.connect_verified,
        params.block_number,
        user_id,
    )

    return user_record
