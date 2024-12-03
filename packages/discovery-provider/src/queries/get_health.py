import asyncio
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple, TypedDict, cast

import requests
from elasticsearch import Elasticsearch
from redis import Redis

from src.eth_indexing.event_scanner import eth_indexing_last_scanned_block_key
from src.models.indexing.block import Block
from src.monitors import monitor_names, monitors
from src.queries.get_balances import (
    IMMEDIATE_REFRESH_REDIS_PREFIX,
    LAZY_REFRESH_REDIS_PREFIX,
)
from src.queries.get_latest_play import get_latest_play
from src.queries.get_oldest_unarchived_play import get_oldest_unarchived_play
from src.queries.get_sol_plays import get_sol_play_health_info
from src.queries.get_trusted_notifier_discrepancies import get_delist_statuses_ok
from src.utils import (
    db_session,
    elasticdsl,
    get_all_nodes,
    helpers,
    redis_connection,
    web3_provider,
)
from src.utils.config import shared_config
from src.utils.elasticdsl import ES_INDEXES
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.redis_constants import (
    SolanaIndexerStatus,
    challenges_last_processed_event_redis_key,
    index_eth_last_completion_redis_key,
    latest_block_hash_redis_key,
    latest_block_redis_key,
    latest_legacy_play_db_key,
    most_recent_indexed_block_hash_redis_key,
    most_recent_indexed_block_redis_key,
    oldest_unarchived_play_key,
    redis_keys,
    trending_playlists_last_completion_redis_key,
    trending_tracks_last_completion_redis_key,
    user_balances_refresh_last_completion_redis_key,
)
from src.utils.web3_provider import get_web3

LOCAL_RPC = "http://chain:8545"


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


def _get_relay_health():
    relay_plugin = os.getenv(
        "audius_relay_host",
        "http://relay:6001/relay",
    )
    relay_health = requests.get(relay_plugin + "/health")
    relay_res = relay_health.json()
    return relay_res


def _is_relay_healthy(relay_health_res):
    relay_status = relay_health_res["status"]
    is_healthy = relay_status == "up"
    relay_health_res["is_unhealthy"] = not is_healthy
    return is_healthy


def _get_chain_health():
    try:
        health_res = requests.get(LOCAL_RPC + "/health", timeout=1)
        chain_res = health_res.json()

        web3 = get_web3(LOCAL_RPC)
        latest_block = web3.eth.get_block("latest")
        chain_res["block_number"] = latest_block.number
        chain_res["hash"] = latest_block.hash.hex()
        chain_res["chain_id"] = web3.eth.chain_id
        get_signers_data = '{"method":"clique_getSigners","params":[]}'
        signers_response = requests.post(LOCAL_RPC, data=get_signers_data)
        signers_response_dict = signers_response.json()["result"]
        chain_res["signers"] = signers_response_dict
        get_snapshot_data = '{"method":"clique_getSnapshot","params":[]}'
        snapshot_response = requests.post(LOCAL_RPC, data=get_snapshot_data)
        snapshot_response_dict = snapshot_response.json()["result"]
        chain_res["snapshot"] = snapshot_response_dict
        return chain_res
    except Exception as e:
        # We use ganache locally in development, which doesn't have /health endpoint
        # Don't log the error to prevent red herrings. Things will still work.
        # TODO: Remove this check when we use nethermind in development
        if shared_config["discprov"]["env"] != "dev":
            logging.error("issue with chain health %s", exc_info=e)
        pass


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

    # Number of seconds reward_manager indexer is allowed to drift
    reward_manager_max_drift: Optional[int]
    # Number of seconds user_bank indexer is allowed to drift
    user_bank_max_drift: Optional[int]
    # Number of seconds spl_token indexer is allowed to drift
    spl_token_max_drift: Optional[int]
    # Number of seconds payment_router indexer allowed to drift
    payment_router_max_drift: Optional[int]
    # Number of seconds aggregate_tips indexer is allowed to drift
    aggregate_tips_max_drift: Optional[int]


