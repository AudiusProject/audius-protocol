import asyncio
import base64
import json
import logging
from pathlib import Path
from typing import Any, Dict, List

import base58
from anchorpy import Idl, InstructionCoder
from solana.transaction import Transaction, TransactionInstruction
from sqlalchemy import desc
from src.models.models import AudiusDataTx
from src.solana.solana_program_indexer import SolanaProgramIndexer
from src.utils.helpers import split_list

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"
TX_SIGNATURES_PROCESSING_SIZE = 100
AUDIUS_DATA_IDL_PATH = "./idl/audius_data.json"


class AnchorDataIndexer(SolanaProgramIndexer):
    """
    Indexer for the audius user data layer
    """

    _instruction_coder: InstructionCoder

    def __init__(
        self,
        program_id: str,
        label: str,
        redis: Any,
        db: Any,
        solana_client_manager: Any,
    ):
        super().__init__(program_id, label, redis, db, solana_client_manager)
        self._init_instruction_coder()

    def get_tx_in_db(self, session: Any, tx_sig: str):
        exists = False
        tx_sig_db_count = (
            session.query(AudiusDataTx).filter(AudiusDataTx.signature == tx_sig)
        ).count()
        exists = tx_sig_db_count > 0
        self.msg(f"{tx_sig} exists={exists}")
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
        self, processed_transactions, metadata_dictionary
    ):
        self.msg(
            f"validate_and_save anchor {processed_transactions} - {metadata_dictionary}"
        )
        with self._db.scoped_session() as session:
            for transaction in processed_transactions:
                session.add(
                    AudiusDataTx(
                        signature=transaction["tx_sig"],
                        slot=transaction["result"]["slot"],
                    )
                )

    # TODO - This is where we will deserialize instruction data and accounts
    # tx_metadata should contain TxType, Deserialized Instruction Data, etc
    def parse_tx(self, tx_sig):
        t = super().parse_tx(tx_sig)
        tx_receipt = self._solana_client_manager.get_sol_tx_info(tx_sig, 5, "base64")
        encoded_data = tx_receipt["result"].get("transaction")[0]
        encoded_data_hex = base64.b64decode(encoded_data).hex()
        res = Transaction.deserialize(bytes.fromhex(encoded_data_hex))
        # self.msg(f"{tx_sig} - {t} - {tx_receipt} - {res}")
        for instruction in res.instructions:
            parsed_instr = self._parse_instruction(instruction)
            self.msg(f"{tx_sig} | {parsed_instr}")
        return t

    def process_index_task(self):
        self.msg("Processing indexing task")
        # Retrieve transactions to process
        transaction_signatures = self.get_transactions_to_process()
        # Break down batch into records of size 100
        for tx_sig_batch in transaction_signatures:
            for tx_sig_batch_records in split_list(
                tx_sig_batch, TX_SIGNATURES_PROCESSING_SIZE
            ):
                # Dispatch transactions to processor
                asyncio.run(self.process_txs_batch(tx_sig_batch_records))
        self.msg("Finished processing indexing task")

    # TODO - Override with actual remote fetch operation
    async def fetch_ipfs_metadata(self, parsed_transactions):
        return super().fetch_ifps_metadata(parsed_transactions)

    def _parse_instruction(self, instruction: TransactionInstruction) -> Dict:
        encoded_ix_data = base58.b58encode(instruction.data)
        idl_instruction_name = self._get_instruction_name(encoded_ix_data)
        account_addresses = self._get_instruction_context_accounts(instruction)
        decoded_data = self._decode_instruction_data(
            encoded_ix_data, self._instruction_coder
        )
        return {
            "instruction_name": idl_instruction_name,
            "accounts": account_addresses,
            "data": decoded_data,
        }

    def _init_instruction_coder(self):
        idl = self._get_idl()
        self._instruction_coder = InstructionCoder(idl)

    def _get_idl(self):
        path = Path(AUDIUS_DATA_IDL_PATH)
        with path.open() as f:
            data = json.load(f)

        # Modify 'metadata':'address' field if mismatched with config
        if data["metadata"]["address"] != self._program_id:
            data["metadata"]["address"] = self._program_id

        idl = Idl.from_json(data)
        return idl

    def _get_instruction_name(self, encoded_ix_data: bytes) -> str:
        idl_instruction_name = self._instruction_coder.sighash_to_name.get(
            base58.b58decode(encoded_ix_data)[0:8]
        )
        if idl_instruction_name == None:
            return ""
        return idl_instruction_name

    # Maps account indices for ix context to pubkeys
    def _get_instruction_context_accounts(
        self,
        instruction: TransactionInstruction,
    ) -> List[str]:
        return [str(account_meta.pubkey) for account_meta in instruction.keys]

    def _decode_instruction_data(
        self, encoded_ix_data: bytes, instruction_coder: InstructionCoder
    ) -> Any:
        ix = base58.b58decode(encoded_ix_data)
        ix_sighash = ix[0:8]
        data = ix[8:]
        decoder = instruction_coder.sighash_layouts.get(ix_sighash)
        if not decoder:
            return None
        else:
            decoded_data = decoder.parse(data)
            return decoded_data
