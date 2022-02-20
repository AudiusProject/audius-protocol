from datetime import datetime, timedelta

INDEX_BLOCKS_SECONDS_REDIS_KEY = "index_blocks:seconds"


def record_index_blocks_seconds(redis, index_blocks_duration_seconds):
    """Records that a round of index_blocks took some number of seconds."""
    now = round(datetime.now().timestamp())
    redis.zadd(INDEX_BLOCKS_SECONDS_REDIS_KEY, now, index_blocks_duration_seconds)


def get_average_index_blocks_seconds_since(redis, seconds_ago):
    """From seconds ago until now, get the average seconds index_blocks took"""
    ago = round((datetime.now() - timedelta(seconds=seconds_ago)).timestamp())
    res = redis.zrange(
        INDEX_BLOCKS_SECONDS_REDIS_KEY,
        ago,
        -1,
        withscores=True,
    )
    seconds_per_block = map(res, lambda x: x[1])
    return sum(seconds_per_block) / len(seconds_per_block)


def sweep_old_index_blocks_seconds(redis, expire_after_days):
    """Sweep old records after `expire_after_days`"""
    timestamp = round((datetime.now() - timedelta(days=expire_after_days)).timestamp())
    redis.zremrangebyscore(INDEX_BLOCKS_SECONDS_REDIS_KEY, 0, timestamp)
