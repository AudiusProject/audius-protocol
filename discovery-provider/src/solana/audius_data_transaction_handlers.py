import logging
from datetime import datetime
from typing import Any, Dict, List, TypedDict

from sqlalchemy.orm.session import Session
from src.models.models import User
from src.solana.anchor_parser import ParsedTxInstr
from src.solana.solana_transaction_types import TransactionInfoResult
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


def handle_init_user(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    # NOTE: Not sure if we should update the user's model until they claim account
    # user_id = instruction.get("data").get("id")
    # existing_user = db_models.get("users", {}).get(user_id)
    # user = User(**existing_user.asdict())
    # user.slot = transaction["result"]["slot"]

    # replica_set = list(instruction.get("data").get("replica_set"))
    # user.primary_id = replica_set[0]
    # user.secondary_ids = [replica_set[1], replica_set[2]]

    # metadata_cid = instruction.get('data').get('metadata')

    # No action to be taken here
    pass


def handle_init_user_sol(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


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

    ipfs_metadata = metadata_dictionary.get(instruction_data["metadata"])
    update_user_model_metadata(session, user, ipfs_metadata)
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


def handle_manage_entity(
    session: Session,
    transaction: ParsedTx,
    instruction: ParsedTxInstr,
    db_models: Dict,
    metadata_dictionary: Dict,
    records: List[Any],
):
    pass


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
    session: Session, user_record: User, ipfs_metadata: Dict
):
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

    if "cover_photo_sizes" in ipfs_metadata and ipfs_metadata["cover_photo_sizes"]:
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

    # TODO: implement
    # if "associated_wallets" in ipfs_metadata:
    #     update_user_associated_wallets(
    #         session: Session,
    #         update_task,
    #         user_record,
    #         ipfs_metadata["associated_wallets"],
    #         "eth",
    #     )

    # TODO: implement
    # if "associated_sol_wallets" in ipfs_metadata:
    #     update_user_associated_wallets(
    #         session: Session,
    #         update_task,
    #         user_record,
    #         ipfs_metadata["associated_sol_wallets"],
    #         "sol",
    #     )

    if "playlist_library" in ipfs_metadata and ipfs_metadata["playlist_library"]:
        user_record.playlist_library = ipfs_metadata["playlist_library"]

    if "is_deactivated" in ipfs_metadata:
        user_record.is_deactivated = ipfs_metadata["is_deactivated"]

    # TODO: implement
    # if "events" in ipfs_metadata and ipfs_metadata["events"]:
    #     update_user_events(
    #         session: Session,
    #         user_record,
    #         ipfs_metadata["events"],
    #         update_task.challenge_event_bus,
    #     )


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
