import redis

from src.utils.config import shared_config
from src.queries.get_skipped_transactions import set_indexing_error, get_indexing_error

REDIS_URL = shared_config["redis"]["url"]


def test_get_and_set_indexing_error(app):
    """Tests settings and getting the indexing error"""

    redis_conn = redis.Redis.from_url(url=REDIS_URL)

    blocknumber = 12
    blockhash = "0x123"
    transactionhash = "0x456"
    message = "things are broken"
    set_indexing_error(
        redis_conn, blocknumber, blockhash, transactionhash, message, True
    )
    err = get_indexing_error(redis_conn)

    assert err["count"] == 1
    assert err["blocknumber"] == blocknumber
    assert err["blockhash"] == blockhash
    assert err["txhash"] == transactionhash
    assert err["message"] == message

    # If set again, raise the count
    set_indexing_error(
        redis_conn, blocknumber, blockhash, transactionhash, message, True
    )
    err = get_indexing_error(redis_conn)

    assert err["count"] == 2

    # If set with a different param, the count should be set to 1
    set_indexing_error(redis_conn, blocknumber, "0x124", transactionhash, message, True)
    err = get_indexing_error(redis_conn)

    assert err["count"] == 1
    assert err["blocknumber"] == blocknumber
    assert err["blockhash"] == "0x124"
    assert err["txhash"] == transactionhash
    assert err["message"] == message
