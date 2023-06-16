import logging
from typing import Dict, TypedDict

import base58
from eth_account.messages import defunct_hash_message
from nacl.encoding import HexEncoder
from nacl.signing import VerifyKey
from sqlalchemy.orm.session import Session
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
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
    USER_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.utils.config import shared_config
from src.utils.indexing_errors import EntityMissingRequiredFieldError
from src.utils.model_nullable_validator import all_required_fields_present
from web3 import Web3

logger = logging.getLogger(__name__)


def get_verifier_address():
    if "verified_address" in shared_config["contracts"]:
        return shared_config["contracts"]["verified_address"]


def validate_user_tx(params: ManageEntityParameters):
    user_id = params.user_id

    if params.entity_type != EntityType.USER:
        raise Exception(
            f"Invalid User Transaction, wrong entity type {params.entity_type}"
        )

    if params.action == Action.CREATE:
        if user_id in params.existing_records[EntityType.USER]:
            raise Exception(f"Invalid User Transaction, user {user_id} already exists")
        if user_id < USER_ID_OFFSET:
            raise Exception(
                f"Invalid User Transaction, user id {user_id} offset incorrect"
            )
    elif params.action == Action.UPDATE:
        # update / delete specific validations
        if user_id not in params.existing_records[EntityType.USER]:
            raise Exception(f"Invalid User Transaction, user {user_id} does not exist")
        wallet = params.existing_records[EntityType.USER][user_id].wallet
        if wallet and wallet.lower() != params.signer.lower():
            raise Exception(
                "Invalid User Transaction, user wallet signer does not match"
            )
    elif params.action == Action.VERIFY:
        verifier_address = get_verifier_address()
        if not verifier_address or verifier_address.lower() != params.signer.lower():
            raise Exception(
                "Invalid User Transaction, signer does not match verifier address"
            )
    else:
        raise Exception(
            f"Invalid User Transaction, action {params.action} is not valid"
        )


def validate_user_metadata(session, user_record: User, user_metadata: Dict):
    # If the user's handle is not set, validate that it is unique
    if not user_record.handle:
        handle_lower = user_metadata["handle"].lower()
        user_handle_exists = session.query(
            session.query(User).filter(User.handle_lc == handle_lower).exists()
        ).scalar()
        if user_handle_exists:
            # Invalid user handle - should not continue to save...
            raise Exception(f"User handle {user_metadata['handle']} already exists")
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
            raise Exception(
                f"Cannot set artist pick. Track {user_metadata['artist_pick_track_id']} does not exist"
            )


def create_user(params: ManageEntityParameters):
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

    if params.metadata == "v2":
        user_record.is_storage_v2 = True
    else:
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
    params.add_user_record(user_id, user_record)
    return user_record


def update_user(params: ManageEntityParameters):
    validate_user_tx(params)

    user_id = params.entity_id
    existing_user = params.existing_records[EntityType.USER][user_id]
    if (
        user_id in params.new_records[EntityType.USER]
        and params.new_records[EntityType.USER][user_id]
    ):  # override with last updated user is in this block
        existing_user = params.new_records[EntityType.USER][user_id][-1]

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

    user_record = update_user_metadata(
        params.session,
        params.redis,
        user_record,
        params.metadata,
        params.web3,
        params.challenge_bus,
    )
    user_record.metadata_multihash = params.metadata_cid
    user_record = update_legacy_user_images(user_record)
    user_record = validate_user_record(user_record)
    params.add_user_record(user_id, user_record)
    params.challenge_bus.dispatch(
        ChallengeEvent.profile_update,
        params.block_number,
        user_id,
    )

    return user_record


def update_user_metadata(
    session,
    redis,
    user_record: User,
    metadata: Dict,
    web3: Web3,
    challenge_event_bus: ChallengeEventBus,
):
    # Fields also stored on chain
    if "profile_picture" in metadata and metadata["profile_picture"]:
        user_record.profile_picture = metadata["profile_picture"]

    if "cover_photo" in metadata and metadata["cover_photo"]:
        user_record.cover_photo = metadata["cover_photo"]

    if "bio" in metadata and metadata["bio"]:
        user_record.bio = metadata["bio"]

    if "name" in metadata and metadata["name"]:
        user_record.name = metadata["name"]

    if "location" in metadata and metadata["location"]:
        user_record.location = metadata["location"]

    if "artist_pick_track_id" in metadata:
        user_record.artist_pick_track_id = metadata["artist_pick_track_id"]

    # Fields with no on-chain counterpart
    if "profile_picture_sizes" in metadata and metadata["profile_picture_sizes"]:
        user_record.profile_picture = metadata["profile_picture_sizes"]

    if "cover_photo_sizes" in metadata and metadata["cover_photo_sizes"]:
        user_record.cover_photo = metadata["cover_photo_sizes"]

    if (
        "collectibles" in metadata
        and metadata["collectibles"]
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
        )

    if "associated_sol_wallets" in metadata:
        update_user_associated_wallets(
            session,
            web3,
            redis,
            user_record,
            metadata["associated_sol_wallets"],
            "sol",
        )

    if "playlist_library" in metadata and metadata["playlist_library"]:
        user_record.playlist_library = metadata["playlist_library"]

    if "is_deactivated" in metadata:
        user_record.is_deactivated = metadata["is_deactivated"]

    if "events" in metadata and metadata["events"]:
        update_user_events(
            session,
            user_record,
            metadata["events"],
            challenge_event_bus,
        )

    if metadata.get("allow_ai_attribution"):
        user_record.allow_ai_attribution = metadata["allow_ai_attribution"]

    return user_record


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


def update_user_associated_wallets(
    session, web3, redis, user_record, associated_wallets, chain
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
                web3,
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
    wallet_address: str = web3.eth.account.recoverHash(
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
    existing_user = params.existing_records[EntityType.USER][user_id]
    user_record = copy_record(
        existing_user,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    user_record = validate_user_record(user_record)
    user_record.is_verified = True
    params.add_user_record(user_id, user_record)
    params.challenge_bus.dispatch(
        ChallengeEvent.connect_verified,
        params.block_number,
        user_id,
    )

    return user_record
