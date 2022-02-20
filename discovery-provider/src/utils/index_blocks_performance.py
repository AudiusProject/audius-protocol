from datetime import datetime, timedelta

INDEX_BLOCKS_SECONDS_REDIS_KEY = "index_blocks:ms"


def record_index_blocks_ms(redis, index_blocks_duration_ms):
    """Records that a round of index_blocks took some number of ms"""
    now = round(datetime.now().timestamp())
    # Key as ms:date, value as date so that we can sort by range (on values)
    # Zset lets you only query by ranges of the value.
    redis.zadd(
        INDEX_BLOCKS_SECONDS_REDIS_KEY, {f"{index_blocks_duration_ms}:{now}": now}
    )


def get_average_index_blocks_ms_since(redis, seconds_ago):
    """From seconds ago until now, get the average ms index_blocks took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrangebyscore(INDEX_BLOCKS_SECONDS_REDIS_KEY, ago, "+inf")
    ms_per_block = list(map(lambda x: int(x.decode("utf-8").split(":")[0]), res))
    if len(ms_per_block) > 0:
        return sum(ms_per_block) / len(ms_per_block)
    return None


def sweep_old_index_blocks_ms(redis, expire_after_days):
    """Sweep old records after `expire_after_days`"""
    timestamp = round((datetime.now() - timedelta(days=expire_after_days)).timestamp())
    redis.zremrangebyscore(INDEX_BLOCKS_SECONDS_REDIS_KEY, 0, timestamp)
