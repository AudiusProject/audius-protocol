import asyncio
import base64
import logging
from typing import Any

from solana.transaction import Transaction
from sqlalchemy import desc
from src.models.models import AudiusDataTx
from src.solana.anchor_parser import AnchorParser
from src.solana.solana_program_indexer import SolanaProgramIndexer
from src.utils.helpers import split_list

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
        label: str,
        redis: Any,
        db: Any,
        solana_client_manager: Any,
    ):
        super().__init__(program_id, label, redis, db, solana_client_manager)
        self.anchor_parser = AnchorParser(AUDIUS_DATA_IDL_PATH, program_id)

    def is_tx_in_db(self, session: Any, tx_sig: str):
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
        self, processed_transactions, metadata_dictionary
    ):
        self.msg(
            f"validate_and_save anchor {processed_transactions} - {metadata_dictionary}"
        )
        # TODO: Conditionally add database modifications here depending on transaction information
        with self._db.scoped_session() as session:
            for transaction in processed_transactions:
                session.add(
                    AudiusDataTx(
                        signature=transaction["tx_sig"],
                        slot=transaction["result"]["slot"],
                    )
                )

    async def parse_tx(self, tx_sig):
        tx_receipt = self._solana_client_manager.get_sol_tx_info(tx_sig, 5, "base64")
        encoded_data = tx_receipt["result"].get("transaction")[0]
        decoded_data = base64.b64decode(encoded_data)
        decoded_data_hex = decoded_data.hex()
        tx = Transaction.deserialize(bytes.fromhex(decoded_data_hex))
        tx_metadata = {}

        # Append each parsed transaction to parsed metadata
        tx_instructions = []
        for instruction in tx.instructions:
            parsed_instr = self.anchor_parser.parse_instruction(instruction)
            tx_instructions.append(parsed_instr)

        tx_metadata["instructions"] = tx_instructions

        """
        For example:
            Embed instruction specific information in tx_metadata
        """
        return {"tx_sig": tx_sig, "tx_metadata": tx_metadata, "result": None}

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
    async def fetch_ipfs_metadata(self, parsed_transactions):
        return super().fetch_ipfs_metadata(parsed_transactions)
