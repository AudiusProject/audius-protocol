import psutil


def get_redis_num_keys(**kwargs):
    redis = kwargs['redis']
    num_keys = redis.dbsize()
    return num_keys


def get_redis_used_memory(**kwargs):
    redis = kwargs['redis']
    info = redis.info()
    return info['used_memory']


def get_redis_total_memory(**kwargs):
    # The version of redis used does not support total_system_memory
    # redis = kwargs['redis']
    # info = redis.info()
    # return info['total_system_memory']
    mem = psutil.virtual_memory()
    return mem.total