def get_health(args: GetHealthArgs, use_redis_cache: bool = True) -> Tuple[Dict, bool]:
    """
    Gets health status for the service

    Returns a tuple of health results and a boolean indicating an error
    """
    redis = redis_connection.get_redis()
    web3 = web3_provider.get_web3()

    bypass_errors = args.get("bypass_errors")
    verbose = args.get("verbose")
    enforce_block_diff = args.get("enforce_block_diff")
    qs_healthy_block_diff = cast(Optional[int], args.get("healthy_block_diff"))
    challenge_events_age_max_drift = args.get("challenge_events_age_max_drift")
    plays_count_max_drift = args.get("plays_count_max_drift")
    reward_manager_max_drift = args.get("reward_manager_max_drift")
    user_bank_max_drift = args.get("user_bank_max_drift")
    spl_token_max_drift = args.get("spl_token_max_drift")
    payment_router_max_drift = args.get("payment_router_max_drift")
    aggregate_tips_max_drift = args.get("aggregate_tips_max_drift")

    errors = []

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
            final_poa_block = helpers.get_final_poa_block()
            latest_block = web3.eth.get_block("latest", True)
            latest_block_num = latest_block.number + (final_poa_block or 0)
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

    user_bank_health_info = get_solana_indexer_status(
        redis, redis_keys.solana.user_bank, user_bank_max_drift
    )
    spl_token_health_info = get_solana_indexer_status(
        redis, redis_keys.solana.spl_token, spl_token_max_drift
    )
    reward_manager_health_info = get_solana_indexer_status(
        redis, redis_keys.solana.reward_manager, reward_manager_max_drift
    )
    payment_router_health_info = get_solana_indexer_status(
        redis, redis_keys.solana.payment_router, payment_router_max_drift
    )
    aggregate_tips_health_info = get_solana_indexer_status(
        redis,
        redis_keys.solana.aggregate_tips,
        aggregate_tips_max_drift,
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
    last_scanned_block_for_balance_refresh = redis.get(
        eth_indexing_last_scanned_block_key
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

    url = shared_config["discprov"]["url"]

    auto_upgrade_enabled = (
        True if os.getenv("audius_auto_upgrade_enabled") == "true" else False
    )
    database_is_localhost = os.getenv(
        "audius_db_url"
    ) == "postgresql://postgres:postgres@db:5432/audius_discovery" or "localhost" in os.getenv(
        "audius_db_url", ""
    )
    discovery_nodes = get_all_nodes.get_all_discovery_nodes_cached(redis)
    content_nodes = get_all_nodes.get_all_healthy_content_nodes_cached(redis)
    final_poa_block = helpers.get_final_poa_block()
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
        "auto_upgrade_enabled": auto_upgrade_enabled,
        "database_is_localhost": database_is_localhost,
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
        "plays": play_health_info,
        "solana_indexers": {
            "spl_token": spl_token_health_info,
            "payment_router": payment_router_health_info,
            "reward_manager": reward_manager_health_info,
            "user_bank": user_bank_health_info,
            "aggregate_tips": aggregate_tips_health_info,
        },
        "openresty_public_key": openresty_public_key,
        "infra_setup": infra_setup,
        "url": url,
        # Temp
        "latest_block_num": latest_block_num,
        "latest_indexed_block_num": latest_indexed_block_num,
        "final_poa_block": final_poa_block,
        "network": {
            "discovery_nodes_with_owner": discovery_nodes,
            "discovery_nodes": (
                [d["endpoint"] for d in discovery_nodes] if discovery_nodes else None
            ),
            "content_nodes": content_nodes,
        },
    }

    if os.getenv("AUDIUS_D_GENERATED"):
        health_results["audius_d_managed"] = True
    if os.getenv("AUDIUS_DOCKER_COMPOSE_GIT_SHA") is not None:
        health_results["audius-docker-compose"] = os.getenv(
            "AUDIUS_DOCKER_COMPOSE_GIT_SHA"
        )

    if latest_block_num is not None and latest_indexed_block_num is not None:
        block_difference = abs(
            latest_block_num - latest_indexed_block_num
        )  # nethermind offset
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

    health_results["chain_health"] = _get_chain_health()

    relay_health = _get_relay_health()
    if not _is_relay_healthy(relay_health):
        errors.append("relay unhealthy")

    health_results["relay"] = relay_health

    # Elasticsearch health
    esclient = elasticdsl.get_esclient()
    if esclient:
        health_results["elasticsearch"] = get_elasticsearch_health_info(
            esclient,
            latest_indexed_block_num,
            verbose,
        )
        if health_results["elasticsearch"]["status"] != "green":
            errors.append("unhealthy elasticsearch")

    if verbose:
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

    if unhealthy_blocks:
        errors.append("unhealthy block diff")
    if unhealthy_challenges:
        errors.append("unhealthy challenges")
    if play_health_info["is_unhealthy"]:
        errors.append("unhealthy plays")
    if not user_bank_health_info["is_healthy"]:
        errors.append("unhealthy user_bank indexer")
    if not reward_manager_health_info["is_healthy"]:
        errors.append("unhealthy reward_manager indexer")
    if not spl_token_health_info["is_healthy"]:
        errors.append("unhealthy spl_token indexer")
    if not payment_router_health_info["is_healthy"]:
        errors.append("unhealthy payment_router indexer")
    if not aggregate_tips_health_info["is_healthy"]:
        errors.append("unhealthy aggregate_tips indexer")

    delist_statuses_ok = get_delist_statuses_ok()
    if not delist_statuses_ok:
        errors.append("unhealthy delist statuses")

    chain_health = health_results["chain_health"]
    if chain_health and chain_health["status"] == "Unhealthy":
        errors.append("unhealthy chain")

    is_dev = shared_config["discprov"]["env"] == "dev"
    if not is_dev and not chain_health:
        errors.append("no chain response")

    if verbose:
        api_healthy, reason = is_api_healthy(url)
        if not api_healthy:
            errors.append(f"api unhealthy: {reason}")

    is_unhealthy = not bypass_errors and (
        unhealthy_blocks
        or unhealthy_challenges
        or play_health_info["is_unhealthy"]
        or not delist_statuses_ok
        or (
            health_results.get("elasticsearch") != None
            and health_results["elasticsearch"]["status"] != "green"
        )
    )

    health_results["errors"] = errors
    health_results["discovery_provider_healthy"] = not errors

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
    esclient: Elasticsearch,
    latest_indexed_block_num: int,
    verbose: Optional[bool],
) -> Dict[str, Any]:
    elasticsearch_health: Dict[str, Any] = {"status": None}
    try:
        elasticsearch_health["status"] = esclient.cluster.health().get("status")
    except Exception as e:
        logger.error(f"Could not obtain elasticsearch cluster health status: {e}")

    if verbose:
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
            except Exception as e:
                logger.error(f"Failed to query elasticsearch index {index_name}: {e}")
    return elasticsearch_health


