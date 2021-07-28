import logging
import os
import time
from typing import Dict, Optional, Tuple, TypedDict, cast

from src.models import Block, IPLDBlacklistBlock
from src.monitors import monitors, monitor_names
from src.utils import helpers, redis_connection, web3_provider, db_session
from src.utils.config import shared_config
from src.utils.redis_constants import (
    latest_block_redis_key,
    latest_block_hash_redis_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
    most_recent_indexed_ipld_block_redis_key,
    most_recent_indexed_ipld_block_hash_redis_key,
    trending_tracks_last_completion_redis_key,
    trending_playlists_last_completion_redis_key,
    challenges_last_processed_event_redis_key,
    user_balances_refresh_last_completion_redis_key,
    index_eth_last_completion_redis_key,
)
from src.queries.get_balances import (
    LAZY_REFRESH_REDIS_PREFIX,
    IMMEDIATE_REFRESH_REDIS_PREFIX,
)
from src.utils.helpers import redis_get_or_restore
from src.eth_indexing.event_scanner import eth_indexing_last_scanned_block_key

logger = logging.getLogger(__name__)
MONITORS = monitors.MONITORS
number_of_cpus = os.cpu_count()

disc_prov_version = helpers.get_discovery_provider_version()

default_healthy_block_diff = int(shared_config["discprov"]["healthy_block_diff"])
default_indexing_interval_seconds = int(
    shared_config["discprov"]["block_processing_interval_sec"]
)

# min system requirement values
min_number_of_cpus: int = 8  # 8 cpu
min_total_memory: int = 15500000000  # 15.5 GB of RAM
min_filesystem_size: int = 240000000000  # 240 GB of file system storage


def get_elapsed_time_redis(redis, redis_key):
    last_seen = redis.get(redis_key)
    elapsed_time_in_sec = (int(time.time()) - int(last_seen)) if last_seen else None
    return elapsed_time_in_sec


# Returns DB block state & diff
def _get_db_block_state():
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        # Fetch latest block from DB
        db_block_query = session.query(Block).filter(Block.is_current == True).all()
        assert len(db_block_query) == 1, "Expected SINGLE row marked as current"
        return helpers.model_to_dictionary(db_block_query[0])


# Returns number of and info on open db connections
def _get_db_conn_state():
    conn_state = monitors.get_monitors(
        [
            MONITORS[monitor_names.database_connections],
            MONITORS[monitor_names.database_connection_info],
            MONITORS[monitor_names.database_index_count],
            MONITORS[monitor_names.database_index_info],
        ]
    )

    return conn_state, False


# Returns the most current block in ipld blocks table and its associated block hash
def _get_db_ipld_block_state():
    ipld_block_number = 0
    ipld_block_hash = ""

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        db_ipld_block_query = (
            session.query(IPLDBlacklistBlock)
            .filter(IPLDBlacklistBlock.is_current == True)
            .all()
        )
        assert (
            len(db_ipld_block_query) == 1
        ), "Expected SINGLE row in IPLD Blocks table marked as current"

        ipld_block_number = db_ipld_block_query[0].number
        ipld_block_hash = db_ipld_block_query[0].blockhash

    return ipld_block_number, ipld_block_hash


# Get the max blocknumber and blockhash indexed in ipld blacklist table. Uses redis cache by default.
def get_latest_ipld_indexed_block(use_redis_cache=True):
    redis = redis_connection.get_redis()
    latest_indexed_ipld_block_num = None
    latest_indexed_ipld_block_hash = None

    if use_redis_cache:
        latest_indexed_ipld_block_num = redis.get(
            most_recent_indexed_ipld_block_redis_key
        )
        latest_indexed_ipld_block_hash = redis.get(
            most_recent_indexed_ipld_block_hash_redis_key
        )
        if latest_indexed_ipld_block_num is not None:
            latest_indexed_ipld_block_num = int(latest_indexed_ipld_block_num)

    if latest_indexed_ipld_block_num is None or latest_indexed_ipld_block_hash is None:
        (
            latest_indexed_ipld_block_num,
            latest_indexed_ipld_block_hash,
        ) = _get_db_ipld_block_state()

        # If there are no entries in the table, default to these values
        if latest_indexed_ipld_block_num is None:
            latest_indexed_ipld_block_num = 0
        if latest_indexed_ipld_block_hash is None:
            latest_indexed_ipld_block_hash = ""

    return latest_indexed_ipld_block_num, latest_indexed_ipld_block_hash


