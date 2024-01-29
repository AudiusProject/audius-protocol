import json
import logging
from datetime import datetime, timedelta

import requests

from src.queries.update_historical_metrics import (
    update_historical_daily_app_metrics,
    update_historical_daily_route_metrics,
    update_historical_monthly_app_metrics,
    update_historical_monthly_route_metrics,
)
from src.tasks.celery_app import celery
from src.utils.config import shared_config
from src.utils.get_all_nodes import get_all_discovery_nodes_cached
from src.utils.prometheus_metric import (
    PrometheusMetric,
    PrometheusMetricNames,
    save_duration_metric,
)
from src.utils.redis_metrics import (
    METRICS_INTERVAL,
    datetime_format_secondary,
    get_summed_unique_metrics,
    merge_app_metrics,
    merge_route_metrics,
    metrics_visited_nodes,
    persist_summed_unique_counts,
    personal_app_metrics,
    personal_route_metrics,
)

logger = logging.getLogger(__name__)

discovery_node_service_type = bytes("discovery-node", "utf-8")


def get_metrics(endpoint: str, start_time: int):
    try:
        route_metrics_endpoint = (
            f"{endpoint}/v1/metrics/routes/cached?start_time={start_time}"
        )
        logger.debug(f"route metrics request to: {route_metrics_endpoint}")
        route_metrics_response = requests.get(route_metrics_endpoint, timeout=10)
        if route_metrics_response.status_code != 200:
            raise Exception(
                f"Query to cached route metrics endpoint {route_metrics_endpoint} \
                failed with status code {route_metrics_response.status_code}"
            )

        app_metrics_endpoint = (
            f"{endpoint}/v1/metrics/apps/cached?start_time={start_time}"
        )
        logger.debug(f"app metrics request to: {app_metrics_endpoint}")
        app_metrics_response = requests.get(app_metrics_endpoint, timeout=10)
        if app_metrics_response.status_code != 200:
            raise Exception(
                f"Query to cached app metrics endpoint {app_metrics_endpoint} \
                failed with status code {app_metrics_response.status_code}"
            )

        return (
            route_metrics_response.json()["data"],
            app_metrics_response.json()["data"],
        )
    except Exception as e:
        logger.warning(
            f"Could not get metrics from node {endpoint} with start_time {start_time}"
        )
        logger.error(e)
        return None, None


