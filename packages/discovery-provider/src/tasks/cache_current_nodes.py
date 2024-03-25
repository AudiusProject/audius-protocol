import datetime
import logging
import time

from src.tasks.celery_app import celery
from src.utils.get_all_nodes import (
    ALL_CONTENT_NODES_CACHE_KEY,
    ALL_DISCOVERY_NODES_CACHE_KEY,
    ALL_HEALTHY_CONTENT_NODES_CACHE_KEY,
    filter_healthy_content_nodes,
    get_all_content_nodes,
    get_all_discovery_nodes,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_cache import set_json_cached_key

logger = logging.getLogger(__name__)


# ####### CELERY TASKS ####### #
@celery.task(name="cache_current_nodes", bind=True)
@save_duration_metric(metric_group="celery_task")
def cache_current_nodes_task(self):
    redis = cache_current_nodes_task.redis
    interval = datetime.timedelta(minutes=2)
    start_time = time.time()
    errored = False
    try:
        logger.info("cache_current_nodes.py | fetching all other discovery nodes")
        (
            discovery_node_endpoints,
            discovery_nodes_wallets,
        ) = get_all_discovery_nodes()
        discovery_nodes = [
            {"endpoint": endpoint, "delegateOwnerWallet": delegateOwnerWallet}
            for endpoint, delegateOwnerWallet in zip(
                discovery_node_endpoints, discovery_nodes_wallets
            )
        ]
        set_json_cached_key(redis, ALL_DISCOVERY_NODES_CACHE_KEY, discovery_nodes)
        logger.info("cache_current_nodes.py | set current discovery nodes in redis")

        logger.info("cache_current_nodes.py | fetching all other content nodes")
        content_node_endpoints, content_node_wallets = get_all_content_nodes()
        content_nodes = [
            {"endpoint": endpoint, "delegateOwnerWallet": delegateOwnerWallet}
            for endpoint, delegateOwnerWallet in zip(
                content_node_endpoints, content_node_wallets
            )
        ]

        set_json_cached_key(redis, ALL_CONTENT_NODES_CACHE_KEY, content_nodes)
        logger.info("cache_current_nodes.py | set current content nodes in redis")

        logger.info("cache_current_nodes.py | checking content nodes for liveness")
        healthy_content_nodes = filter_healthy_content_nodes(content_nodes)

        set_json_cached_key(
            redis, ALL_HEALTHY_CONTENT_NODES_CACHE_KEY, healthy_content_nodes
        )
        logger.info("cache_current_nodes.py | set alive content nodes in redis")
    except Exception as e:
        logger.error(f"{self.name}.py | Fatal error in main loop", exc_info=True)
        errored = True
        raise e
    finally:
        end_time = time.time()
        elapsed = end_time - start_time
        time_left = max(0, interval.total_seconds() - elapsed)
        logger.info(
            {
                "task_name": self.name,
                "elapsed": elapsed,
                "interval": interval.total_seconds(),
                "time_left": time_left,
                "errored": errored,
            },
        )
        celery.send_task(self.name, countdown=time_left)
