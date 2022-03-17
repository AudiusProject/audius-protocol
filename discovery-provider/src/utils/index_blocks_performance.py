import math
from datetime import datetime, timedelta

INDEX_BLOCKS_SECONDS_REDIS_KEY = "index_blocks:ms"
FETCH_IPFS_METADATA_SECONDS_REDIS_KEY = "fetch_ipfs_metadata:ms"
ADD_INDEXED_BLOCK_TO_DB_SECONDS_REDIS_KEY = "add_indexed_block_to_db:ms"


def mean(arr):
    """Returns mean of arr"""
    return sum(arr) / len(arr) if arr else None


def percentile(arr, percent):
    """Returns `percent`th percentile of arr"""
    arr = sorted(arr)
    if not arr:
        return None
    k = (len(arr) - 1) * percent
    lower, upper = math.floor(k), math.ceil(k)
    if lower == upper:
        return arr[lower]
    return (arr[lower] * (k - lower)) + (arr[upper] * (upper - k))


def record_index_blocks_ms(redis, index_blocks_duration_ms):
    """Records that a round of index_blocks took some number of ms"""
    now = round(datetime.now().timestamp())
    # Key as ms:date, value as date so that we can sort by range (on values)
    # Zset lets you only query by ranges of the value.
    redis.zadd(
        INDEX_BLOCKS_SECONDS_REDIS_KEY, {f"{index_blocks_duration_ms}:{now}": now}
    )


def record_fetch_ipfs_metadata_ms(redis, fetch_ipfs_metadata_duration_ms):
    """Records that fetch_ipfs_metadata took some number of ms"""
    now = round(datetime.now().timestamp())
    # Key as ms:date, value as date so that we can sort by range (on values)
    # Zset lets you only query by ranges of the value.
    redis.zadd(
        FETCH_IPFS_METADATA_SECONDS_REDIS_KEY,
        {f"{fetch_ipfs_metadata_duration_ms}:{now}": now},
    )


def record_add_indexed_block_to_db_ms(redis, add_indexed_block_to_db_duration_ms):
    """Records that add_indexed_block_to_db took some number of ms"""
    now = round(datetime.now().timestamp())
    # Key as ms:date, value as date so that we can sort by range (on values)
    # Zset lets you only query by ranges of the value.
    redis.zadd(
        ADD_INDEXED_BLOCK_TO_DB_SECONDS_REDIS_KEY,
        {f"{add_indexed_block_to_db_duration_ms}:{now}": now},
    )


def get_index_blocks_ms_stats_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms index_blocks took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(INDEX_BLOCKS_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    return {
        "mean": mean(ms_per_block),
        "median": percentile(ms_per_block, 0.5),
        "p95": percentile(ms_per_block, 0.95),
        "p99": percentile(ms_per_block, 0.99),
    }


def get_fetch_ipfs_metadata_ms_stats_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms fetch_ipfs_metadata took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(FETCH_IPFS_METADATA_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    return {
        "mean": mean(ms_per_block),
        "median": percentile(ms_per_block, 0.5),
        "p95": percentile(ms_per_block, 0.95),
        "p99": percentile(ms_per_block, 0.99),
    }


def get_add_indexed_block_to_db_ms_stats_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms add_indexed_block_to_db took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(ADD_INDEXED_BLOCK_TO_DB_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    return {
        "mean": mean(ms_per_block),
        "median": percentile(ms_per_block, 0.5),
        "p95": percentile(ms_per_block, 0.95),
        "p99": percentile(ms_per_block, 0.99),
    }


def get_average_fetch_ipfs_metadata_ms_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms fetch_ipfs_metadata took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(FETCH_IPFS_METADATA_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    if len(ms_per_block) > 0:
        return sum(ms_per_block) / len(ms_per_block)
    return None


def get_average_add_indexed_block_to_db_ms_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms add_indexed_block_to_db took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(ADD_INDEXED_BLOCK_TO_DB_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    if len(ms_per_block) > 0:
        return sum(ms_per_block) / len(ms_per_block)
    return None


def sweep_old_index_blocks_ms(redis, expire_after_days):
    """Sweep old records for index block ms after `expire_after_days`"""
    timestamp = round((datetime.now() - timedelta(days=expire_after_days)).timestamp())
    redis.zremrangebyscore(INDEX_BLOCKS_SECONDS_REDIS_KEY, 0, timestamp)


def sweep_old_fetch_ipfs_metadata_ms(redis, expire_after_days):
    """Sweep old records for fetch ipfs metadata ms after `expire_after_days`"""
    timestamp = round((datetime.now() - timedelta(days=expire_after_days)).timestamp())
    redis.zremrangebyscore(FETCH_IPFS_METADATA_SECONDS_REDIS_KEY, 0, timestamp)


def sweep_old_add_indexed_block_to_db_ms(redis, expire_after_days):
    """Sweep old records for add indexed block to db ms after `expire_after_days`"""
    timestamp = round((datetime.now() - timedelta(days=expire_after_days)).timestamp())
    redis.zremrangebyscore(ADD_INDEXED_BLOCK_TO_DB_SECONDS_REDIS_KEY, 0, timestamp)
