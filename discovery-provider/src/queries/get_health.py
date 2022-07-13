import logging
import os
import time
from datetime import datetime
from typing import Dict, Optional, Tuple, TypedDict, cast

from elasticsearch import Elasticsearch
from redis import Redis
from src.eth_indexing.event_scanner import eth_indexing_last_scanned_block_key
from src.models.indexing.block import Block
from src.models.indexing.ipld_blacklist_block import IpldBlacklistBlock
from src.monitors import monitor_names, monitors
from src.queries.get_balances import (
    IMMEDIATE_REFRESH_REDIS_PREFIX,
    LAZY_REFRESH_REDIS_PREFIX,
)
from src.queries.get_latest_play import get_latest_play
from src.queries.get_oldest_unarchived_play import get_oldest_unarchived_play
from src.queries.get_sol_plays import get_sol_play_health_info
from src.queries.get_sol_rewards_manager import get_sol_rewards_manager_health_info
from src.queries.get_sol_user_bank import get_sol_user_bank_health_info
from src.queries.get_spl_audio import get_spl_audio_health_info
from src.utils import db_session, helpers, redis_connection, web3_provider
from src.utils.config import shared_config
from src.utils.elasticdsl import ES_INDEXES, esclient
from src.utils.helpers import redis_get_or_restore, redis_set_and_dump
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.redis_constants import (
    LAST_REACTIONS_INDEX_TIME_KEY,
    LAST_SEEN_NEW_REACTION_TIME_KEY,
    UPDATE_TRACK_IS_AVAILABLE_FINISH_REDIS_KEY,
    UPDATE_TRACK_IS_AVAILABLE_START_REDIS_KEY,
    challenges_last_processed_event_redis_key,
    index_eth_last_completion_redis_key,
    latest_block_hash_redis_key,
    latest_block_redis_key,
    latest_legacy_play_db_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
    most_recent_indexed_ipld_block_hash_redis_key,
    most_recent_indexed_ipld_block_redis_key,
    oldest_unarchived_play_key,
    trending_playlists_last_completion_redis_key,
    trending_tracks_last_completion_redis_key,
    user_balances_refresh_last_completion_redis_key,
)

logger = logging.getLogger(__name__)
MONITORS = monitors.MONITORS

number_of_cpus = os.cpu_count()

disc_prov_version = helpers.get_discovery_provider_version()

openresty_public_key = helpers.get_openresty_public_key()

default_healthy_block_diff = int(shared_config["discprov"]["healthy_block_diff"])
default_indexing_interval_seconds = int(
    shared_config["discprov"]["block_processing_interval_sec"]
)
infra_setup = shared_config["discprov"]["infra_setup"]

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
        ]
    )

    return conn_state, False


# Returns query insights
def _get_query_insights():
    query_insights = monitors.get_monitors(
        [
            MONITORS[monitor_names.frequent_queries],
            MONITORS[monitor_names.slow_queries],
        ]
    )

    return query_insights, False