class GetHealthArgs(TypedDict):
    # If True, returns db connection information
    verbose: Optional[bool]

    # Determines the point at which a block difference is considered unhealthy
    health_block_diff: Optional[int]
    # If true and the block difference is unhealthy an error is returned
    enforce_block_diff: Optional[bool]

    # Number of seconds the challenge events are allowed to drift
    challenge_events_age_max_drift: Optional[int]


def get_health(args: GetHealthArgs, use_redis_cache: bool = True) -> Tuple[Dict, bool]:
    """
    Gets health status for the service

    Returns a tuple of health results and a boolean indicating an error
    """
    redis = redis_connection.get_redis()
    web3 = web3_provider.get_web3()

    verbose = args.get("verbose")
    enforce_block_diff = args.get("enforce_block_diff")
    qs_healthy_block_diff = cast(Optional[int], args.get("healthy_block_diff"))
    challenge_events_age_max_drift = args.get("challenge_events_age_max_drift")

    # If healthy block diff is given in url and positive, override config value
    healthy_block_diff = (
        qs_healthy_block_diff
        if qs_healthy_block_diff is not None and qs_healthy_block_diff >= 0
        else default_healthy_block_diff
    )

    latest_block_num = None
    latest_block_hash = None
    latest_indexed_block_num = None
    latest_indexed_block_hash = None

    if use_redis_cache:
        # get latest blockchain state from redis cache, or fallback to chain if None
        latest_block_num, latest_block_hash = get_latest_chain_block_set_if_nx(
            redis, web3
        )

        # get latest db state from redis cache
        latest_indexed_block_num = redis.get(most_recent_indexed_block_redis_key)
        if latest_indexed_block_num is not None:
            latest_indexed_block_num = int(latest_indexed_block_num)

        latest_indexed_block_hash = redis.get(most_recent_indexed_block_hash_redis_key)
        if latest_indexed_block_hash is not None:
            latest_indexed_block_hash = latest_indexed_block_hash.decode("utf-8")

    # fetch latest blockchain state from web3 if:
    # we explicitly don't want to use redis cache or
    # value from redis cache is None
    if not use_redis_cache or latest_block_num is None or latest_block_hash is None:
        # get latest blockchain state from web3
        latest_block = web3.eth.getBlock("latest", True)
        latest_block_num = latest_block.number
        latest_block_hash = latest_block.hash.hex()

    # fetch latest db state if:
    # we explicitly don't want to use redis cache or
    # value from redis cache is None
    if (
        not use_redis_cache
        or latest_indexed_block_num is None
        or latest_indexed_block_hash is None
    ):
        db_block_state = _get_db_block_state()
        latest_indexed_block_num = db_block_state["number"] or 0
        latest_indexed_block_hash = db_block_state["blockhash"]

    trending_tracks_age_sec = get_elapsed_time_redis(
        redis, trending_tracks_last_completion_redis_key
    )
    trending_playlists_age_sec = get_elapsed_time_redis(
        redis, trending_playlists_last_completion_redis_key
    )
    challenge_events_age_sec = get_elapsed_time_redis(
        redis, challenges_last_processed_event_redis_key
    )
    user_balances_age_sec = get_elapsed_time_redis(
        redis, user_balances_refresh_last_completion_redis_key
    )
    num_users_in_lazy_balance_refresh_queue = len(
        redis.smembers(LAZY_REFRESH_REDIS_PREFIX)
    )
    num_users_in_immediate_balance_refresh_queue = len(
        redis.smembers(IMMEDIATE_REFRESH_REDIS_PREFIX)
    )
    last_scanned_block_for_balance_refresh = redis_get_or_restore(
        redis, eth_indexing_last_scanned_block_key
    )
    index_eth_age_sec = get_elapsed_time_redis(
        redis, index_eth_last_completion_redis_key
    )
    last_scanned_block_for_balance_refresh = (
        int(last_scanned_block_for_balance_refresh)
        if last_scanned_block_for_balance_refresh
        else None
    )
    # Get system information monitor values
    sys_info = monitors.get_monitors(
        [
            MONITORS[monitor_names.database_size],
            MONITORS[monitor_names.database_connections],
            MONITORS[monitor_names.total_memory],
            MONITORS[monitor_names.used_memory],
            MONITORS[monitor_names.filesystem_size],
            MONITORS[monitor_names.filesystem_used],
            MONITORS[monitor_names.received_bytes_per_sec],
            MONITORS[monitor_names.transferred_bytes_per_sec],
            MONITORS[monitor_names.redis_total_memory],
        ]
    )

    health_results = {
        "web": {
            "blocknumber": latest_block_num,
            "blockhash": latest_block_hash,
        },
        "db": {
            "number": latest_indexed_block_num,
            "blockhash": latest_indexed_block_hash,
        },
        "git": os.getenv("GIT_SHA"),
        "trending_tracks_age_sec": trending_tracks_age_sec,
        "trending_playlists_age_sec": trending_playlists_age_sec,
        "challenge_last_event_age_sec": challenge_events_age_sec,
        "user_balances_age_sec": user_balances_age_sec,
        "num_users_in_lazy_balance_refresh_queue": num_users_in_lazy_balance_refresh_queue,
        "num_users_in_immediate_balance_refresh_queue": num_users_in_immediate_balance_refresh_queue,
        "last_scanned_block_for_balance_refresh": last_scanned_block_for_balance_refresh,
        "index_eth_age_sec": index_eth_age_sec,
        "number_of_cpus": number_of_cpus,
        **sys_info,
    }

    block_difference = abs(latest_block_num - latest_indexed_block_num)
    health_results["block_difference"] = block_difference
    health_results["maximum_healthy_block_difference"] = default_healthy_block_diff
    health_results.update(disc_prov_version)

    # Return error if system requirement check fails
    # divide by 10^-9 is conversion from bytes to gb
    num_cpus: int = int(health_results["number_of_cpus"]) if health_results["number_of_cpus"] else 0
    total_memory: int = int(health_results["total_memory"]) if health_results["total_memory"] else 0
    filesystem_size: int = int(health_results["filesystem_size"]) if health_results["filesystem_size"] else 0
    if (
        num_cpus < min_number_of_cpus
        or total_memory < min_total_memory
        or filesystem_size < min_filesystem_size
    ):
        health_results["meets_min_requirements"] = False
        # TODO - this will become strictly enforced in upcoming service versions and return with error
    else:
        health_results["meets_min_requirements"] = True

    if verbose:
        # DB connections check
        db_connections_json, error = _get_db_conn_state()
        health_results["db_connections"] = db_connections_json
        if error:
            return health_results, error

    unhealthy_blocks = bool(
        enforce_block_diff and block_difference > healthy_block_diff
    )
    unhealthy_challenges = bool(
        challenge_events_age_max_drift
        and challenge_events_age_sec
        and challenge_events_age_sec > challenge_events_age_max_drift
    )
    is_unhealthy = unhealthy_blocks or unhealthy_challenges

    return health_results, is_unhealthy


