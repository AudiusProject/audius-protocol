import json
from src.monitors import monitor_names
from src.monitors.database import (
    get_database_connection_info,
    get_database_connections,
    get_database_liveness,
    get_database_size,
    get_database_index_count,
    get_database_index_info,
    get_table_size_info,
    get_frequent_queries,
    get_slow_queries,
)
from src.monitors.memory import get_total_memory, get_used_memory
from src.monitors.filesystem import get_filesystem_size, get_filesystem_used
from src.monitors.network import (
    get_received_bytes_per_sec,
    get_transferred_bytes_per_sec,
)
from src.monitors.redis import (
    get_redis_num_keys,
    get_redis_used_memory,
    get_redis_total_memory,
)
from src.utils import redis_connection

redis = redis_connection.get_redis()


MONITORING_REDIS_PREFIX = "monitoring"

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
    monitor_names.name: monitor_names.database_liveness,
    monitor_names.func: get_database_liveness,
    monitor_names.type: "bool",
}
DATABASE_SIZE = {
    monitor_names.name: monitor_names.database_size,
    monitor_names.func: get_database_size,
    monitor_names.ttl: 60 * 2,
    monitor_names.type: "int",
}
DATABASE_CONNECTIONS = {
    monitor_names.name: monitor_names.database_connections,
    monitor_names.func: get_database_connections,
    monitor_names.type: "int",
}
DATABASE_CONNECTION_INFO = {
    monitor_names.name: monitor_names.database_connection_info,
    monitor_names.func: get_database_connection_info,
    monitor_names.type: "json",
}

DATABASE_INDEX_COUNT = {
    monitor_names.name: monitor_names.database_index_count,
    monitor_names.func: get_database_index_count,
    monitor_names.ttl: 60 * 60 * 6,  # six hours
    monitor_names.type: "int",
}

DATABASE_INDEX_INFO = {
    monitor_names.name: monitor_names.database_index_info,
    monitor_names.func: get_database_index_info,
    monitor_names.ttl: 60 * 60 * 6,  # six hours
    monitor_names.type: "json",
}

TABLE_SIZE_INFO = {
    monitor_names.name: monitor_names.table_size_info,
    monitor_names.func: get_table_size_info,
    monitor_names.type: "json",
}

FREQUENT_QUERIES = {
    monitor_names.name: monitor_names.frequent_queries,
    monitor_names.func: get_frequent_queries,
    monitor_names.type: "json",
}

SLOW_QUERIES = {
    monitor_names.name: monitor_names.slow_queries,
    monitor_names.func: get_slow_queries,
    monitor_names.type: "json",
}

TOTAL_MEMORY = {
    monitor_names.name: monitor_names.total_memory,
    monitor_names.func: get_total_memory,
    monitor_names.ttl: 60 * 2,
    monitor_names.type: "int",
}
USED_MEMORY = {
    monitor_names.name: monitor_names.used_memory,
    monitor_names.func: get_used_memory,
    monitor_names.ttl: 60 * 2,
    monitor_names.type: "int",
}

FILESYSTEM_SIZE = {
    monitor_names.name: monitor_names.filesystem_size,
    monitor_names.func: get_filesystem_size,
    monitor_names.ttl: 60 * 5,
    monitor_names.type: "int",
}
FILESYSTEM_USED = {
    monitor_names.name: monitor_names.filesystem_used,
    monitor_names.func: get_filesystem_used,
    monitor_names.ttl: 60 * 5,
    monitor_names.type: "int",
}

RECEIVED_BYTES_PER_SEC = {
    monitor_names.name: monitor_names.received_bytes_per_sec,
    monitor_names.func: get_received_bytes_per_sec,
    monitor_names.type: "float",
}

TRANSFERRED_BYTES_PER_SEC = {
    monitor_names.name: monitor_names.transferred_bytes_per_sec,
    monitor_names.func: get_transferred_bytes_per_sec,
    monitor_names.type: "float",
}

REDIS_NUM_KEYS = {
    monitor_names.name: monitor_names.redis_num_keys,
    monitor_names.func: get_redis_num_keys,
    monitor_names.ttl: 60 * 5,
    monitor_names.type: "int",
}
REDIS_USED_MEMORY = {
    monitor_names.name: monitor_names.redis_used_memory,
    monitor_names.func: get_redis_used_memory,
    monitor_names.ttl: 60 * 5,
    monitor_names.type: "int",
}
REDIS_TOTAL_MEMORY = {
    monitor_names.name: monitor_names.redis_total_memory,
    monitor_names.func: get_redis_total_memory,
    monitor_names.ttl: 60 * 5,
    monitor_names.type: "int",
}

MONITORS = {
    monitor_names.database_liveness: DATABASE_LIVENESS,
    monitor_names.database_size: DATABASE_SIZE,
    monitor_names.database_connections: DATABASE_CONNECTIONS,
    monitor_names.database_connection_info: DATABASE_CONNECTION_INFO,
    monitor_names.database_index_count: DATABASE_INDEX_COUNT,
    monitor_names.database_index_info: DATABASE_INDEX_INFO,
    monitor_names.table_size_info: TABLE_SIZE_INFO,
    monitor_names.frequent_queries: FREQUENT_QUERIES,
    monitor_names.slow_queries: SLOW_QUERIES,
    monitor_names.total_memory: TOTAL_MEMORY,
    monitor_names.used_memory: USED_MEMORY,
    monitor_names.filesystem_size: FILESYSTEM_SIZE,
    monitor_names.filesystem_used: FILESYSTEM_USED,
    monitor_names.received_bytes_per_sec: RECEIVED_BYTES_PER_SEC,
    monitor_names.transferred_bytes_per_sec: TRANSFERRED_BYTES_PER_SEC,
    monitor_names.redis_num_keys: REDIS_NUM_KEYS,
    monitor_names.redis_used_memory: REDIS_USED_MEMORY,
    monitor_names.redis_total_memory: REDIS_TOTAL_MEMORY,
}


def get_monitor_redis_key(monitor):
    return f"{MONITORING_REDIS_PREFIX}:{monitor[monitor_names.name]}"


# pylint: disable=R0911
def parse_value(monitor, value):
    """
    Parses a string value into the corresponding type

    Args:
        monitor: dict The monitor dictionary qwith name, func, ttl, and type
        value: string The value to parse
    """
    try:
        if str(value) == "None":
            return None
        # pylint: disable=R1705
        if monitor[monitor_names.type] == "bool":
            return value == "True"
        elif monitor[monitor_names.type] == "int":
            return int(value)
        elif monitor[monitor_names.type] == "float":
            return float(value)
        elif monitor[monitor_names.type] == "json":
            return json.loads(value)
        else:  # string
            return str(value)
    except Exception:
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
        ret[monitors[i][monitor_names.name]] = parse_value(monitors[i], result)
    return ret
