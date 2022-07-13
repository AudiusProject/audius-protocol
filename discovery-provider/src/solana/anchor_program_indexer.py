import asyncio
import base64
import logging
from collections import defaultdict
from typing import Any, Dict, List, Set, Tuple

from redis import Redis
from solana.transaction import Transaction
from sqlalchemy import desc
from sqlalchemy.orm.session import Session
from src.models.indexing.audius_data_tx import AudiusDataTx
from src.models.indexing.ursm_content_node import UrsmContentNode
from src.models.tracks.track import Track
from src.models.users.user import User
from src.solana.anchor_parser import AnchorParser
from src.solana.audius_data_transaction_handlers import ParsedTx, transaction_handlers
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_program_indexer import SolanaProgramIndexer
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.utils.cid_metadata_client import CIDMetadataClient
from src.utils.helpers import split_list
from src.utils.session_manager import SessionManager

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
            "create_user": "user",
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
        self, parsed_transactions: List[ParsedTx], metadata_dictionary: Dict
    ):
        self.msg(
            f"validate_and_save anchor {parsed_transactions} - {metadata_dictionary}"
        )
        with self._db.scoped_session() as session:
            session.bulk_save_objects(
                [
                    AudiusDataTx(
                        signature=transaction["tx_sig"],
                        slot=transaction["result"]["slot"],
                    )
                    for transaction in parsed_transactions
                ]
            )

            # Find user ids in DB and create dictionary mapping
            entity_ids = self.extract_ids(session, parsed_transactions)
            db_models: Dict = defaultdict(lambda: defaultdict(lambda: []))
            if entity_ids["users"]:
                existing_users = (
                    session.query(User)
                    .filter(
                        User.is_current,
                        User.user_id.in_(list(entity_ids["users"])),
                    )
                    .all()
                )
                for user in existing_users:
                    db_models["users"][user.user_id] = [user]
            if entity_ids["tracks"]:
                existing_tracks = (
                    session.query(Track)
                    .filter(
                        Track.is_current,
                        Track.track_id.in_(list(entity_ids["tracks"])),
                    )
                    .all()
                )
                for track in existing_tracks:
                    db_models["tracks"][track.track_id] = [track]

            # TODO: Find all other track/playlist/etc. models

            self.process_transactions(
                session, parsed_transactions, db_models, metadata_dictionary
            )

    def process_transactions(
        self,
        session: Session,
        processed_transactions: List[ParsedTx],
        db_models: Dict,
        metadata_dictionary: Dict,
    ):
        records: List[Any] = []
        for transaction in processed_transactions:
            instructions = transaction["tx_metadata"]["instructions"]
            meta = transaction["result"]["meta"]
            error = meta["err"]

            if error:
                self.msg(
                    f"Skipping error transaction from chain {transaction['tx_sig']}"
                )
                continue

            for instruction in instructions:
                instruction_name = instruction.get("instruction_name")
                if instruction_name in transaction_handlers:
                    transaction_handlers[instruction_name](
                        session,
                        transaction,
                        instruction,
                        db_models,
                        metadata_dictionary,
                        records,
                    )

        self.invalidate_old_records(session, db_models)
        self.msg(f"Saving {records}")
        session.bulk_save_objects(records)

    def invalidate_old_records(self, session: Session, db_models: Dict[str, Dict]):
        # Update existing record in db to is_current = False
        if db_models.get("users"):
            user_ids = list(db_models.get("users", {}).keys())
            self.msg(f"{user_ids}")
            session.query(User).filter(
                User.is_current == True, User.user_id.in_(user_ids)
            ).update({"is_current": False}, synchronize_session="fetch")

    def extract_ids(self, session, processed_transactions: List[ParsedTx]):
        entities: Dict[str, Set[str]] = defaultdict(lambda: set())
        user_storage_to_id = {}

        for transaction in processed_transactions:
            instructions = transaction["tx_metadata"]["instructions"]
            for instruction in instructions:
                instruction_name = instruction.get("instruction_name")
                if instruction_name == "init_admin":
                    pass
                elif instruction_name == "update_admin":
                    pass
                elif instruction_name == "init_user":
                    user_id = instruction.get("data").get("user_id")
                    user_storage_account = str(
                        instruction.get("account_names_map").get("user")
                    )
                    user_storage_to_id[user_storage_account] = user_id
                    entities["users"].add(user_id)

                elif instruction_name == "init_user_sol":
                    # Fetch user_id and embed in instruction
                    user_storage_account = str(
                        instruction.get("account_names_map").get("user")
                    )
                    if user_storage_account not in user_storage_to_id:
                        user_id = (
                            session.query(User.user_id)
                            .filter(
                                User.is_current == True,
                                User.user_storage_account == user_storage_account,
                            )
                            .first()
                        )[0]
                    else:
                        user_id = user_storage_to_id[user_storage_account]

                    instruction["user_id"] = user_id
                    entities["users"].add(user_id)

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
                    id = instruction["data"]["id"]
                    entity_type = instruction["data"]["entity_type"]
                    if isinstance(entity_type, entity_type.Track):
                        entities["tracks"].add(id)
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

        return entities

    async def parse_tx(self, tx_sig: str) -> ParsedTx:
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
            parsed_instruction = self.anchor_parser.parse_instruction(instruction)
            if self.is_valid_instruction(parsed_instruction):
                tx_instructions.append(parsed_instruction)

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

    def is_valid_instruction(self, parsed_instruction: Dict):
        # check if admin matches
        if "admin" in parsed_instruction["account_names_map"]:
            if (
                parsed_instruction["account_names_map"]["admin"]
                != self.admin_storage_public_key
            ):
                return False

        # TODO update entity
        # check if user owns track

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

    # TODO existing user records will be passed in
    async def fetch_cid_metadata(
        self, parsed_transactions: List[ParsedTx]
    ) -> Tuple[Dict[str, Dict], Set[str]]:
        cid_to_user_id: Dict[str, int] = {}
        cids_txhash_set: Set[Tuple[str, str]] = set()
        cid_to_entity_type: Dict[str, str] = {}  # cid -> entity type track / user
        blacklisted_cids: Set[str] = set()
        user_replica_set: Dict[int, str] = {}

        with self.db.scoped_session() as session:
            cnode_endpoint_dict = dict(
                session.query(UrsmContentNode.cnode_sp_id, UrsmContentNode.endpoint)
                .filter(
                    UrsmContentNode.is_current == True,
                )
                .all()
            )

        # any instructions with  metadata
        for transaction in parsed_transactions:
            for instruction in transaction["tx_metadata"]["instructions"]:
                if (
                    instruction["instruction_name"] != ""
                    and "data" in instruction
                    and instruction["data"] is not None
                    and "metadata" in instruction["data"]
                ):
                    cid = instruction["data"]["metadata"]
                    if is_blacklisted_ipld(session, cid):
                        blacklisted_cids.add(cid)
                    else:
                        cids_txhash_set.add((cid, transaction["tx_sig"]))
                        if "user" in instruction["instruction_name"]:
                            cid_to_entity_type[cid] = "user"
                            # TODO add logic to use existing user records: account -> endpoint
                            user_id = instruction["data"]["user_id"]
                            cid_to_user_id[cid] = user_id
                            # new user case
                            if "replica_set" in instruction["data"]:
                                endpoints = []
                                for sp_id in instruction["data"]["replica_set"]:
                                    endpoints.append(cnode_endpoint_dict[sp_id])
                                user_replica_set[user_id] = ",".join(endpoints)
                        elif instruction["instruction_name"] == "manage_entity":
                            entity_type = instruction["data"]["entity_type"]
                            if entity_type.Track == type(entity_type):
                                cid_to_entity_type[cid] = "track"
                                user_id = instruction["data"][
                                    "user_id_seed_bump"
                                ].user_id
                                cid_to_user_id[cid] = user_id

            # TODO use existing user records instead of querying here
            user_replica_set.update(
                dict(
                    session.query(User.user_id, User.creator_node_endpoint)
                    .filter(
                        User.is_current == True,
                        User.user_id.in_(cid_to_user_id.values()),
                    )
                    .group_by(User.user_id, User.creator_node_endpoint)
                    .all()
                )
            )

        metadata_dict = (
            await self.cid_metadata_client.async_fetch_metadata_from_gateway_endpoints(
                cids_txhash_set,
                cid_to_user_id,
                user_replica_set,
                cid_to_entity_type,
            )
        )

        for cid in metadata_dict:
            user_id = cid_to_user_id[cid]
            metadata_dict[cid]["creator_node_endpoint"] = user_replica_set[user_id]

        # TODO maybe add some more validation
        # check if track metadata's owner and instruction's user ID matches up?
        return metadata_dict, blacklisted_cids
