import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

from src.solana.constants import (
    TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
)
from src.solana.solana_transaction_types import TransactionInfoResult
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"

TX_SIGNATURES_PROCESSING_SIZE = 100
PARSE_TX_TIMEOUT = 1000


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
        logger.info(f"{self._label} | {msg}")


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
        db: SessionManager,
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
        self.db = db

    @abstractmethod
    def is_tx_in_db(self, session: Any, tx_sig: str):
        """
        Return a boolean value indicating whether tx signature is found
        @param session: DB session
        @param tx_sig: transaction signature to look up
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

    @abstractmethod
    async def parse_tx(self, tx_sig):
        """
        Parse an individual transaction, this will vary based on the program being indexed
        @param tx_sig: transaction signature to be parsed
        """
        tx_info = self._solana_client_manager.get_sol_tx_info(tx_sig)
        result: TransactionInfoResult = tx_info["result"]
        return {"tx_sig": tx_sig, "tx_metadata": {}, "result": result}

    @abstractmethod
    def is_valid_instruction(self, instruction):
        """
        Returns a boolean value indicating whether an instruction is valid.
        @param instruction: transaction to be validated
        """
        raise Exception("Must be implemented in subclass")

    @abstractmethod
    def fetch_cid_metadata(self, parsed_transactions):
        """
        Fetch all metadata objects in parallel (if required). Certain indexing tasks will not require this step and can skip appropriately
        @param parsed_transactions: Array of transactions containing deserialized information, ideally pointing to a metadata object
        """
        return {}

    async def process_txs_batch(self, tx_sig_batch_records):
        self.msg(f"Parsing {tx_sig_batch_records}")
        futures = []
        tx_sig_futures_map: Dict[str, Dict] = {}
        for tx_sig in tx_sig_batch_records:
            future = asyncio.ensure_future(self.parse_tx(tx_sig))
            futures.append(future)
        for future in asyncio.as_completed(futures, timeout=PARSE_TX_TIMEOUT):
            try:
                future_result = await future
                self.msg(f"{future_result}")
                tx_sig_futures_map[future_result["tx_sig"]] = future_result
            except asyncio.CancelledError:
                # Swallow cancelled requests
                pass

        # Committing to DB
        parsed_transactions = []
        for tx_sig in tx_sig_batch_records:
            parsed_transactions.append(tx_sig_futures_map[tx_sig])

        # Fetch metadata in parallel
        cid_metadata, blacklisted_cids = await self.fetch_cid_metadata(
            parsed_transactions
        )

        self.validate_and_save_parsed_tx_records(parsed_transactions, cid_metadata)

    @abstractmethod
    def validate_and_save_parsed_tx_records(self, parsed_transactions, cid_metadata):
        """
        Based parsed transaction information, generate and save appropriate database changes. This will vary based on the program being indexed
        @param parsed_transactions: Array of transaction signatures in order
        @param cid_metadata: Dictionary of remote metadata
        """
        raise Exception(BASE_ERROR)

    def get_transaction_batches_to_process(self):
        """
        Calculate the delta between database and chain tail and return an array of arrays containing transaction batches
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
            self.msg(f"{transactions_array}")
            if not transactions_array:
                # This is considered an 'intersection' since there are no further transactions to process but
                # really represents the end of known history for this ProgramId
                intersection_found = True
                self.msg(f"No transactions found before {last_tx_signature}")
            else:
                with self._db.scoped_session() as read_session:
                    for tx in transactions_array:
                        tx_sig = tx["signature"]
                        slot = tx["slot"]
                        if tx["slot"] > latest_processed_slot:
                            transaction_signature_batch.append(tx_sig)
                        elif tx["slot"] <= latest_processed_slot:
                            # Check the tx signature for any txs in the latest batch,
                            # and if not present in DB, add to processing
                            self.msg(
                                f"Latest slot re-traversal\
                                slot={slot}, sig={tx_sig},\
                                latest_processed_slot(db)={latest_processed_slot}"
                            )
                            exists = self.is_tx_in_db(read_session, tx_sig)
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
                        self.msg(
                            f"slicing tx_sigs from {len(transaction_signatures)} entries"
                        )
                        transaction_signatures = transaction_signatures[
                            -TX_SIGNATURES_RESIZE_LENGTH:
                        ]
                        self.msg(
                            f"sliced tx_sigs to {len(transaction_signatures)} entries"
                        )

                    # Reset batch state
                    transaction_signature_batch = []

            self.msg(
                f"intersection_found={intersection_found},\
                last_tx_signature={last_tx_signature},\
                page_count={page_count}"
            )
            page_count = page_count + 1

        transaction_signatures.reverse()
        return transaction_signatures
