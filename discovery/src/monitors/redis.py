import psutil


def get_redis_num_keys(**kwargs):
    """
    Gets the total number of keys

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    redis = kwargs["redis"]
    num_keys = redis.dbsize()
    return num_keys


def get_redis_used_memory(**kwargs):
    """
    Gets the total memory used by redis

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    redis = kwargs["redis"]
    info = redis.info()
    return info["used_memory"]


def get_redis_total_memory(**kwargs):
    """
    Gets the total memory available to redis

    Kwargs:
        db: global database instance
        redis: global redis instance
    """
    # The current version of redis used does not
    # support `total_system_memory`.
    #
    # Future versions of redis (> 3.2) add support
    # TODO: change this code to the following after upgrading.
    # redis = kwargs['redis']
    # info = redis.info()
    # return info['total_system_memory']
    #
    mem = psutil.virtual_memory()
    return mem.total
