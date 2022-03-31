import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"


class IndexerBase(ABC):
    """
    Base indexer class - handles lock acquisition to guarantee single entrypoint
    """

    _label: str
    _lock_name: str
    _redis: Any

    @abstractmethod
    def __init__(self, label: str, redis: Any):
        self._label = label
        self._redis = redis
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

    def __init__(self, program_id: str, label: str, redis: Any):
        """
        Instantiate a SolanaProgramIndexer class
        @param program_id: Deployed program ID
        @param label: String label for this indexer instance
        @param redis: Redis client class
        """
        super().__init__(label, redis)
        self._redis = redis
        self._program_id = program_id
        self._redis_queue_cache_prefix = f"{self._label}-tx-cache-queue"

    @abstractmethod
    def identify(self):
        logger.info(f"{self._program_id}")

    @abstractmethod
    def get_tx_in_db(self, session: Any, tx_sig: str):
        """
        Return a boolean value indicating whether tx signature is found
        """
        raise Exception("Must be implemented in subclass")

    @abstractmethod
    def get_latest_slot(self, session: Any):
        """
        Return the highest slot for this indexer's associated entity -
        for example, track listens checks the Play table while the user
        bank indexer checks user_bank_txs
        """
        raise Exception(BASE_ERROR)


class AnchorDataIndexer(SolanaProgramIndexer):
    """
    Indexer for the audius user data layer
    """

    def identify(self):
        logger.error(f"AnchorDataIndexer : {self._program_id}")

    def get_tx_in_db(self, session: Any, tx_sig: str):
        return True

    def get_latest_slot(self, session: Any):
        return 10

    def process_index_task(self):
        self.msg("AnchorDataIndexer : processing indexing task")
