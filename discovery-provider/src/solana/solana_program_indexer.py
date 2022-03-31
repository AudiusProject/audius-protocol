import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

BASE_ERROR = "Must be implemented in subclass"


class SolanaProgramIndexer(ABC):
    """
    Generic indexer class for Solana programs
    """

    _program_id: str
    _label: str
    _redis_queue_cache_prefix: str
    _redis: Any

    def __init__(self, program_id: str, label: str, redis: Any):
        """
        Instantiate a SolanaProgramIndexer class
        @param program_id: Deployed program ID
        @param label: String label for this indexer instance
        @param redis: Redis client class
        """
        self._redis = redis
        self._program_id = program_id
        self._label = label
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

    def msg(self, msg: str):
        # DO NOT MERGE AS ERROR
        logger.error(f"{self._label} | {msg}")


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
