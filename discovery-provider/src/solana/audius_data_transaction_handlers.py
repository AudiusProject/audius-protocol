import logging
from datetime import datetime
from typing import Any, Dict, List, TypedDict

from sqlalchemy.orm.session import Session
from src.models.tracks.track import Track
from src.models.users.user import User
from src.solana.anchor_parser import ParsedTxInstr
from src.solana.solana_transaction_types import TransactionInfoResult
from src.utils import helpers
from web3 import Web3

logger = logging.getLogger(__name__)

# Alias Types
Pubkey = str


class ParsedTxMetadata(TypedDict):
    instructions: List[ParsedTxInstr]


class ParsedTx(TypedDict):
    tx_sig: str
    tx_metadata: ParsedTxMetadata
    result: TransactionInfoResult


class InitAdminData(TypedDict):
    authority: Pubkey
    verifier: Pubkey


def handle_init_admin(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


class UpdateAdminData(TypedDict):
    is_write_enabled: bool


def handle_update_admin(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


class InitUserData(TypedDict):
    base: Pubkey
    eth_address: List[int]
    replica_set: List[int]
    _replica_set_bumps: List[int]
    handle_seed: int
    _user_bump: int
    _metadata: str


def clone_model(model, **kwargs):
    """Clone an arbitrary sqlalchemy model object without its primary key values."""
    # Ensure the model’s data is loaded before copying.
    table = model.__table__
    non_pk_columns = [
        k for k in table.columns.keys() if k not in table.primary_key.columns.keys()
    ]
    data = {c: getattr(model, c) for c in non_pk_columns}
    data.update(kwargs)

    clone = model.__class__(**data)
    return clone


def handle_init_user(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    # NOTE: Not sure if we should update the user's model until they claim account
    # existing_user = db_models.get("users", {}).get(user_id)
    # user = User(**existing_user.asdict())
    # user.slot = transaction["result"]["slot"]

    # replica_set = list(instruction.get("data").get("replica_set"))
    # user.primary_id = replica_set[0]
    # user.secondary_ids = [replica_set[1], replica_set[2]]

    instruction_data = instruction.get("data")
    user_id = instruction_data.get("user_id")
    slot = transaction["result"]["slot"]
    txhash = transaction["tx_sig"]
    user_storage_account = str(instruction.get("account_names_map").get("user"))

    # Fetch latest entry for this user in db_models
    user_record = db_models["users"].get(user_id)[-1]

    # Clone new record
    new_user_record = clone_model(user_record)

    for prior_record in db_models["users"][user_id]:
        prior_record.is_current = False

    new_user_record.user_storage_account = user_storage_account
    new_user_record.txhash = txhash
    new_user_record.slot = slot
    new_user_record.is_current = True
    new_user_record.user_id = user_id

    # Append record to save
    records.append(new_user_record)

    # Append most recent record
    db_models["users"][user_id].append(new_user_record)


def handle_init_user_sol(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    slot = transaction["result"]["slot"]
    txhash = transaction["tx_sig"]
    user_id = instruction["user_id"]
    instruction_data = instruction.get("data")

    user_record = db_models["users"].get(user_id)[-1]
    user_authority = instruction_data.get("user_authority")

    # Clone new record
    new_user_record = clone_model(user_record)

    for prior_record in db_models["users"][user_id]:
        prior_record.is_current = False

    new_user_record.user_authority_account = str(user_authority)
    new_user_record.txhash = txhash
    new_user_record.slot = slot
    new_user_record.is_current = True
    new_user_record.user_id = user_id

    # Append record to save
    records.append(new_user_record)

    # Append most recent record
    db_models["users"][user_id].append(new_user_record)


class CreateUserData(TypedDict):
    base: Pubkey
    eth_address: List[int]
    replica_set: List[int]
    replica_set_bumps: List[int]
    user_id: int
    user_bump: int
    metadata: str
    user_authority: Pubkey


def handle_create_user(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    instruction_data: CreateUserData = instruction["data"]
    # Validate that the user row doesn't already exist - error if it does
    user_id = instruction_data["user_id"]
    # TODO: validate uniqueness on handle
    replica_set = list(instruction_data["replica_set"])

    eth_address = Web3.toChecksumAddress(
        f"0x{bytes(list(instruction_data['eth_address'])).hex()}"
    )
    metadata_multihash = instruction_data.get("metadata")

    user = User(
        blockhash=None,
        blocknumber=None,
        slot=transaction["result"]["slot"],
        user_storage_account=str(instruction.get("account_names_map").get("user")),
        user_authority_account=str(instruction_data.get("user_authority")),
        txhash=transaction["tx_sig"],
        user_id=user_id,
        is_current=True,
        wallet=eth_address,
        metadata_multihash=metadata_multihash,
        primary_id=replica_set[0],
        secondary_ids=[replica_set[1], replica_set[2]],
        created_at=datetime.utcfromtimestamp(transaction["result"]["blockTime"]),
        updated_at=datetime.utcfromtimestamp(transaction["result"]["blockTime"]),
    )

    user_metadata = metadata_dictionary.get(instruction_data["metadata"], {})
    update_user_model_metadata(session, user, user_metadata)
    records.append(user)
    db_models["users"][user_id].append(user)


def handle_update_user(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_update_is_verified(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


class ManageEntityData(TypedDict):
    management_action: Any
    entity_type: Any
    id: int
    metadata: str
    user_id_seed_bump: Any


def handle_manage_entity(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    # create track
    instruction_data: ManageEntityData = instruction["data"]
    management_action = instruction_data["management_action"]
    entity_type = instruction_data["entity_type"]
    slot = transaction["result"]["slot"]
    txhash = transaction["tx_sig"]
    track_id = instruction_data["id"]

    if isinstance(management_action, management_action.Create) and isinstance(
        entity_type, entity_type.Track
    ):

        if track_id in db_models["tracks"]:
            logger.info(f"Skipping create track {track_id} because it already exists.")
            return

        track = Track(
            slot=transaction["result"]["slot"],
            txhash=transaction["tx_sig"],
            track_id=instruction_data["id"],
            owner_id=instruction_data["user_id_seed_bump"].user_id,
            metadata_multihash=instruction_data.get("metadata"),
            is_current=True,
            is_delete=False,
            created_at=datetime.utcfromtimestamp(transaction["result"]["blockTime"]),
            updated_at=datetime.utcfromtimestamp(transaction["result"]["blockTime"]),
        )
        track_metadata = metadata_dictionary.get(instruction_data["metadata"], {})
        update_track_model_metadata(session, track, track_metadata)
        # TODO update stems, remixes, challenge
        records.append(track)
        db_models["tracks"][track_id].append(track)
    elif isinstance(management_action, management_action.Update) and isinstance(
        entity_type, entity_type.Track
    ):
        if track_id not in db_models["tracks"]:
            logger.info(f"Skipping update track {track_id} because it doesn't exist.")
            return
        track_record = db_models["tracks"].get(track_id)[-1]

        # Clone new record
        new_track_record = clone_model(track_record)

        for prior_record in db_models["tracks"][track_id]:
            prior_record.is_current = False
        new_track_record.track_id = track_id
        new_track_record.txhash = txhash
        new_track_record.slot = slot
        new_track_record.is_current = True
        new_track_record.metadata_multihash = instruction_data["metadata"]
        track_metadata = metadata_dictionary.get(instruction_data["metadata"], {})
        update_track_model_metadata(session, new_track_record, track_metadata)

        # Append record to save
        records.append(new_track_record)

        # Append most recent record
        db_models["tracks"][track_id].append(new_track_record)


def handle_create_content_node(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_public_create_or_update_content_node(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_public_delete_content_node(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_update_user_replica_set(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_write_entity_social_action(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_follow_user(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_init_authority_delegation_status(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_revoke_authority_delegation(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_add_user_authority_delegate(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


def handle_remove_user_authority_delegate(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


# Metadata updater
def update_user_model_metadata(
    session: Session, user_record: User, metadata_dict: Dict
):
    if "profile_picture" in metadata_dict and metadata_dict["profile_picture"]:
        user_record.profile_picture = metadata_dict["profile_picture"]

    if (
        "profile_picture_sizes" in metadata_dict
        and metadata_dict["profile_picture_sizes"]
    ):
        user_record.profile_picture = metadata_dict["profile_picture_sizes"]

    if "cover_photo" in metadata_dict and metadata_dict["cover_photo"]:
        user_record.cover_photo = metadata_dict["cover_photo"]

    if "cover_photo_sizes" in metadata_dict:
        user_record.cover_photo = metadata_dict["cover_photo_sizes"]

    if "bio" in metadata_dict and metadata_dict["bio"]:
        user_record.bio = metadata_dict["bio"]

    if "name" in metadata_dict and metadata_dict["name"]:
        user_record.name = metadata_dict["name"]

    if "location" in metadata_dict and metadata_dict["location"]:
        user_record.location = metadata_dict["location"]

    # Fields with no on-chain counterpart
    if (
        "profile_picture_sizes" in metadata_dict
        and metadata_dict["profile_picture_sizes"]
    ):
        user_record.profile_picture = metadata_dict["profile_picture_sizes"]

    if (
        "collectibles" in metadata_dict
        and metadata_dict["collectibles"]
        and isinstance(metadata_dict["collectibles"], dict)
        and metadata_dict["collectibles"].items()
    ):
        user_record.has_collectibles = True
    else:
        user_record.has_collectibles = False

    # TODO: implement
    # if "associated_wallets" in metadata_dict:
    #     update_user_associated_wallets(
    #         session: Session,
    #         update_task,
    #         user_record,
    #         metadata_dict["associated_wallets"],
    #         "eth",
    #     )

    # TODO: implement
    # if "associated_sol_wallets" in metadata_dict:
    #     update_user_associated_wallets(
    #         session: Session,
    #         update_task,
    #         user_record,
    #         metadata_dict["associated_sol_wallets"],
    #         "sol",
    #     )

    if "playlist_library" in metadata_dict and metadata_dict["playlist_library"]:
        user_record.playlist_library = metadata_dict["playlist_library"]

    if "is_deactivated" in metadata_dict:
        user_record.is_deactivated = metadata_dict["is_deactivated"]

    # TODO: implement
    # if "events" in metadata_dict and metadata_dict["events"]:
    #     update_user_events(
    #         session: Session,
    #         user_record,
    #         metadata_dict["events"],
    #         update_task.challenge_event_bus,
    #     )

    # reconstructed endpoints from sp IDs in tx not /ipfs response
    if "creator_node_endpoint" in metadata_dict:
        user_record.creator_node_endpoint = metadata_dict["creator_node_endpoint"]


def update_track_model_metadata(
    session: Session, track_record: Track, track_metadata: Dict
):
    track_record.title = track_metadata["title"]
    track_record.length = track_metadata["length"] or 0
    track_record.cover_art_sizes = track_metadata["cover_art_sizes"]
    if track_metadata["cover_art"]:
        track_record.cover_art_sizes = track_record.cover_art
        # TODO check if blacklisted?

    track_record.tags = track_metadata["tags"]
    track_record.genre = track_metadata["genre"]
    track_record.mood = track_metadata["mood"]
    track_record.credits_splits = track_metadata["credits_splits"]
    track_record.create_date = track_metadata["create_date"]
    track_record.release_date = track_metadata["release_date"]
    track_record.file_type = track_metadata["file_type"]
    track_record.description = track_metadata["description"]
    track_record.license = track_metadata["license"]
    track_record.isrc = track_metadata["isrc"]
    track_record.iswc = track_metadata["iswc"]
    track_record.track_segments = track_metadata["track_segments"]
    track_record.is_unlisted = track_metadata["is_unlisted"]
    track_record.field_visibility = track_metadata["field_visibility"]

    if is_valid_json_field(track_metadata, "stem_of"):
        track_record.stem_of = track_metadata["stem_of"]

    if is_valid_json_field(track_metadata, "remix_of"):
        track_record.remix_of = track_metadata["remix_of"]

    if "download" in track_metadata:
        track_record.download = {
            "is_downloadable": track_metadata["download"].get("is_downloadable")
            == True,
            "requires_follow": track_metadata["download"].get("requires_follow")
            == True,
            "cid": track_metadata["download"].get("cid", None),
        }
    else:
        track_record.download = {
            "is_downloadable": False,
            "requires_follow": False,
            "cid": None,
        }

    track_record.route_id = helpers.create_track_route_id(
        track_metadata["title"], "handle"
    )  # TODO use handle from upstream user fetch


def is_valid_json_field(metadata, field):
    if field in metadata and isinstance(metadata[field], dict) and metadata[field]:
        return True
    return False


transaction_handlers = {
    "init_admin": handle_init_admin,
    "update_admin": handle_update_admin,
    "init_user": handle_init_user,
    "init_user_sol": handle_init_user_sol,
    "create_user": handle_create_user,
    "update_user": handle_update_user,
    "update_is_verified": handle_update_is_verified,
    "manage_entity": handle_manage_entity,
    "create_content_node": handle_create_content_node,
    "public_create_or_update_content_node": handle_public_create_or_update_content_node,
    "public_delete_content_node": handle_public_delete_content_node,
    "update_user_replica_set": handle_update_user_replica_set,
    "write_entity_social_action": handle_write_entity_social_action,
    "follow_user": handle_follow_user,
    "init_authority_delegation_status": handle_init_authority_delegation_status,
    "revoke_authority_delegation": handle_revoke_authority_delegation,
    "add_user_authority_delegate": handle_add_user_authority_delegate,
    "remove_user_authority_delegate": handle_remove_user_authority_delegate,
}
