import logging

from sqlalchemy import func

from src.models.indexing.block import Block
from src.models.indexing.skipped_transaction import SkippedTransaction
from src.utils import db_session, helpers
from src.utils.redis_cache import get_json_cached_key, set_json_cached_key
from src.utils.redis_connection import get_redis

# The maximum number of skipped transactions allowed
MAX_SKIPPED_TX = 20

REDIS = get_redis()

INDEXING_ERROR_KEY = "indexing:error"
logger = logging.getLogger(__name__)


# returns the recorded skipped transactions in the db during indexing
# filters by blocknumber, blockhash, or transaction hash if they are not null
def get_skipped_transactions(blocknumber, blockhash, txhash):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        skipped_transactions_query = session.query(SkippedTransaction)
        if blocknumber is not None:
            skipped_transactions_query = skipped_transactions_query.filter(
                SkippedTransaction.blocknumber == blocknumber
            )
        if blockhash is not None:
            skipped_transactions_query = skipped_transactions_query.filter(
                SkippedTransaction.blockhash == blockhash
            )
        if txhash is not None:
            skipped_transactions_query = skipped_transactions_query.filter(
                SkippedTransaction.txhash == txhash
            )
        skipped_transactions_results = skipped_transactions_query.all()
        skipped_transactions_list = list(
            map(helpers.model_to_dictionary, skipped_transactions_results)
        )
        return skipped_transactions_list


def get_transaction_status(blocknumber, blockhash, txhash):
    """Gets the indexing transaction status: 'PASSED', 'FAILED', or 'NOT_FOUND'
    given a blocknumber, blockhash, and transaction
    first checks whether there is an indexing error in redis
    and whether the entry matches the given params
    otherwise checks the skipped_transactions in the database
    """
    indexing_error = get_indexing_error(REDIS)

    if indexing_error:
        blocknumber_match = (
            "blocknumber" in indexing_error
            and indexing_error["blocknumber"] == blocknumber
        )
        blockhash_match = (
            "blockhash" in indexing_error and indexing_error["blockhash"] == blockhash
        )
        txhash_match = "txhash" in indexing_error and indexing_error["txhash"] == txhash
        if blocknumber_match and blockhash_match and txhash_match:
            return "FAILED"

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        skipped_transactions_results = (
            session.query(SkippedTransaction)
            .filter(
                SkippedTransaction.blocknumber == blocknumber,
                SkippedTransaction.blockhash == blockhash,
                SkippedTransaction.txhash == txhash,
            )
            .all()
        )
        if len(skipped_transactions_results) > 1:
            raise Exception(
                f"Expected no more than 1 row for skipped indexing transaction with \
                blocknumber={blocknumber}, blockhash={blockhash}, txhash={txhash}"
            )
        if len(skipped_transactions_results) == 1:
            return "FAILED"

        block_transaction_results = (
            session.query(Block)
            .filter(Block.number == blocknumber, Block.blockhash == blockhash)
            .all()
        )
        if len(block_transaction_results) > 1:
            raise Exception(
                f"Expected no more than 1 row for blocknumber={blocknumber}, blockhash={blockhash}"
            )
        if len(block_transaction_results) == 1:
            return "PASSED"

        return "NOT_FOUND"


def get_indexing_error(redis_instance):
    indexing_error = get_json_cached_key(redis_instance, INDEXING_ERROR_KEY)
    return indexing_error


def set_indexing_error(
    redis_instance, blocknumber, blockhash, txhash, message, has_consensus=False
):
    indexing_error = get_json_cached_key(redis_instance, INDEXING_ERROR_KEY)

    if indexing_error is None or (
        indexing_error["blocknumber"] != blocknumber
        or indexing_error["blockhash"] != blockhash
        or indexing_error["txhash"] != txhash
    ):
        indexing_error = {
            "count": 1,
            "blocknumber": blocknumber,
            "blockhash": blockhash,
            "txhash": txhash,
            "message": message,
            "has_consensus": has_consensus,
        }
        set_json_cached_key(redis_instance, INDEXING_ERROR_KEY, indexing_error)
    else:
        indexing_error["count"] += 1
        indexing_error["has_consensus"] = has_consensus
        set_json_cached_key(redis_instance, INDEXING_ERROR_KEY, indexing_error)


def clear_indexing_error(redis_instance):
    redis_instance.delete(INDEXING_ERROR_KEY)


def save_and_get_skip_tx_hash(session, redis):
    """Fetch if there is a tx_hash to be skipped because of continuous errors"""
    indexing_error = get_indexing_error(redis)
    if (
        isinstance(indexing_error, dict)
        and "has_consensus" in indexing_error
        and indexing_error["has_consensus"]
    ):
        num_skipped_tx = session.query(func.count(SkippedTransaction.id)).scalar()
        if num_skipped_tx >= MAX_SKIPPED_TX:
            return None
        skipped_tx = SkippedTransaction(
            blocknumber=indexing_error["blocknumber"],
            blockhash=indexing_error["blockhash"],
            txhash=indexing_error["txhash"],
        )
        session.add(skipped_tx)
        return indexing_error["txhash"]