# Returns the most current block in ipld blocks table and its associated block hash
def _get_db_ipld_block_state():
    ipld_block_number = 0
    ipld_block_hash = ""

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        db_ipld_block_query = (
            session.query(IpldBlacklistBlock)
            .filter(IpldBlacklistBlock.is_current == True)
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

    # Number of seconds play counts are allowed to drift
    plays_count_max_drift: Optional[int]

    # Reactions max drift
    reactions_max_indexing_drift: Optional[int]
    reactions_max_last_reaction_drift: Optional[int]


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
    plays_count_max_drift = args.get("plays_count_max_drift")

    # If healthy block diff is given in url and positive, override config value
    healthy_block_diff = (
        qs_healthy_block_diff
        if qs_healthy_block_diff is not None and qs_healthy_block_diff >= 0
        else default_healthy_block_diff
    )

    latest_block_num: Optional[int] = None
    latest_block_hash: Optional[str] = None
    latest_indexed_block_num: Optional[int] = None
    latest_indexed_block_hash: Optional[str] = None
    last_track_unavailability_job_start_time: Optional[str] = None
    last_track_unavailability_job_end_time: Optional[str] = None

    if use_redis_cache:
        # get latest blockchain state from redis cache, or fallback to chain if None
        latest_block_num, latest_block_hash = get_latest_chain_block_set_if_nx(
            redis, web3
        )

        # get latest db state from redis cache
        latest_indexed_block_num = redis.get(most_recent_indexed_block_redis_key)
        if latest_indexed_block_num is not None:
            latest_indexed_block_num = int(latest_indexed_block_num)

        latest_indexed_block_hash_bytes = redis.get(
            most_recent_indexed_block_hash_redis_key
        )
        if latest_indexed_block_hash_bytes is not None:
            latest_indexed_block_hash = latest_indexed_block_hash_bytes.decode("utf-8")
    else:
        # Get latest blockchain state from web3
        try:
            latest_block = web3.eth.get_block("latest", True)
            latest_block_num = latest_block.number
            latest_block_hash = latest_block.hash.hex()
        except Exception as e:
            logger.error(f"Could not get latest block from chain: {e}")

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

    play_health_info = get_play_health_info(redis, plays_count_max_drift)
    rewards_manager_health_info = get_rewards_manager_health_info(redis)
    user_bank_health_info = get_user_bank_health_info(redis)
    spl_audio_info = get_spl_audio_info(redis)
    reactions_health_info = get_reactions_health_info(
        redis,
        args.get("reactions_max_indexing_drift"),
        args.get("reactions_max_last_reaction_drift"),
    )

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
    num_users_in_lazy_balance_refresh_queue = int(
        redis.scard(LAZY_REFRESH_REDIS_PREFIX)
    )
    num_users_in_immediate_balance_refresh_queue = int(
        redis.scard(IMMEDIATE_REFRESH_REDIS_PREFIX)
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

    try:
        last_track_unavailability_job_start_time = str(
            redis.get(UPDATE_TRACK_IS_AVAILABLE_START_REDIS_KEY).decode()
        )
    except Exception as e:
        logger.error(
            f"Could not get latest track unavailability job start timestamp: {e}"
        )
        last_track_unavailability_job_start_time = None

    try:
        last_track_unavailability_job_end_time = str(
            redis.get(UPDATE_TRACK_IS_AVAILABLE_FINISH_REDIS_KEY).decode()
        )
    except Exception as e:
        logger.error(
            f"Could not get latest track unavailability job end timestamp: {e}"
        )
        last_track_unavailability_job_end_time = None

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
        "last_track_unavailability_job_start_time": last_track_unavailability_job_start_time,
        "last_track_unavailability_job_end_time": last_track_unavailability_job_end_time,
        "index_eth_age_sec": index_eth_age_sec,
        "number_of_cpus": number_of_cpus,
        **sys_info,
        "plays": play_health_info,
        "rewards_manager": rewards_manager_health_info,
        "user_bank": user_bank_health_info,
        "openresty_public_key": openresty_public_key,
        "spl_audio_info": spl_audio_info,
        "reactions": reactions_health_info,
        "infra_setup": infra_setup,
    }

    if latest_block_num is not None and latest_indexed_block_num is not None:
        block_difference = abs(latest_block_num - latest_indexed_block_num)
    else:
        # If we cannot get a reading from chain about what the latest block is,
        # we set the difference to be an unhealthy amount
        block_difference = default_healthy_block_diff + 1
    health_results["block_difference"] = block_difference
    health_results["maximum_healthy_block_difference"] = default_healthy_block_diff
    health_results.update(disc_prov_version)

    # Check that this node meets the minimum system requirements
    num_cpus: int = cast(int, health_results["number_of_cpus"] or 0)
    total_memory: int = cast(int, health_results["total_memory"] or 0)
    filesystem_size: int = cast(int, health_results["filesystem_size"] or 0)
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
        # Elasticsearch health
        if esclient:
            health_results["elasticsearch"] = get_elasticsearch_health_info(
                esclient, latest_indexed_block_num
            )

        # DB connections check
        db_connections_json, db_connections_error = _get_db_conn_state()
        health_results["db_connections"] = db_connections_json
        location = get_location()
        health_results.update(location)

        if db_connections_error:
            return health_results, db_connections_error

        query_insights_json, query_insights_error = _get_query_insights()
        health_results["query_insights"] = query_insights_json

        if query_insights_error:
            return health_results, query_insights_error

        table_size_info_json = monitors.get_monitors(
            [
                MONITORS[monitor_names.table_size_info],
            ]
        )

        health_results["tables"] = table_size_info_json

    unhealthy_blocks = bool(
        enforce_block_diff and block_difference > healthy_block_diff
    )
    unhealthy_challenges = bool(
        challenge_events_age_max_drift
        and challenge_events_age_sec
        and challenge_events_age_sec > challenge_events_age_max_drift
    )

    is_unhealthy = (
        unhealthy_blocks
        or unhealthy_challenges
        or play_health_info["is_unhealthy"]
        or reactions_health_info["is_unhealthy"]
    )

    return health_results, is_unhealthy


class LocationResponse(TypedDict):
    country: str
    latitude: str
    longitude: str


def get_location() -> LocationResponse:
    return {
        "country": shared_config["serviceLocation"]["serviceCountry"],
        "latitude": shared_config["serviceLocation"]["serviceLatitude"],
        "longitude": shared_config["serviceLocation"]["serviceLongitude"],
    }


def get_elasticsearch_health_info(
    esclient: Elasticsearch, latest_indexed_block_num: int
) -> Dict[str, Dict[str, int]]:
    elasticsearch_health = {}
    for index_name in ES_INDEXES:
        try:
            resp = esclient.search(
                index=index_name,
                aggs={"max_blocknumber": {"max": {"field": "blocknumber"}}},
                size=0,
            )
            blocknumber = int(resp["aggregations"]["max_blocknumber"]["value"])
            elasticsearch_health[index_name] = {
                "blocknumber": blocknumber,
                "db_block_difference": latest_indexed_block_num - blocknumber,
            }
        except Exception:
            pass
    return elasticsearch_health


def health_check_prometheus_exporter():
    health_results, is_unhealthy = get_health({})

    PrometheusMetric(PrometheusMetricNames.HEALTH_CHECK_BLOCK_DIFFERENCE_LATEST).save(
        health_results["block_difference"]
    )

    PrometheusMetric(PrometheusMetricNames.HEALTH_CHECK_INDEXED_BLOCK_NUM_LATEST).save(
        health_results["web"]["blocknumber"]
    )


PrometheusMetric.register_collector(
    "health_check_prometheus_exporter", health_check_prometheus_exporter
)


class SolHealthInfo(TypedDict):
    is_unhealthy: bool
    tx_info: Dict
    time_diff_general: int


class PlayHealthInfo(SolHealthInfo):
    oldest_unarchived_play_created_at: str


# Aggregate play health info across Solana and legacy storage
def get_play_health_info(
    redis: Redis, plays_count_max_drift: Optional[int]
) -> PlayHealthInfo:
    if redis is None:
        raise Exception("Invalid arguments for get_play_health_info")

    current_time_utc = datetime.utcnow()
    # Fetch plays info from Solana
    sol_play_info = get_sol_play_health_info(redis, current_time_utc)

    # If play count max drift provided, perform comparison
    is_unhealthy_sol_plays = bool(
        plays_count_max_drift and plays_count_max_drift < sol_play_info["time_diff"]
    )

    # If unhealthy sol plays, this will be overwritten
    time_diff_general = sol_play_info["time_diff"]

    if is_unhealthy_sol_plays or not plays_count_max_drift:
        # Calculate time diff from now to latest play
        latest_db_play = redis_get_or_restore(redis, latest_legacy_play_db_key)
        if not latest_db_play:
            # Query and cache latest db play if found
            latest_db_play = get_latest_play()
            if latest_db_play:
                redis_set_and_dump(
                    redis, latest_legacy_play_db_key, latest_db_play.timestamp()
                )
        else:
            # Decode bytes into float for latest timestamp
            latest_db_play = float(latest_db_play.decode())
            latest_db_play = datetime.utcfromtimestamp(latest_db_play)

        oldest_unarchived_play = redis_get_or_restore(redis, oldest_unarchived_play_key)
        if not oldest_unarchived_play:
            # Query and cache oldest unarchived play
            oldest_unarchived_play = get_oldest_unarchived_play()
            if oldest_unarchived_play:
                redis_set_and_dump(
                    redis,
                    oldest_unarchived_play_key,
                    oldest_unarchived_play.timestamp(),
                )
        else:
            # Decode bytes into float for latest timestamp
            oldest_unarchived_play = float(oldest_unarchived_play.decode())
            oldest_unarchived_play = datetime.utcfromtimestamp(oldest_unarchived_play)

        time_diff_general = (
            (current_time_utc - latest_db_play).total_seconds()
            if latest_db_play
            else time_diff_general
        )

    is_unhealthy_plays = bool(
        plays_count_max_drift
        and (is_unhealthy_sol_plays and (plays_count_max_drift < time_diff_general))
    )

    return {
        "is_unhealthy": is_unhealthy_plays,
        "tx_info": sol_play_info,
        "time_diff_general": time_diff_general,
        "oldest_unarchived_play_created_at": oldest_unarchived_play,
    }


def get_user_bank_health_info(
    redis: Redis, max_drift: Optional[int] = None
) -> SolHealthInfo:
    if redis is None:
        raise Exception("Invalid arguments for get_user_bank_health_info")

    current_time_utc = datetime.utcnow()

    tx_health_info = get_sol_user_bank_health_info(redis, current_time_utc)
    # If user bank indexing max drift provided, perform comparison
    is_unhealthy = bool(max_drift and max_drift < tx_health_info["time_diff"])

    return {
        "is_unhealthy": is_unhealthy,
        "tx_info": tx_health_info,
        "time_diff_general": tx_health_info["time_diff"],
    }


def get_reactions_health_info(
    redis: Redis,
    max_indexing_drift: Optional[int] = None,
    max_reaction_drift: Optional[int] = None,
):
    now = datetime.now()
    last_index_time = redis.get(LAST_REACTIONS_INDEX_TIME_KEY)
    last_index_time = int(last_index_time) if last_index_time else None
    last_reaction_time = redis.get(LAST_SEEN_NEW_REACTION_TIME_KEY)
    last_reaction_time = int(last_reaction_time) if last_reaction_time else None

    last_index_time = (
        datetime.fromtimestamp(last_index_time) if last_index_time else None
    )
    last_reaction_time = (
        datetime.fromtimestamp(last_reaction_time) if last_reaction_time else None
    )

    indexing_delta = (
        (now - last_index_time).total_seconds() if last_index_time else None
    )
    reaction_delta = (
        (now - last_reaction_time).total_seconds() if last_reaction_time else None
    )

    is_unhealthy_indexing = bool(
        indexing_delta and max_indexing_drift and indexing_delta > max_indexing_drift
    )
    is_unhealthy_reaction = bool(
        reaction_delta and max_reaction_drift and reaction_delta > max_reaction_drift
    )

    is_unhealthy = is_unhealthy_indexing or is_unhealthy_reaction

    return {
        "indexing_delta": indexing_delta,
        "reaction_delta": reaction_delta,
        "is_unhealthy": is_unhealthy,
    }


def get_spl_audio_info(redis: Redis, max_drift: Optional[int] = None) -> SolHealthInfo:
    if redis is None:
        raise Exception("Invalid arguments for get_spl_audio_info")

    current_time_utc = datetime.utcnow()

    tx_health_info = get_spl_audio_health_info(redis, current_time_utc)
    # If spl audio indexing max drift provided, perform comparison
    is_unhealthy = bool(max_drift and max_drift < tx_health_info["time_diff"])

    return {
        "is_unhealthy": is_unhealthy,
        "tx_info": tx_health_info,
        "time_diff_general": tx_health_info["time_diff"],
    }


def get_rewards_manager_health_info(
    redis: Redis, max_drift: Optional[int] = None
) -> SolHealthInfo:
    if redis is None:
        raise Exception("Invalid arguments for get_rewards_manager_health_info")

    current_time_utc = datetime.utcnow()

    tx_health_info = get_sol_rewards_manager_health_info(redis, current_time_utc)
    is_unhealthy = bool(max_drift and max_drift < tx_health_info["time_diff"])

    return {
        "is_unhealthy": is_unhealthy,
        "tx_info": tx_health_info,
        "time_diff_general": tx_health_info["time_diff"],
    }


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
        try:
            latest_block = web3.eth.get_block("latest", True)
            latest_block_num = latest_block.number
            latest_block_hash = latest_block.hash.hex()

            # if we had attempted to use redis cache and the values weren't there, set the values now
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
