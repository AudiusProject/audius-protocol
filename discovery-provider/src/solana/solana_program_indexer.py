import logging
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy import desc
from src.models.models import AudiusDataTx
from src.solana.constants import (
    TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"


class IndexerBase(ABC):
    """
    Base indexer class - handles lock acquisition to guarantee single entrypoint
    """

    _label: str
    _lock_name: str
    _redis: Any
    _db: Any

    @abstractmethod
    def __init__(self, label: str, redis: Any, db: Any):
        self._label = label
        self._redis = redis
        self._db = db
        self._lock_name = f"{self._label}"
        # Clear lock if present
        self._redis.delete(self._lock_name)

    def run(self):
        have_lock = False
        # Define redis lock object
        update_lock = self._redis.lock(self._lock_name)
        try:
            # TODO blocking timeout argument
            have_lock = update_lock.acquire(blocking=False)
            if have_lock:
                self.process_index_task()
        except Exception as e:
            raise e
        finally:
            if have_lock:
                update_lock.release()

    @abstractmethod
    def process_index_task(self):
        self.msg("UNIMPLEMENTED IN BASE CLASS")

    def msg(self, msg: str):
        # DO NOT MERGE AS ERROR
        logger.error(f"{self._label} | {msg}")


class SolanaProgramIndexer(IndexerBase):
    """
    Generic indexer class for Solana programs
    """

    _program_id: str
    _redis_queue_cache_prefix: str
    _solana_client_manager: Any

    def __init__(
        self,
        program_id: str,
        label: str,
        redis: Any,
        db: Any,
        solana_client_manager: Any,
    ):
        """
        Instantiate a SolanaProgramIndexer class
        @param program_id: Deployed program ID
        @param label: String label for this indexer instance
        @param redis: Redis client class
        @param solana_client_manager: solana web3 wrapper class
        """
        super().__init__(label, redis, db)
        self._program_id = program_id
        self._solana_client_manager = solana_client_manager
        self._redis_queue_cache_prefix = f"{self._label}-tx-cache-queue"

    @abstractmethod
    def get_tx_in_db(self, session: Any, tx_sig: str):
        """
        Return a boolean value indicating whether tx signature is found
        """
        raise Exception("Must be implemented in subclass")

    @abstractmethod
    def get_latest_slot(self):
        """
        Return the highest slot for this indexer's associated entity -
        for example, track listens checks the Play table while the user
        bank indexer checks user_bank_txs
        """
        raise Exception(BASE_ERROR)

    def get_transactions_to_process(self):
        """
        Calculate the delta between database and chain tail
        """
        latest_processed_slot = self.get_latest_slot()
        # The 'before' value from where we start querying transactions
        # TODO: Add cache
        last_tx_signature = None

        # Loop exit condition
        intersection_found = False

        # List of signatures that will be populated as we traverse recent operations
        transaction_signatures = []

        # Current batch of transactions
        transaction_signature_batch = []

        # Current batch
        page_count = 0
        while not intersection_found:
            self.msg(
                f"Requesting transactions before {last_tx_signature} - {self._program_id}"
            )
            transactions_history = (
                self._solana_client_manager.get_signatures_for_address(
                    self._program_id,
                    before=last_tx_signature,
                    limit=TX_SIGNATURES_BATCH_SIZE,
                )
            )
            transactions_array = transactions_history["result"]
            if not transactions_array:
                # This is considered an 'intersection' since there are no further transactions to process but
                # really represents the end of known history for this ProgramId
                intersection_found = True
                logger.info(
                    f"index_solana_plays.py | No transactions found before {last_tx_signature}"
                )
            else:
                with self.db.scoped_session() as read_session:
                    for tx in transactions_array:
                        tx_sig = tx["signature"]
                        slot = tx["slot"]
                        if tx["slot"] > latest_processed_slot:
                            transaction_signature_batch.append(tx_sig)
                        elif tx["slot"] <= latest_processed_slot:
                            # Check the tx signature for any txs in the latest batch,
                            # and if not present in DB, add to processing
                            logger.info(
                                f"index_solana_plays.py | Latest slot re-traversal\
                                slot={slot}, sig={tx_sig},\
                                latest_processed_slot(db)={latest_processed_slot}"
                            )
                            exists = self.get_tx_in_db(read_session, tx_sig)
                            if exists:
                                # Exit loop and set terminal condition since this tx has been found in DB
                                # Transactions are returned with most recently committed first, so we can assume
                                # subsequent transactions in this batch have already been processed
                                intersection_found = True
                                break
                            # Otherwise, ensure this transaction is still processed
                            transaction_signature_batch.append(tx_sig)
                    # Restart processing at the end of this transaction signature batch
                    last_tx = transactions_array[-1]
                    last_tx_signature = last_tx["signature"]

                    # TODO: Add Caching
                    # Append to recently seen cache
                    # cache_traversed_tx(redis, last_tx)

                    # Append batch of processed signatures
                    if transaction_signature_batch:
                        transaction_signatures.append(transaction_signature_batch)

                    # Ensure processing does not grow unbounded
                    if len(transaction_signatures) > TX_SIGNATURES_MAX_BATCHES:
                        logger.info(
                            f"index_solana_plays.py | slicing tx_sigs from {len(transaction_signatures)} entries"
                        )
                        transaction_signatures = transaction_signatures[
                            -TX_SIGNATURES_RESIZE_LENGTH:
                        ]
                        logger.info(
                            f"index_solana_plays.py | sliced tx_sigs to {len(transaction_signatures)} entries"
                        )

                    # Reset batch state
                    transaction_signature_batch = []

            self.msg(
                f"intersection_found={intersection_found},\
                last_tx_signature={last_tx_signature},\
                page_count={page_count}"
            )
            page_count = page_count + 1

        return transaction_signatures.reverse()


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

    def process_index_task(self):
        self.msg("AnchorDataIndexer : processing indexing task")
        txs_to_process = self.get_transactions_to_process()
        self.msg(f"AnchorDataIndexer: processing {txs_to_process}")