def health_check_prometheus_exporter():
    health_results, is_unhealthy = get_health({})

    # store all top-level keys with numerical values
    for key, value in health_results.items():
        if isinstance(value, (int, float)):
            PrometheusMetric(PrometheusMetricNames.HEALTH_CHECK).save(
                value, {"key": key}
            )

    # store a non-top-level key
    PrometheusMetric(PrometheusMetricNames.HEALTH_CHECK).save(
        health_results["web"]["blocknumber"], {"key": "blocknumber"}
    )


PrometheusMetric.register_collector(
    "health_check_prometheus_exporter", health_check_prometheus_exporter
)


class SolanaIndexerHealth(TypedDict):
    # whether the indexer is healthy, as defined by the given allowed drift
    # for since_last_completed_at
    is_healthy: bool
    # time (in seconds) since the last completion of the indexer
    since_last_completed_at: Optional[float]
    # UTC timestamp of the last indexing job completion
    last_completed_at: Optional[float]
    # the last indexed transaction signature
    last_tx: Optional[str]


def get_solana_indexer_status(
    redis: Redis, keys: SolanaIndexerStatus, max_drift: Optional[int]
) -> SolanaIndexerHealth:
    last_completed_at = redis.get(keys.last_completed_at)
    last_completed_at = (
        float(last_completed_at) if last_completed_at is not None else None
    )
    now = datetime.now(timezone.utc).timestamp()
    since_last_completed_at = (
        (now - last_completed_at) if last_completed_at is not None else None
    )
    last_tx = redis.get(keys.last_tx)
    last_tx = str(last_tx, encoding="utf-8") if last_tx is not None else None
    # Job completed at least once and less than max_drift ago (if applicable)
    is_healthy = since_last_completed_at is not None and (
        max_drift is None or since_last_completed_at < max_drift
    )

    return {
        "is_healthy": is_healthy,
        "since_last_completed_at": since_last_completed_at,
        "last_completed_at": last_completed_at,
        "last_tx": last_tx,
    }