def consolidate_metrics_from_other_nodes(self, db, redis):
    """
    Get recent route and app metrics from all other discovery nodes
    and merge with this node's metrics so that this node will be aware
    of all the metrics across users hitting different providers
    """
    all_nodes = get_all_discovery_nodes_cached(redis) or []

    visited_node_timestamps_str = redis.get(metrics_visited_nodes)
    visited_node_timestamps = (
        json.loads(visited_node_timestamps_str) if visited_node_timestamps_str else {}
    )

    now = datetime.utcnow()
    one_iteration_ago = now - timedelta(minutes=METRICS_INTERVAL)
    one_iteration_ago_str = one_iteration_ago.strftime(datetime_format_secondary)
    end_time = now.strftime(datetime_format_secondary)

    # personal unique metrics for the day and the month
    summed_unique_metrics = get_summed_unique_metrics(now)
    summed_unique_daily_count = summed_unique_metrics["daily"]
    summed_unique_monthly_count = summed_unique_metrics["monthly"]

    # Merge & persist metrics for our personal node
    personal_route_metrics_str = redis.get(personal_route_metrics)
    personal_route_metrics_dict = (
        json.loads(personal_route_metrics_str) if personal_route_metrics_str else {}
    )
    new_personal_route_metrics = {}
    for timestamp, metrics in personal_route_metrics_dict.items():
        if timestamp > one_iteration_ago_str:
            for ip, count in metrics.items():
                if ip in new_personal_route_metrics:
                    new_personal_route_metrics[ip] += count
                else:
                    new_personal_route_metrics[ip] = count

    personal_app_metrics_str = redis.get(personal_app_metrics)
    personal_app_metrics_dict = (
        json.loads(personal_app_metrics_str) if personal_app_metrics_str else {}
    )
    new_personal_app_metrics = {}
    for timestamp, metrics in personal_app_metrics_dict.items():
        if timestamp > one_iteration_ago_str:
            for app_name, count in metrics.items():
                if app_name in new_personal_app_metrics:
                    new_personal_app_metrics[app_name] += count
                else:
                    new_personal_app_metrics[app_name] = count

    # Merge route metrics with other nodes and separately persist personal metrics
    are_personal_metrics = True
    merge_route_metrics(new_personal_route_metrics, end_time, db, are_personal_metrics)
    merge_app_metrics(new_personal_app_metrics, end_time, db)

    # Merge & persist metrics for other nodes
    for node in all_nodes:
        # Skip self
        if node["delegateOwnerWallet"] == shared_config["delegate"]["owner_wallet"]:
            continue
        start_time_str = (
            visited_node_timestamps[node["endpoint"]]
            if node["endpoint"] in visited_node_timestamps
            else one_iteration_ago_str
        )
        start_time_obj = datetime.strptime(start_time_str, datetime_format_secondary)
        start_time = int(start_time_obj.timestamp())
        new_route_metrics, new_app_metrics = get_metrics(node["endpoint"], start_time)

        logger.debug(
            f"did attempt to receive route and app metrics from {node} at {start_time_obj} ({start_time})"
        )

        # add other nodes' summed unique daily and monthly counts to this node's
        if new_route_metrics:
            logger.info(
                f"summed unique metrics from {node}: {new_route_metrics['summed']}"
            )
            summed_unique_daily_count += new_route_metrics["summed"]["daily"]
            summed_unique_monthly_count += new_route_metrics["summed"]["monthly"]
            new_route_metrics = new_route_metrics["deduped"]

        are_personal_metrics = False
        merge_route_metrics(new_route_metrics or {}, end_time, db, are_personal_metrics)
        merge_app_metrics(new_app_metrics or {}, end_time, db)

        if new_route_metrics is not None and new_app_metrics is not None:
            visited_node_timestamps[node["endpoint"]] = end_time
            redis.set(metrics_visited_nodes, json.dumps(visited_node_timestamps))

    # persist updated summed unique counts
    persist_summed_unique_counts(
        db, end_time, summed_unique_daily_count, summed_unique_monthly_count
    )

    logger.debug(f"visited node timestamps: {visited_node_timestamps}")


def get_historical_metrics(node: str):
    try:
        endpoint = f"{node}/v1/metrics/aggregates/historical"
        logger.debug(f"historical metrics request to: {endpoint}")
        response = requests.get(endpoint, timeout=10)
        if response.status_code != 200:
            raise Exception(
                f"Query to historical metrics endpoint {endpoint} \
                failed with status code {response.status_code}"
            )

        return response.json()["data"]
    except Exception as e:
        logger.warning(f"Could not get historical metrics from node {endpoint}")
        logger.error(e)
        return None


def update_route_metrics_count(my_metrics, other_metrics):
    for timestamp, values in other_metrics.items():
        if timestamp in my_metrics:
            my_metrics[timestamp] = {
                "unique_count": max(
                    values["unique_count"], my_metrics[timestamp]["unique_count"]
                ),
                "summed_unique_count": max(
                    values["summed_unique_count"],
                    my_metrics[timestamp]["summed_unique_count"],
                ),
                "total_count": max(
                    values["total_count"], my_metrics[timestamp]["total_count"]
                ),
            }
        else:
            my_metrics[timestamp] = values


def update_app_metrics_count(my_metrics, other_metrics):
    for timestamp, values in other_metrics.items():
        if timestamp in my_metrics:
            for app, count in values.items():
                my_metrics[timestamp][app] = (
                    max(my_metrics[timestamp][app], count)
                    if app in my_metrics[timestamp]
                    else count
                )
        else:
            my_metrics[timestamp] = values


def update_historical_metrics(
    db,
    daily_route_metrics,
    monthly_route_metrics,
    daily_app_metrics,
    monthly_app_metrics,
):
    update_historical_daily_route_metrics(db, daily_route_metrics)
    update_historical_monthly_route_metrics(db, monthly_route_metrics)
    update_historical_daily_app_metrics(db, daily_app_metrics)
    update_historical_monthly_app_metrics(db, monthly_app_metrics)


