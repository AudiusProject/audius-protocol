from src.models.models import AssociatedWallet, User
import logging
import datetime
from sqlalchemy import or_
from typing import TypedDict, Any
from src.utils.helpers import redis_set_and_dump, redis_get_or_restore
from src.queries.get_balances import enqueue_balance_refresh

logger = logging.getLogger(__name__)

eth_indexing_last_scanned_block_key = "eth_indexing_last_scanned_block"


# the block number to start with if first time scanning
# this should be the first block during and after which $AUDIO transfer events started occurring
MIN_SCAN_START_BLOCK = 0


class TransferEvent(TypedDict):
    logIndex: int
    transactionHash: Any
    blockNumber: int
    args: Any


class EventScannerState:
    """Store the state of scanned blocks and all events in the database.

    All state is an in-memory dict.
    Simple load/store massive JSON on start up.
    """

    def __init__(self, db, redis):
        self.db = db
        self.redis = redis
        self.last_scanned_block = 0

    def restore(self):
        """Restore the last scan state from redis."""
        restored = redis_get_or_restore(self.redis, eth_indexing_last_scanned_block_key)
        self.last_scanned_block = int(restored) if restored else MIN_SCAN_START_BLOCK
        logger.info(f"Restored last scanned block ({self.last_scanned_block})")

    def save(self, block_number: int):
        """Save at the end of each chunk of blocks, so we can resume in the case of a crash or CTRL+C
        Next time the scanner is started we will resume from this block
        """
        self.last_scanned_block = block_number
        logger.info(f"Saving last scanned block ({self.last_scanned_block}) to redis")
        redis_set_and_dump(
            self.redis,
            eth_indexing_last_scanned_block_key,
            str(self.last_scanned_block),
        )

    def get_last_scanned_block(self) -> int:
        """The number of the last block we have stored."""
        return self.last_scanned_block

    def process_event(self, block_when: datetime.datetime, event: TransferEvent) -> str:
        """Record a ERC-20 transfer in our database."""
        # Events are keyed by their transaction hash and log index
        # One transaction may contain multiple events
        # and each one of those gets their own log index

        # event_name = event.event # "Transfer"
        log_index = event["logIndex"]  # Log index within the block
        # transaction_index = event.transactionIndex  # Transaction index within the block
        txhash = event["transactionHash"].hex()  # Transaction hash
        block_number = event["blockNumber"]

        # Convert ERC-20 Transfer event to our internal format
        args = event["args"]
        transfer = {
            "from": args["from"],
            "to": args["to"],
            "value": args["value"]
            / 1e18,  # divide by 10^18 to get correct transfer value
            "timestamp": block_when,
        }

        # add user ids from the transfer event into the balance refresh queue
        transfer_event_wallets = [transfer["from"].lower(), transfer["to"].lower()]
        with self.db.scoped_session() as session:
            result = (
                session.query(User.user_id)
                .outerjoin(AssociatedWallet, User.user_id == AssociatedWallet.user_id)
                .filter(User.is_current == True)
                .filter(AssociatedWallet.is_current == True)
                .filter(AssociatedWallet.is_delete == False)
                .filter(
                    or_(
                        User.wallet.in_(transfer_event_wallets),
                        AssociatedWallet.wallet.in_(transfer_event_wallets),
                    )
                )
                .all()
            )
            user_ids = [user_id for [user_id] in result]
            enqueue_balance_refresh(self.redis, user_ids)

        # Return a pointer that allows us to look up this event later if needed
        return f"{block_number}-{txhash}-{log_index}"
