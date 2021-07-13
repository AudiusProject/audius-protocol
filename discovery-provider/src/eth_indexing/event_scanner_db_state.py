from src.models.models import AssociatedWallet, EthTransferEvent, User
import time
import logging
import datetime
from sqlalchemy import desc, or_
from typing import TypedDict, Any
from src.eth_indexing.event_scanner_state import EventScannerState
from src.utils.helpers import redis_set_and_dump, redis_get_or_restore
from src.queries.get_balances import enqueue_balance_refresh

logger = logging.getLogger(__name__)

eth_indexing_last_scanned_block_key = "eth_indexing_last_scanned_block"

# Number of seconds to wait before saving the events to database
MIN_SECONDS_SINCE_LAST_SAVE = 60


class TransferEvent(TypedDict):
    logIndex: int
    transactionHash: Any
    blockNumber: int
    args: Any


class EventScannerDBState(EventScannerState):
    """Store the state of scanned blocks and all events in the database.

    All state is an in-memory dict.
    Simple load/store massive JSON on start up.
    """

    def __init__(self, db, redis):
        self.db = db
        self.redis = redis
        self.blocks = dict()
        self.last_scanned_block = 0
        self.seconds_since_last_save = 0

    def restore(self):
        """Restore the last scan state from redis."""
        restored = redis_get_or_restore(self.redis, eth_indexing_last_scanned_block_key)

        # if not in redis, get from DB
        # should we always get from DB?
        if not restored:
            with self.db.scoped_session() as session:
                restored = (
                    session.query(EthTransferEvent.blocknumber)
                    .order_by(desc("blocknumber"))
                    .first()
                )

        self.last_scanned_block = int(restored) if restored else 0
        logger.info(f"Restored last scanned block ({self.last_scanned_block})")

    def save(self):
        """Save scanned transfer events to db."""
        transfer_events = []
        for blocknumber, block_info in self.blocks.items():
            for txhash, tx_info in block_info.items():
                for logindex, transfer in tx_info.items():
                    transfer_events.append(
                        EthTransferEvent(
                            blocknumber=blocknumber,
                            txhash=txhash,
                            logindex=logindex,
                            tx_from=transfer["from"],
                            tx_to=transfer["to"],
                            tx_timestamp=transfer["timestamp"],
                            value=transfer["value"],
                        )
                    )

        if transfer_events:
            with self.db.scoped_session() as session:
                logger.info(
                    f"Saving {len(transfer_events)} scanned eth transfer events to database"
                )
                session.bulk_save_objects(transfer_events)

        """Save last scanned block to redis."""
        logger.info(f"Saving last scanned block ({self.last_scanned_block}) to redis")
        redis_set_and_dump(
            self.redis,
            eth_indexing_last_scanned_block_key,
            str(self.last_scanned_block),
        )

        # reset state blocks and seconds since last save
        self.blocks = dict()
        self.seconds_since_last_save = time.time()

    def get_last_scanned_block(self) -> int:
        """The number of the last block we have stored."""
        return self.last_scanned_block

    def delete_potentially_forked_data(self, since_block):
        """Remove potentially reorganised blocks from the scan data."""
        # delete eth blocks from db using block_num and self.last_scanned_block in the query filter
        pass

    def start_chunk(self, block_number: int, chunk_size: int):
        pass

    def end_chunk(self, block_number: int):
        """Save at the end of each block, so we can resume in the case of a crash or CTRL+C"""
        # Next time the scanner is started we will resume from this block
        self.last_scanned_block = block_number

        if time.time() - self.seconds_since_last_save >= MIN_SECONDS_SINCE_LAST_SAVE:
            self.save()

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
        # SHOULD WE ALSO INCLUDE BLOCKHASH HERE?

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
            logger.info(f"Enqueuing user ids {user_ids} for balance refresh")
            enqueue_balance_refresh(self.redis, user_ids)

        # Create empty dict as the block that contains all transactions by txhash
        if block_number not in self.blocks:
            self.blocks[block_number] = {}

        block = self.blocks[block_number]
        if txhash not in block:
            # We have not yet recorded any transfers in this transaction
            # (One transaction may contain multiple events if executed by a smart contract).
            # Create a tx entry that contains all events by a log index
            self.blocks[block_number][txhash] = {}

        # Record ERC-20 transfer in our database
        self.blocks[block_number][txhash][log_index] = transfer

        # Return a pointer that allows us to look up this event later if needed
        return f"{block_number}-{txhash}-{log_index}"
