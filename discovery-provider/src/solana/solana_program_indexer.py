import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, TypedDict

from redis import Redis
from src.solana.anchor_parser import ParsedTxInstr
from src.solana.constants import (
    FETCH_TX_SIGNATURES_BATCH_SIZE,
    TX_SIGNATURES_MAX_BATCHES,
    TX_SIGNATURES_RESIZE_LENGTH,
    WRITE_TX_SIGNATURES_BATCH_SIZE,
)
from src.solana.solana_client_manager import SolanaClientManager
from src.solana.solana_transaction_types import TransactionInfoResult
from src.utils.session_manager import SessionManager

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"

TX_SIGNATURES_PROCESSING_SIZE = 100
PARSE_TX_TIMEOUT = 1000


class ParsedTxMetadata(TypedDict):
    instruction: List[ParsedTxInstr]


class ParsedTx(TypedDict):
    tx_sig: str
    tx_metadata: List[ParsedTxMetadata]
    result: TransactionInfoResult


class IndexerBase(ABC):
    """
    Base indexer class - handles lock acquisition to guarantee single entrypoint
    """

    _label: str
    _lock_name: str
    _redis: Redis
    _db: SessionManager

    @abstractmethod
    def __init__(self, label: str, redis: Redis, db: SessionManager):
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
    _solana_client_manager: SolanaClientManager

    def __init__(
        self,
        program_id: str,
        label: str,
        redis: Redis,
        db: SessionManager,
        solana_client_manager: SolanaClientManager,
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
    async def parse_tx(self, tx_sig: str):
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
    def fetch_cid_metadata(self, parsed_transactions: List[Any]):
        """
        Fetch all metadata objects in parallel (if required). Certain indexing tasks will not require this step and can skip appropriately
        @param parsed_transactions: Array of transactions containing deserialized information, ideally pointing to a metadata object
        """
        return {}

    async def process_txs_batch(self, tx_sig_batch_records: List[str]):
        self.msg(f"Parsing {tx_sig_batch_records}")
        futures = []
        tx_sig_futures_map: Dict[str, ParsedTx] = {}
        for tx_sig in tx_sig_batch_records:
            future: asyncio.Future = asyncio.ensure_future(self.parse_tx(tx_sig))
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
        parsed_transactions: List[ParsedTx] = []
        for tx_sig in tx_sig_batch_records:
            parsed_transactions.append(tx_sig_futures_map[tx_sig])

        # Reverse parsed transactions so oldest is first
        parsed_transactions.reverse()

        # Fetch metadata in parallel
        cid_metadata = await self.fetch_cid_metadata(parsed_transactions)

        self.validate_and_save_parsed_tx_records(parsed_transactions, cid_metadata)

    @abstractmethod
    def validate_and_save_parsed_tx_records(
        self, parsed_transactions: List[Any], metadata_dictionary: Dict
    ):
        """
        Based parsed transaction information, generate and save appropriate database changes. This will vary based on the program being indexed
        @param parsed_transactions: Array of transaction signatures in order
        @param cid_metadata: Dictionary of remote metadata
        """
        raise Exception(BASE_ERROR)

    def get_transaction_batches_to_process(self) -> List[List[str]]:
        """
        Calculate the delta between database and chain tail and return an array of arrays containing transaction batches
        """
        latest_processed_slot = self.get_latest_slot()
        # The 'before' value from where we start querying transactions
        # TODO: Add cache
        last_tx_signature = None

        # Loop exit condition
        intersection_found = False

        # List of signatures to be processed
        unindexed_transactions = []

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
                    limit=FETCH_TX_SIGNATURES_BATCH_SIZE,
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
                        if tx["slot"] > latest_processed_slot:
                            unindexed_transactions.append(tx)
                        else:
                            # Add any txs that haven't been indexed yet
                            # Check the tx signature for any txs in the latest batch,
                            # and if not present in DB, add to processing
                            self.msg(
                                f"Latest slot re-traversal\
                                slot={tx['slot']}, sig={tx['signature']},\
                                latest_processed_slot(db)={latest_processed_slot}"
                            )
                            exists = self.is_tx_in_db(read_session, tx["signature"])
                            if exists:
                                # Exit loop and set terminal condition since this tx has been found in DB
                                # Transactions are returned with most recently committed first, so we can assume
                                # subsequent transactions in this batch have already been processed
                                intersection_found = True
                                break
                            # Otherwise, ensure this transaction is still processed
                            unindexed_transactions.append(tx)
                # Restart processing at the end of this transaction signature batch
                if unindexed_transactions:
                    last_tx = unindexed_transactions[-1]
                    last_tx_signature = last_tx["signature"]

                # TODO: Add Caching
                # Append to recently seen cache
                # cache_traversed_tx(redis, last_tx)

                self.msg(
                    f"intersection_found={intersection_found},\
                    last_tx_signature={last_tx_signature},\
                    page_count={page_count}"
                )
                page_count = page_count + 1

        if len(unindexed_transactions) <= FETCH_TX_SIGNATURES_BATCH_SIZE:
            # Transaction batch is less than the max batch size so all slots are complete
            return [list(map(lambda tx: tx["signature"], unindexed_transactions))]

        # Batch transactions to be indexed together
        transaction_signature_batches = []
        transaction_signature_batch = [unindexed_transactions[0]["signature"]]
        for i in range(1, len(unindexed_transactions)):
            # Ensure txs with the same slot are batched together
            if (
                len(transaction_signature_batch) >= WRITE_TX_SIGNATURES_BATCH_SIZE
                and unindexed_transactions[i - 1]["slot"]
                != unindexed_transactions[i]["slot"]
            ):
                transaction_signature_batches.append(transaction_signature_batch)
                transaction_signature_batch = []

            transaction_signature_batch.append(unindexed_transactions[i]["signature"])

        if transaction_signature_batch:
            transaction_signature_batches.append(transaction_signature_batch)

        # Ensure processing does not grow unbounded
        if len(transaction_signature_batches) > TX_SIGNATURES_MAX_BATCHES:
            self.msg(
                f"slicing tx_sigs from {len(transaction_signature_batches)} entries"
            )
            transaction_signature_batches = transaction_signature_batches[
                -TX_SIGNATURES_RESIZE_LENGTH:
            ]
            self.msg(f"sliced tx_sigs to {len(transaction_signature_batches)} entries")

        # sort oldest signatures first
        transaction_signature_batches.reverse()
        return transaction_signature_batches
