import asyncio
import logging
from typing import Any

from sqlalchemy import desc
from src.models.models import AudiusDataTx
from src.solana.solana_program_indexer import SolanaProgramIndexer
from src.utils.helpers import split_list

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"
TX_SIGNATURES_PROCESSING_SIZE = 100


class AnchorDataIndexer(SolanaProgramIndexer):
    """
    Indexer for the audius user data layer
    """

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

    def validate_and_save_parsed_tx_records(self, processed_transactions, metadata_dictionary):
        self.msg(f"validate_and_save anchor {processed_transactions} - {metadata_dictionary}")
        with self._db.scoped_session() as session:
            for transaction in processed_transactions:
                session.add(AudiusDataTx(
                    signature=transaction["tx_sig"],
                    slot=transaction["result"]["slot"]
                ))

    # TODO - This is where we will deserialize instruction data and accounts
    # tx_metadata should contain TxType, Deserialized Instruction Data, etc
    def parse_tx(self, tx_sig):
        return super().parse_tx(tx_sig)

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
