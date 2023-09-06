import json

from solders.rpc.responses import RpcConfirmedTransactionStatusWithSignature

from src.tasks.index_solana_plays import (
    REDIS_TX_CACHE_QUEUE_PREFIX,
    cache_traversed_tx,
    fetch_traversed_tx_from_cache,
)
from src.utils.redis_connection import get_redis

mock_tx_result_1 = RpcConfirmedTransactionStatusWithSignature.from_json(
    json.dumps(
        {
            "signature": "4NyCD5Ef5bsheuqXKFASJXPsiiss8ESqPg61bF5QNLBMYGshGbKTCfTAFjrxZYAH1JxZdY14kSeQG2b66Cis7vxj",
            "slot": 111753419,
            "blockTime": 1640126543,
            "confirmationStatus": "finalized",
            "err": None,
            "memo": None,
        }
    )
)
mock_tx_result_2 = RpcConfirmedTransactionStatusWithSignature.from_json(
    json.dumps(
        {
            "signature": "5211pasG9iDECHnNm4GCWH9xETWJYRk4cxWVcJQyqTJCFGbmmvki2oHyvHJL8MgppztYjXsXPyG4RXcMXuQRpBia",
            "slot": 111753419 + 100,
            "blockTime": 1640126543,
            "confirmationStatus": "finalized",
            "err": None,
            "memo": None,
        }
    )
)


# Confirm expected length of cache array
def assert_cache_array_length(redis, expected_length: int):
    cached_val_array = redis.lrange(REDIS_TX_CACHE_QUEUE_PREFIX, 0, 100)
    cached_val_length = len(cached_val_array)
    assert cached_val_length == expected_length


# Validate caching behavior


def test_cache_traversed_tx(app):
    with app.app_context():
        redis = get_redis()

    cache_traversed_tx(redis, mock_tx_result_1)
    assert_cache_array_length(redis, 1)
    cached_val_array = redis.lrange(REDIS_TX_CACHE_QUEUE_PREFIX, 0, 100)
    cached_first_entry = json.loads(cached_val_array[0])
    assert cached_first_entry == json.loads(mock_tx_result_1.to_json())


def test_fetch_traversed_tx_from_cache(app):
    with app.app_context():
        redis = get_redis()

    tx_slot = 111753419
    first_mock_tx = RpcConfirmedTransactionStatusWithSignature.from_json(
        json.dumps(
            {
                "signature": "4NyCD5Ef5bsheuqXKFASJXPsiiss8ESqPg61bF5QNLBMYGshGbKTCfTAFjrxZYAH1JxZdY14kSeQG2b66Cis7vxj",
                "slot": tx_slot,
                "blockTime": 1640126543,
                "confirmationStatus": "finalized",
                "err": None,
                "memo": None,
            }
        )
    )

    cache_traversed_tx(redis, first_mock_tx)
    # Confirm that if the latest db slot is greater than the cached value, it is removed from redis
    latest_db_slot = tx_slot + 10
    fetched_tx = fetch_traversed_tx_from_cache(redis, latest_db_slot)
    assert fetched_tx == None

    # Confirm the values have been removed from redis queue
    assert_cache_array_length(redis, 0)

    # Now, populate 2 entries into redis
    cache_traversed_tx(redis, first_mock_tx)
    cache_traversed_tx(redis, mock_tx_result_2)

    assert_cache_array_length(redis, 2)

    fetched_tx = fetch_traversed_tx_from_cache(redis, latest_db_slot)
    assert fetched_tx == mock_tx_result_2.signature

    # Confirm the values have been removed from redis queue
    assert_cache_array_length(redis, 0)
