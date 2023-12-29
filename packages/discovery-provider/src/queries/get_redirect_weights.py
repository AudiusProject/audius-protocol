import logging

import requests
from flask import Blueprint

from src.api_helpers import success_response
from src.utils.get_all_other_nodes import get_all_discovery_nodes_cached
from src.utils.redis_cache import cache, internal_api_cache_prefix
from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)

bp = Blueprint("redirect_weights", __name__)


@bp.route("/redirect_weights", methods=["GET"])
@cache(ttl_sec=10 * 60, cache_prefix_override=internal_api_cache_prefix)
def redirect_weights():
    redis = get_redis()
    nodes = get_all_discovery_nodes_cached(redis)
    endpoints = [d["endpoint"] for d in nodes] if nodes else []
    loads = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{endpoint}/request_count")
            if response.status_code == 200:
                loads[endpoint] = int(response.text)
        except requests.exceptions.ConnectionError:
            pass

    if len(loads) == 0:
        loads = {endpoint: 1 for endpoint in endpoints}

    max_load = max(loads.values(), default=1)
    redirect_weights = {}
    for endpoint, load in loads.items():
        redirect_weights[endpoint] = (max_load - load) + 5

    return success_response(redirect_weights, sign_response=False)