class SolHealthInfo(TypedDict):
    is_unhealthy: bool
    tx_info: Dict


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
    oldest_unarchived_play = None

    if is_unhealthy_sol_plays or not plays_count_max_drift:
        # Calculate time diff from now to latest play
        latest_db_play = redis.get(latest_legacy_play_db_key)
        if not latest_db_play:
            # Query and cache latest db play if found
            latest_db_play = get_latest_play()
            if latest_db_play:
                redis.set(latest_legacy_play_db_key, latest_db_play.timestamp())
        else:
            # Decode bytes into float for latest timestamp
            latest_db_play = float(latest_db_play.decode())
            latest_db_play = datetime.utcfromtimestamp(latest_db_play)

        oldest_unarchived_play = redis.get(oldest_unarchived_play_key)
        if not oldest_unarchived_play:
            # Query and cache oldest unarchived play
            oldest_unarchived_play = get_oldest_unarchived_play()
            if oldest_unarchived_play:
                redis.set(
                    oldest_unarchived_play_key,
                    oldest_unarchived_play.timestamp(),
                )
        else:
            # Decode bytes into float for latest timestamp
            oldest_unarchived_play = datetime.utcfromtimestamp(
                float(oldest_unarchived_play.decode())
            )

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
        "oldest_unarchived_play_created_at": str(oldest_unarchived_play),
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
            final_poa_block = helpers.get_final_poa_block()
            latest_block = web3.eth.get_block("latest", True)
            latest_block_num = latest_block.number + (final_poa_block or 0)
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


def is_api_healthy(my_url):
    if not my_url:
        return True, ""

    if "staging" in my_url:
        user_search_term = "ray"
        user_search_response_keyword = "ray"
        track_id = "7eP5n"
        track_response_keyword = "April"
    else:
        user_search_term = "Brownies"
        user_search_response_keyword = "keeping you on your toes"
        track_id = "D7KyD"
        track_response_keyword = "live set at Brownies"

    user_search_endpoint = f"{my_url}/v1/users/search?query={user_search_term}"
    track_stream_endpoint = f"{my_url}/v1/tracks/{track_id}/stream"
    track_endpoint = f"{my_url}/v1/tracks/{track_id}"
    trending_endpoint = f"{my_url}/v1/tracks/trending"
    urls = [
        user_search_endpoint,
        track_stream_endpoint,
        track_endpoint,
        trending_endpoint,
    ]

    async def fetch_url(url):
        try:
            loop = asyncio.get_event_loop()
            future = loop.run_in_executor(None, requests.get, url)
            response = await future
            response.raise_for_status()
            return response.text
        except Exception as e:
            return f"error getting {url}: {str(e)}"

    async def request_all(urls):
        responses = {}
        tasks = [
            asyncio.create_task(fetch_url(url), name=f"fetch:{url}") for url in urls
        ]
        done, _ = await asyncio.wait(
            tasks, return_when=asyncio.ALL_COMPLETED, timeout=0.5
        )
        for task in done:
            url = task.get_name().removeprefix("fetch:")
            try:
                responses[url] = task.result()
            except Exception as e:
                responses[url] = f"error getting {url}: {str(e)}"
        return responses

    errors = []
    try:
        responses = asyncio.run(request_all(urls))

        for url, response_text in responses.items():
            if "error getting" in response_text:
                errors.append(response_text)
            else:
                if (
                    url == user_search_endpoint
                    and user_search_response_keyword not in response_text
                ):
                    errors.append(
                        f"missing keyword '{user_search_response_keyword}' in response from {url}"
                    )
                if (
                    url == track_endpoint
                    and track_response_keyword not in response_text
                ):
                    errors.append(
                        f"missing keyword '{track_response_keyword}' in response from {url}"
                    )
                if url == trending_endpoint and "artwork" not in response_text:
                    errors.append(f"missing keyword 'artwork' in response from {url}")
    except Exception as e:
        logger.error(f"Could not check api health: {e}")

    if errors:
        return False, ", ".join(errors)
    return True, ""
