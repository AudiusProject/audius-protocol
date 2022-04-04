"""
Interface for using a redis connection
"""

from redis import Redis
from src.utils.config import shared_config

redis_url = shared_config["redis"]["url"]
redis = Redis.from_url(url=redis_url)


def get_redis():
    return redis
