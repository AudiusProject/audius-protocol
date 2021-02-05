import json
from src.monitors.database import \
    get_database_connection_info, \
    get_database_connections, \
    get_database_liveness, \
    get_database_size
from src.monitors.memory import \
    get_total_memory, \
    get_used_memory
from src.monitors.filesystem import \
    get_filesystem_size, \
    get_filesystem_used
from src.monitors.network import \
    get_received_bytes_per_sec, \
    get_transferred_bytes_per_sec
from src.monitors.redis import \
    get_redis_num_keys, \
    get_redis_used_memory, \
    get_redis_total_memory
from src.utils import redis_connection

redis = redis_connection.get_redis()


MONITORING_REDIS_PREFIX = 'monitoring'

"""
    List of all monitors to run, containing
    Args:
    name: string The name of the metric (used to key into redis )
    func: function The function to compute the metric. Takes in kwargs
        db = The singleton db instance
        redis = The singleton redis instance
    ttl: int (optional) TTL in seconds for how long a cached value is good for, min 60s
    type: int (optional) type that the value should be parsed to (default is str)
        Options are bool, int, float, str, json
"""

DATABASE_LIVENESS = {
    'name': 'database_liveness',
    'func': get_database_liveness,
    'type': 'bool'
}
DATABASE_SIZE = {
    'name': 'database_size',
    'func': get_database_size,
    'ttl': 60 * 2,
    'type': 'int'
}
DATABASE_CONNECTIONS = {
    'name': 'database_connections',
    'func': get_database_connections,
    'type': 'int'
}
DATABASE_CONNECTION_INFO = {
    'name': 'database_connection_info',
    'func': get_database_connection_info,
    'type': 'json'
}

TOTAL_MEMORY = {
    'name': 'total_memory',
    'func': get_total_memory,
    'ttl': 60 * 2,
    'type': 'int'

}
USED_MEMORY = {
    'name': 'used_memory',
    'func': get_used_memory,
    'ttl': 60 * 2,
    'type': 'int'
}

FILESYSTEM_SIZE = {
    'name': 'filesystem_size',
    'func': get_filesystem_size,
    'ttl': 60 * 5,
    'type': 'int'

}
FILESYSTEM_USED = {
    'name': 'filesystem_used',
    'func': get_filesystem_used,
    'ttl': 60 * 5,
    'type': 'int'
}

RECEIVED_BYTES_PER_SEC = {
    'name': 'received_bytes_per_sec',
    'func': get_received_bytes_per_sec,
    'type': 'float'
}

TRANSFERRED_BYTES_PER_SEC = {
    'name': 'transferred_bytes_per_sec',
    'func': get_transferred_bytes_per_sec,
    'type': 'float'
}

REDIS_NUM_KEYS = {
    'name': 'redis_num_keys',
    'func': get_redis_num_keys,
    'ttl': 60 * 5,
    'type': 'int'
}
REDIS_USED_MEMORY = {
    'name': 'redis_used_memory',
    'func': get_redis_used_memory,
    'ttl': 60 * 5,
    'type': 'int'
}
REDIS_TOTAL_MEMORY = {
    'name': 'redis_total_memory',
    'func': get_redis_total_memory,
    'ttl': 60 * 5,
    'type': 'int'
}

MONITORS = {
    'DATABASE_LIVENESS': DATABASE_LIVENESS,
    'DATABASE_SIZE': DATABASE_SIZE,
    'DATABASE_CONNECTIONS': DATABASE_CONNECTIONS,
    'DATABASE_CONNECTION_INFO': DATABASE_CONNECTION_INFO,
    'TOTAL_MEMORY': TOTAL_MEMORY,
    'USED_MEMORY': USED_MEMORY,
    'FILESYSTEM_SIZE': FILESYSTEM_SIZE,
    'FILESYSTEM_USED': FILESYSTEM_USED,
    'RECEIVED_BYTES_PER_SEC': RECEIVED_BYTES_PER_SEC,
    'TRANSFERRED_BYTES_PER_SEC': TRANSFERRED_BYTES_PER_SEC,
    'REDIS_NUM_KEYS': REDIS_NUM_KEYS,
    'REDIS_USED_MEMORY': REDIS_USED_MEMORY,
    'REDIS_TOTAL_MEMORY': REDIS_TOTAL_MEMORY
}

def get_monitor_redis_key(monitor):
    return f"{MONITORING_REDIS_PREFIX}:{monitor['name']}"

def parse_value(monitor, value):
    """
    Parses a string value into the corresponding type

    Args:
        monitor: dict The monitor dictionary qwith name, func, ttl, and type
        value: string The value to parse
    """
    try:
        if monitor['type'] == 'bool':
            return value == 'True'
        elif monitor['type'] == 'int':
            return int(value)
        elif monitor['type'] == 'float':
            return float(value)
        elif monitor['type'] == 'json':
            return json.loads(value)
        else: # string
            return str(value)
    except Exception as e:
        return str(value)


def get_monitors(monitors):
    """
    Gets monitor values

    Args:
        monitors: list(dict) The list of monitors to get values of
    """
    pipe = redis.pipeline()
    for monitor in monitors:
        key = get_monitor_redis_key(monitor)
        pipe.get(key)
    ret = {}
    results = pipe.execute()
    for i, result in enumerate(results):
        ret[monitors[i]['name']] = parse_value(monitors[i], result)
    return ret
