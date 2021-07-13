import datetime
from abc import ABC, abstractmethod
from web3.datastructures import AttributeDict


class EventScannerState(ABC):
    """Application state that remembers what blocks we have scanned in the case of crash."""

    @abstractmethod
    def get_last_scanned_block(self) -> int:
        """Number of the last block we have scanned on the previous cycle.

        :return: 0 if no blocks scanned yet
        """

    @abstractmethod
    def start_chunk(self, block_number: int, chunk_size: int):
        """Scanner is about to ask data of multiple blocks over JSON-RPC.

        Start a database session if needed.
        """

    @abstractmethod
    def end_chunk(self, block_number: int):
        """Scanner finished a number of blocks."""

    @abstractmethod
    def restore(self):
        """Restore data previously set."""

    @abstractmethod
    def save(self):
        """Persist state data."""

    @abstractmethod
    def process_event(
        self, block_when: datetime.datetime, event: AttributeDict
    ) -> object:
        """Process incoming events.

        This function takes raw events from Web3, transforms them to your application internal
        format, then saves them in a database or some other state.

        :param block_when: When this block was mined

        :param event: Symbolic dictionary of the event data

        :return: Internal state structure that is the result of event tranformation.
        """

    @abstractmethod
    def delete_potentially_forked_data(self, since_block: int) -> int:
        """Delete any data since this block was scanned.

        Purges any potential minor reorg data.
        """
