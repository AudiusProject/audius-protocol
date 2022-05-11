import logging
from datetime import datetime
from typing import Any, Dict, List, TypedDict

from sqlalchemy.orm.session import Session
from src.models.models import Playlist, Track, User
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
    update_user_model_metadata(user, user_metadata)
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


def create_track_model(instruction_data, slot, txhash, created_at, updated_at):
    new_track = Track(
        slot=slot,
        txhash=txhash,
        track_id=instruction_data["id"],
        owner_id=instruction_data["user_id_seed_bump"].user_id,
        metadata_multihash=instruction_data.get("metadata"),
        is_current=True,
        is_delete=False,
        created_at=created_at,
        updated_at=updated_at,
    )
    return new_track


def create_playlist_model(instruction_data, slot, txhash, created_at, updated_at):
    new_playlist = Playlist(
        slot=slot,
        txhash=txhash,
        playlist_id=instruction_data["id"],
        playlist_owner_id=instruction_data["user_id_seed_bump"].user_id,
        metadata_multihash=instruction_data.get("metadata"),
        is_current=True,
        is_delete=False,
        created_at=created_at,
        updated_at=updated_at,
    )
    return new_playlist


def create_entity(entity_type, instruction_data, transaction):
    ENTITY_TYPE_TO_CREATE_MODEL_HANDLER = {
        entity_type.Playlist: create_playlist_model,
        entity_type.Track: create_track_model,
    }

    slot = transaction["result"]["slot"]
    txhash = transaction["tx_sig"]
    created_at = datetime.utcfromtimestamp(transaction["result"]["blockTime"])
    updated_at = datetime.utcfromtimestamp(transaction["result"]["blockTime"])

    create_model_handler = ENTITY_TYPE_TO_CREATE_MODEL_HANDLER[type(entity_type)]
    created_entity = create_model_handler(
        instruction_data, slot, txhash, created_at, updated_at
    )
    return created_entity


def update_entity_metadata(entity_type, instance, metadata):
    ENTITY_TYPE_TO_METADATA_UPDATE_HANDLER = {
        entity_type.Playlist: update_playlist_model_metadata,
        entity_type.Track: update_track_model_metadata,
    }
    update_model_handler = ENTITY_TYPE_TO_METADATA_UPDATE_HANDLER[type(entity_type)]
    updated_model = update_model_handler(instance, metadata)
    return updated_model


def validate_entity_existence(tablename, entity_id, db_models, entity_should_exist):
    entity_exists = entity_id in db_models[tablename]
    if entity_exists != entity_should_exist:
        logger.info(
            f"Skipping create {tablename} id {entity_id} because it exists: {entity_exists} when we expected: {entity_exists}."
        )
        raise EntityExistenceException


def get_tablename(entity_type):
    ENTITY_TYPE_TO_TABLENAME = {
        entity_type.Playlist: "playlists",
        entity_type.Track: "tracks",
        entity_type.User: "users",
    }
    tablename = ENTITY_TYPE_TO_TABLENAME[type(entity_type)]
    return tablename


def invalidate_prior_records(db_models, tablename, entity_id):
    for prior_record in db_models[tablename][entity_id]:
        prior_record.is_current = False
    return db_models


def clone_record_for_update(
    existing_record, entity_type, instruction_data, transaction
):
    ENTITY_TYPE_TO_ID_FIELD_NAME = {
        entity_type.Playlist: "playlist_id",
        entity_type.Track: "track_id",
    }
    entity_id = instruction_data["id"]
    id_field_name = ENTITY_TYPE_TO_ID_FIELD_NAME[type(entity_type)]
    slot = transaction["result"]["slot"]
    txhash = transaction["tx_sig"]
    updated_at = datetime.utcfromtimestamp(transaction["result"]["blockTime"])

    new_record = clone_model(existing_record)
    setattr(new_record, id_field_name, entity_id)
    new_record.txhash = txhash
    new_record.slot = slot
    new_record.is_current = True
    new_record.updated_at = updated_at
    new_record.metadata_multihash = instruction_data["metadata"]

    return new_record


def handle_manage_entity(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    record_to_save = None

    instruction_data: ManageEntityData = instruction["data"]
    entity_type = instruction_data["entity_type"]
    entity_id = instruction_data["id"]
    management_action = instruction_data["management_action"]
    tablename = get_tablename(entity_type)

    try:
        if isinstance(management_action, management_action.Create):
            entity_should_already_exist = False
            validate_entity_existence(
                tablename, entity_id, db_models, entity_should_already_exist
            )
            new_record = create_entity(entity_type, instruction_data, transaction)

            metadata = metadata_dictionary.get(instruction_data["metadata"], {})
            full_model = update_entity_metadata(entity_type, new_record, metadata)

            record_to_save = full_model

        elif isinstance(management_action, management_action.Update):
            entity_should_already_exist = True
            validate_entity_existence(
                tablename, entity_id, db_models, entity_should_already_exist
            )
            existing_record = db_models[tablename].get(entity_id)[-1]

            new_record = clone_record_for_update(
                existing_record, entity_type, instruction_data, transaction
            )

            metadata = metadata_dictionary.get(instruction_data["metadata"], {})
            full_model = update_entity_metadata(entity_type, new_record, metadata)

            db_models = invalidate_prior_records(db_models, tablename, entity_id)
            record_to_save = full_model
    except EntityExistenceException:
        pass
    except MetadataValidationException as e:
        raise e

    if record_to_save:
        records.append(record_to_save)
        db_models[tablename][entity_id].append(record_to_save)


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
def update_user_model_metadata(user_record: User, metadata_dict: Dict):
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


def update_track_model_metadata(track_record: Track, track_metadata: Dict):
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
    # TODO update stems, remixes, challenge
    return track_record


def update_playlist_model_metadata(playlist_record: Playlist, playlist_metadata: Dict):
    required_fields = ["is_album", "is_private", "playlist_contents"]
    playlist_record.is_album = playlist_metadata["is_album"]
    playlist_record.is_private = playlist_metadata["is_private"]
    playlist_record.playlist_name = playlist_metadata["playlist_name"]
    playlist_record.playlist_image_multihash = playlist_metadata[
        "playlist_image_multihash"
    ]
    playlist_record.playlist_image_sizes_multihash = playlist_metadata[
        "playlist_image_sizes_multihash"
    ]
    playlist_record.description = playlist_metadata["description"]
    playlist_record.upc = playlist_metadata["upc"]
    playlist_record.last_added_to = playlist_metadata["last_added_to"]

    if is_valid_json_field(playlist_metadata, "playlist_contents"):
        playlist_record.playlist_contents = playlist_metadata["playlist_contents"]
    else:
        raise MetadataValidationException(
            f"Required field playlist_contents \
                on {playlist_record} was in an invalid format"
        )

    # validation
    for field in required_fields:
        if field_is_null(playlist_record, field):
            raise MetadataValidationException(
                f"Required field {field} on {playlist_record} was null"
            )

    return playlist_record


def field_is_null(model, field):
    return model.get(field) == None or model.get(field) == ""


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


# Custom error classes
class EntityExistenceException(Exception):
    pass


class MetadataValidationException(Exception):
    pass