def get_latest_chain_block_set_if_nx(redis=None, web3=None):
    """
    Retrieves the latest block number and blockhash from redis if the keys exist.
    Otherwise it sets these values in redis by querying web3 and returns them

    :param redis: redis connection
    :param web3: web3 connection

    :rtype (int, string)
    """

    latest_block_num = None
    latest_block_hash = None

    if redis is None or web3 is None:
        raise Exception("Invalid arguments for get_latest_chain_block_set_if_nx")

    # also check for 'eth' attribute in web3 which means it's initialized and connected to a provider
    if not hasattr(web3, "eth"):
        raise Exception(
            "Invalid web3 argument for get_latest_chain_block_set_if_nx, web3 is not initialized"
        )

    stored_latest_block_num = redis.get(latest_block_redis_key)
    if stored_latest_block_num is not None:
        latest_block_num = int(stored_latest_block_num)

    stored_latest_blockhash = redis.get(latest_block_hash_redis_key)
    if stored_latest_blockhash is not None:
        latest_block_hash = stored_latest_blockhash.decode("utf-8")

    if latest_block_num is None or latest_block_hash is None:
        latest_block = web3.eth.getBlock("latest", True)
        latest_block_num = latest_block.number
        latest_block_hash = latest_block.hash.hex()

        # if we had attempted to use redis cache and the values weren't there, set the values now
        try:
            # ex sets expiration time and nx only sets if key doesn't exist in redis
            redis.set(
                latest_block_redis_key,
                latest_block_num,
                ex=default_indexing_interval_seconds,
                nx=True,
            )
            redis.set(
                latest_block_hash_redis_key,
                latest_block_hash,
                ex=default_indexing_interval_seconds,
                nx=True,
            )
        except Exception as e:
            logger.error(
                f"Could not set values in redis for get_latest_chain_block_set_if_nx: {e}"
            )

    return latest_block_num, latest_block_hash
