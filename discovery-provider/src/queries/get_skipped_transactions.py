import logging
import redis
from src.models import SkippedTransaction, Block
from src.utils import helpers, db_session
from src.utils.config import shared_config
from src.utils.redis_cache import get_pickled_key, pickle_and_set

REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

INDEXING_ERROR_KEY = 'indexing:error'
logger = logging.getLogger(__name__)

# returns the recorded skipped transactions in the db during indexing
# filters by blocknumber, blockhash, or transaction hash if they are not null
def get_skipped_transactions(blocknumber, blockhash, transactionhash):
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
        if transactionhash is not None:
            skipped_transactions_query = skipped_transactions_query.filter(
                SkippedTransaction.transactionhash == transactionhash
            )
        skipped_transactions_results = skipped_transactions_query.all()
        skipped_transactions_list = list(map(
            helpers.model_to_dictionary,
            skipped_transactions_results
        ))
        return skipped_transactions_list

# returns the indexing transaction status
# given a blocknumber, blockhash, and transaction
# first checks whether there is an indexing error in entry
# and whether the entry matches the given params
# otherwise checks the database
def get_transaction_status(blocknumber, blockhash, transactionhash):
    indexing_error = getIndexingError(REDIS)

    # separating the conditions to reduce number of booleans in single condition (linting)
    if indexing_error:
        keys_exist = 'blocknumber' in indexing_error and \
            'blockhash' in indexing_error and \
            'transactionhash' in indexing_error
        if keys_exist and \
            indexing_error['blocknumber'] == blocknumber and \
            indexing_error['blockhash'] == blockhash and \
            indexing_error['transactionhash'] == transactionhash:
            return 'FAILED'

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        skipped_transactions_results = session.query(SkippedTransaction).filter(
            SkippedTransaction.blocknumber == blocknumber,
            SkippedTransaction.blockhash == blockhash,
            SkippedTransaction.transactionhash == transactionhash
        ).all()
        if len(skipped_transactions_results) > 1:
            raise Exception(
                "Expected no more than 1 row for skipped indexing transaction with \
                blocknumber={}, blockhash={}, transactionhash={}".format(
                    blocknumber, blockhash, transactionhash
                )
            )
        if len(skipped_transactions_results) == 1:
            return 'FAILED'

        block_transaction_results = session.query(Block).filter(
            Block.number == blocknumber,
            Block.blockhash == blockhash
        ).all()
        if len(block_transaction_results) > 1:
            raise Exception(
                "Expected no more than 1 row for blocknumber={}, blockhash={}".format(
                    blocknumber, blockhash
                )
            )
        if len(block_transaction_results) == 1:
            return 'PASSED'

        return 'NOT_FOUND'


def getIndexingError(redis_instance):
    indexing_error = get_pickled_key(redis_instance, INDEXING_ERROR_KEY)
    return indexing_error

def setIndexingError(redis_instance, blocknumber, blockhash, transactionhash, message, has_majority=False):
    indexing_error = get_pickled_key(redis_instance, INDEXING_ERROR_KEY)

    if indexing_error is None or (
            indexing_error['blocknumber'] != blocknumber and
            indexing_error['blockhash'] != blockhash and
            indexing_error['transactionhash'] != transactionhash
    ):
        indexing_error = {
            'count': 1,
            'blocknumber': blocknumber,
            'blockhash': blockhash,
            'transactionhash': transactionhash,
            'message': message,
            'has_majority': has_majority
        }
        pickle_and_set(redis_instance, INDEXING_ERROR_KEY, indexing_error)
    else:
        indexing_error['count'] += 1
        indexing_error['has_majority'] = has_majority
        pickle_and_set(redis_instance, INDEXING_ERROR_KEY, indexing_error)

def clearIndexingError(redis_instance):
    redis_instance.delete(INDEXING_ERROR_KEY)