def synchronize_all_node_metrics(self, db, redis):
    """
    Get historical monthly metrics and last month's daily metrics
    to periodically synchronize metrics across all nodes
    """
    daily_route_metrics = {}
    monthly_route_metrics = {}
    daily_app_metrics = {}
    monthly_app_metrics = {}
    all_nodes = get_all_discovery_nodes_cached(redis) or []
    for node in all_nodes:
        historical_metrics = get_historical_metrics(node["endpoint"])
        logger.debug(
            f"got historical metrics from {node['endpoint']}: {historical_metrics}"
        )
        if historical_metrics:
            update_route_metrics_count(
                daily_route_metrics, historical_metrics["routes"]["daily"]
            )
            update_route_metrics_count(
                monthly_route_metrics, historical_metrics["routes"]["monthly"]
            )
            update_app_metrics_count(
                daily_app_metrics, historical_metrics["apps"]["daily"]
            )
            update_app_metrics_count(
                monthly_app_metrics, historical_metrics["apps"]["monthly"]
            )

    update_historical_metrics(
        db,
        daily_route_metrics,
        monthly_route_metrics,
        daily_app_metrics,
        monthly_app_metrics,
    )
    logger.info("synchronized historical route and app metrics")


# ####### CELERY TASKS ####### #


@celery.task(name="aggregate_metrics", bind=True)
@save_duration_metric(metric_group="celery_task")
def aggregate_metrics(self):
    """
    Aggregates metrics from other nodes.

    Get recent route and app metrics from all other discovery nodes (ip, app name, etc)
    and consolidates (deduplicating ips) with this node's metrics.
    """
    db = aggregate_metrics.db
    redis = aggregate_metrics.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("aggregate_metrics_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index_metrics.py | aggregate_metrics | {self.request.id} | Acquired aggregate_metrics_lock"
            )
            metric = PrometheusMetric(
                PrometheusMetricNames.INDEX_METRICS_DURATION_SECONDS
            )
            consolidate_metrics_from_other_nodes(self, db, redis)
            metric.save_time({"task_name": "aggregate_metrics"})
            logger.info(
                f"index_metrics.py | aggregate_metrics | {self.request.id} | Processing complete within session"
            )
        else:
            logger.error(
                f"index_metrics.py | aggregate_metrics | {self.request.id} | Failed to acquire aggregate_metrics_lock"
            )
    except Exception as e:
        logger.error(
            "Fatal error in main loop of aggregate_metrics: %s", e, exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()


@celery.task(name="synchronize_metrics", bind=True)
@save_duration_metric(metric_group="celery_task")
def synchronize_metrics(self):
    """
    Ensures that metrics reporting is consistent between all nodes.

    Gets historical metrics from all other discovery nodes unique/total counts
    for requests and app names and updates this node with the max(self, other) to
    ensure that each discovery node reports metrics consistently.
    """
    db = synchronize_metrics.db
    redis = synchronize_metrics.redis

    # Define lock acquired boolean
    have_lock = False

    # Define redis lock object
    update_lock = redis.lock("synchronize_metrics_lock", blocking_timeout=25)
    try:
        # Attempt to acquire lock - do not block if unable to acquire
        have_lock = update_lock.acquire(blocking=False)
        if have_lock:
            logger.info(
                f"index_metrics.py | synchronize_metrics | {self.request.id} | Acquired synchronize_metrics_lock"
            )
            metric = PrometheusMetric(
                PrometheusMetricNames.INDEX_METRICS_DURATION_SECONDS
            )
            synchronize_all_node_metrics(self, db, redis)
            metric.save_time({"task_name": "synchronize_metrics"})
            logger.info(
                f"index_metrics.py | synchronize_metrics | {self.request.id} | Processing complete within session"
            )
        else:
            logger.error(
                f"index_metrics.py | synchronize_metrics | {self.request.id} | \
                    Failed to acquire synchronize_metrics_lock"
            )
    except Exception as e:
        logger.error(
            "Fatal error in main loop of synchronize_metrics: %s", e, exc_info=True
        )
        raise e
    finally:
        if have_lock:
            update_lock.release()
