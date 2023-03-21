import logging

from src.tasks.celery_app import celery
from src.utils.get_all_other_nodes import (
    ALL_NODES_CACHE_KEY,
    get_all_other_nodes,
    get_node_endpoint,
)
from src.utils.prometheus_metric import save_duration_metric
from src.utils.redis_cache import set_json_cached_key
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)


# ####### CELERY TASKS ####### #
@celery.task(name="cache_current_nodes")
@save_duration_metric(metric_group="celery_task")
def cache_current_nodes_task(self):
    try:
        nodes = get_all_other_nodes()[0]
        current_node = get_node_endpoint()
        # add current node to list
        if current_node is not None:
            nodes.append(current_node)

        # only get redis connection after nodes are collected
        redis = get_redis()
        set_json_cached_key(redis, ALL_NODES_CACHE_KEY, nodes)
    except Exception as e:
        logger.error(f"get_all_other_nodes.py | ERROR caching node info {e}")
