import asyncio
import base64
import json
import logging
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

from anchorpy import Idl, InstructionCoder
from redis import Redis
from solana.transaction import Transaction
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from src.models.models import AudiusDataTx, User
from src.solana.anchor_parser import AnchorParser
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_program_indexer import SolanaProgramIndexer
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.utils.cid_metadata_client import CIDMetadataClient
from src.utils.helpers import split_list
from src.utils.session_manager import SessionManager
from web3 import Web3

logger = logging.getLogger(__name__)

TX_SIGNATURES_PROCESSING_SIZE = 100
AUDIUS_DATA_IDL_PATH = "./idl/audius_data.json"


class AnchorProgramIndexer(SolanaProgramIndexer):
    """
    Indexer for the audius user data layer
    """

    def __init__(
        self,
        program_id: str,
        admin_storage_public_key: str,
        label: str,
        redis: Redis,
        db: SessionManager,
        solana_client_manager: SolanaClientManager,
        cid_metadata_client: CIDMetadataClient,
    ):
        super().__init__(program_id, label, redis, db, solana_client_manager)
        self.anchor_parser = AnchorParser(AUDIUS_DATA_IDL_PATH, program_id)
        self.admin_storage_public_key = admin_storage_public_key
        self.cid_metadata_client = cid_metadata_client

        # TODO fill out the rest
        self.instruction_type = {
            "init_user": "user",
            "create_track": "track",
        }

    def is_tx_in_db(self, session: Session, tx_sig: str):
        exists = False
        tx_sig_db_count = (
            session.query(AudiusDataTx).filter(AudiusDataTx.signature == tx_sig)
        ).count()
        exists = tx_sig_db_count > 0
        return exists

    def get_latest_slot(self):
        latest_slot = None
        with self._db.scoped_session() as session:
            highest_slot_query = (
                session.query(AudiusDataTx)
                .filter(AudiusDataTx.slot != None)
                .filter(AudiusDataTx.signature != None)
                .order_by(desc(AudiusDataTx.slot))
            ).first()
            # Can be None prior to first write operations
            if highest_slot_query is not None:
                latest_slot = highest_slot_query.slot

        # If no slots have yet been recorded, assume all are valid
        if latest_slot is None:
            latest_slot = 0

        self.msg(f"returning {latest_slot} for highest slot")
        return latest_slot

    def validate_and_save_parsed_tx_records(
        self, processed_transactions: List[Any], metadata_dictionary: Dict
    ):
        self.msg(
            f"validate_and_save anchor {processed_transactions} - {metadata_dictionary}"
        )
        self.msg(f"{processed_transactions}")
        with self._db.scoped_session() as session:
            session.bulk_save_objects(
                [
                    AudiusDataTx(
                        signature=transaction["tx_sig"],
                        slot=transaction["result"]["slot"],
                    )
                    for transaction in processed_transactions
                ]
            )

            # Find user ids in DB and create dictionary mapping
            db_models: Dict = defaultdict(lambda: {})
            if metadata_dictionary["ids"]["users"]:
                existing_users = (
                    session.query(User)
                    .filter(
                        User.is_current,
                        User.user_id.in_(metadata_dictionary["ids"]["users"]),
                    )
                    .all()
                )
                for user in existing_users:
                    db_models["users"][user.user_id] = user

            self.process_transactions(
                session, processed_transactions, db_models, metadata_dictionary
            )

    def process_transactions(
        self,
        session: Session,
        processed_transactions: List[Any],
        db_models: Dict,
        metadata_dictionary: Dict,
    ):
        id_dict: Dict[str, set] = defaultdict(lambda: set())
        records = []
        for transaction in processed_transactions:
            instructions = transaction.get("tx_metadata").get("instructions")
            for instruction in instructions:
                instruction_name = instruction.get("instruction_name")
                if instruction_name == "init_admin":
                    pass
                elif instruction_name == "update_admin":
                    pass
                elif instruction_name == "init_user":
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
                elif instruction_name == "init_user_sol":
                    pass

                elif instruction_name == "create_user":
                    # Validate that the user row doesn't already exist - error if it does
                    user_id = instruction.get("data").get("id")
                    # TODO: validate uniqueness on handle
                    # TODO: validate replica set
                    replica_set = list(instruction.get("data").get("replica_set"))

                    eth_address = Web3.toChecksumAddress(
                        f"0x{bytes(list(instruction.get('data').get('eth_address'))).hex()}"
                    )
                    metadata_multihash = instruction.get("data").get("metadata")

                    user = User(
                        blockhash=None,
                        blocknumber=None,
                        slot=transaction["result"]["slot"],
                        user_storage_account=str(
                            instruction.get("accounts")[0]
                        ),  # NOTE: to be updated to be named instead of index
                        user_authority_account=str(
                            instruction.get("data").get("user_authority")
                        ),
                        txhash=transaction[
                            "tx_sig"
                        ],  # NOTE: firgure out how to get this
                        user_id=user_id,
                        is_current=True,
                        wallet=eth_address,
                        metadata_multihash=metadata_multihash,
                        primary_id=replica_set[0],
                        secondary_ids=[replica_set[1], replica_set[2]],
                        created_at=datetime.utcfromtimestamp(
                            transaction["result"]["blockTime"]
                        ),
                        updated_at=datetime.utcfromtimestamp(
                            transaction["result"]["blockTime"]
                        ),
                    )
                    records.append(user)
                    db_models["users"][user_id] = user
                    # ipfs_metadata = metadata_dictionary.get("metadata_multihash")
                    # self.update_user_model_meatdata(user, ipfs_metadata)
                    pass

                elif instruction_name == "update_user":
                    # TODO: validate handle is still valid
                    pass

                elif instruction_name == "update_is_verified":
                    pass
                elif instruction_name == "manage_entity":
                    pass
                elif instruction_name == "create_content_node":
                    pass
                elif instruction_name == "public_create_or_update_content_node":
                    pass
                elif instruction_name == "public_delete_content_node":
                    pass
                elif instruction_name == "update_user_replica_set":
                    pass
                elif instruction_name == "write_entity_social_action":
                    pass
                elif instruction_name == "follow_user":
                    pass
                elif instruction_name == "init_authority_delegation_status":
                    pass
                elif instruction_name == "revoke_authority_delegation":
                    pass
                elif instruction_name == "add_user_authority_delegate":
                    pass
                elif instruction_name == "remove_user_authority_delegate":
                    pass
        #
        self.invalidate_old_records(session, id_dict)
        session.bulk_save_objects(records)

    def invalidate_old_records(self, session: Session, id_dict: Dict[str, set]):
        # Update existing record in db to is_current = False
        if id_dict.get("users"):
            session.query(User).filter(
                User.user_id.in_(list(id_dict.get("users", set()))),
                User.is_current == True,
            ).update({"is_current": False})

    # Update a user orm model with the ipfs metadata
    def update_user_model_meatdata(self, user_record: User, ipfs_metadata: Dict):
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
        #         session,
        #         update_task,
        #         user_record,
        #         ipfs_metadata["associated_wallets"],
        #         "eth",
        #     )

        # TODO: implement
        # if "associated_sol_wallets" in ipfs_metadata:
        #     update_user_associated_wallets(
        #         session,
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
        #         session,
        #         user_record,
        #         ipfs_metadata["events"],
        #         update_task.challenge_event_bus,
        #     )

    def extract_ids(self, processed_transactions: List[Any]):
        entites: Dict[str, Set[str]] = defaultdict(lambda: set())
        cids: Set = set()

        for transaction in processed_transactions:
            instructions = transaction.get("tx_metadata").get("instructions")
            for instruction in instructions:
                instruction_name = instruction.get("instruction_name")
                if instruction_name == "init_admin":
                    pass
                elif instruction_name == "update_admin":
                    pass
                elif instruction_name == "init_user":
                    # No action to be taken here
                    pass

                elif instruction_name == "init_user_sol":
                    # TODO: parse the tx data for their user id and fetch
                    # user_id = instruction.get("data").get("id")
                    pass

                elif instruction_name == "create_user":
                    # TODO: parse the tx data for their user id and fetch
                    # user_id = instruction.get("data").get("id")
                    pass

                elif instruction_name == "update_user":
                    # TODO: parse the tx data for their user id and fetch
                    # user_id = instruction.get("data").get("id")
                    pass
                elif instruction_name == "update_is_verified":
                    pass
                elif instruction_name == "manage_entity":
                    pass
                elif instruction_name == "create_content_node":
                    pass
                elif instruction_name == "public_create_or_update_content_node":
                    pass
                elif instruction_name == "public_delete_content_node":
                    pass
                elif instruction_name == "update_user_replica_set":
                    pass
                elif instruction_name == "write_entity_social_action":
                    pass
                elif instruction_name == "follow_user":
                    pass
                elif instruction_name == "init_authority_delegation_status":
                    pass
                elif instruction_name == "revoke_authority_delegation":
                    pass
                elif instruction_name == "add_user_authority_delegate":
                    pass
                elif instruction_name == "remove_user_authority_delegate":
                    pass

        return (entites, cids)

    def get_transaction_user_ids(self, processed_transactions: List[Any]) -> Set[str]:
        user_ids: Set[str] = set()
        for transaction in processed_transactions:
            if hasattr(transaction["data"], "user_id"):
                bump_seed = transaction["data"].get("user_id")
                user_id = bump_seed.get("bump")
                user_ids.add(user_id)
        return user_ids

    async def parse_tx(self, tx_sig: str):
        tx_receipt = self._solana_client_manager.get_sol_tx_info(tx_sig, 5, "base64")
        self.msg(tx_receipt)
        encoded_data = tx_receipt["result"].get("transaction")[0]
        decoded_data = base64.b64decode(encoded_data)
        decoded_data_hex = decoded_data.hex()
        tx = Transaction.deserialize(bytes.fromhex(decoded_data_hex))
        tx_metadata = {}

        # Append each parsed transaction to parsed metadata
        tx_instructions = []
        for instruction in tx.instructions:
            parsed_instr = self.anchor_parser.parse_instruction(instruction)
            if self.is_valid_instruction(parsed_instr):
                tx_instructions.append(parsed_instr)

        tx_metadata["instructions"] = tx_instructions

        """
        For example:
            Embed instruction specific information in tx_metadata
        """
        return {
            "tx_sig": tx_sig,
            "tx_metadata": tx_metadata,
            "result": tx_receipt["result"],
        }

    def is_valid_instruction(self, parsed_instr: Dict):
        # TODO find a better way to reconcile admin in mocks / default config
        if parsed_instr["instruction_name"] == "init_user":
            if (
                parsed_instr["account_names_map"]["admin"]
                != self.admin_storage_public_key
            ):
                return False

        # TODO implement remaining instruction validation
        # consider creating classes for each instruction type
        # then implementing instruction validation / updating user records for each.
        # consider renaming admin accounts in program for consistency
        # then dynamically validating.

        return True

    def process_index_task(self):
        self.msg("Processing indexing task")
        # Retrieve transactions to process
        transaction_signatures = self.get_transaction_batches_to_process()
        # Break down batch into records of size 100
        for tx_sig_batch in transaction_signatures:
            for tx_sig_batch_records in split_list(
                tx_sig_batch, TX_SIGNATURES_PROCESSING_SIZE
            ):
                # Dispatch transactions to processor
                asyncio.run(self.process_txs_batch(tx_sig_batch_records))
        self.msg("Finished processing indexing task")

    # TODO - Override with actual remote fetch operation
    # parsed_transactions will contain an array of txs w/instructions
    # each containing relevant metadata in container
    async def fetch_cid_metadata(
        self, parsed_transactions: List[Dict]
    ) -> Tuple[Dict[str, Dict], Set[str]]:

        cid_to_user_id: Dict[str, int] = {}
        cids_txhash_set: Set[Tuple[str, str]] = set()
        cid_to_entity_type: Dict[str, str] = {}  # cid -> entity type track / user
        blacklisted_cids: Set[str] = set()

        with self.db.scoped_session() as session:

            # any instructions with  metadata
            for transaction in parsed_transactions:
                for instruction in transaction["tx_metadata"]["instructions"]:
                    if "metadata" in instruction["data"]:
                        cid = instruction["data"]["metadata"]
                        if is_blacklisted_ipld(session, cid):
                            blacklisted_cids.add(cid)
                        else:
                            cids_txhash_set.add((cid, transaction["tx_sig"]))
                            cid_to_entity_type[cid] = self.instruction_type[
                                instruction["instruction_name"]
                            ]

                        # TODO update once user_id changes are merged in
                        cid_to_user_id[cid] = 1

            user_replica_set = dict(
                session.query(User.user_id, User.creator_node_endpoint)
                .filter(
                    User.is_current == True,
                    User.user_id.in_(cid_to_user_id.values()),
                )
                .group_by(User.user_id, User.creator_node_endpoint)
                .all()
            )

        cid_metadata = (
            await self.cid_metadata_client.async_fetch_metadata_from_gateway_endpoints(
                cids_txhash_set,
                cid_to_user_id,
                user_replica_set,
                cid_to_entity_type,
            )
        )
        return cid_metadata, blacklisted_cids
