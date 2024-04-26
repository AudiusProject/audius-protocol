import logging
import os
from typing import Tuple

import requests
from flask import Request

from src.utils import redis_connection
from src.utils.auth_helpers import decode_basic_auth, dev_mode
from src.utils.get_all_nodes import get_all_content_nodes_cached
from src.utils.helpers import get_ip

logger = logging.getLogger(__name__)

# delegateOwnerWallet -> endpoint
# for efficient access to node via address
content_node_dict: dict[str, str] = {}


def get_content_node_endpoint_by_wallet(wallet: str) -> str:
    # if not hydrated, read the cache and populate
    if not content_node_dict:
        redis = redis_connection.get_redis()
        content_nodes = get_all_content_nodes_cached(redis)
        for node in content_nodes:
            content_node_dict[node["delegateOwnerWallet"]] = node["endpoint"]
    return content_node_dict.get(wallet)


# checks for a valid ip location request
# validates that request came from a registered node
# returns the ip or if it's in dev mode
def validate_ip_location_request(request_obj) -> Tuple[str, bool]:
    ip = get_ip(request_obj)

    if not ip:
        raise Exception("expected ip but got none")

    signature = request_obj.headers.get("Authorization")

    node_addr = decode_basic_auth(signature)
    if node_addr is dev_mode:
        return "", True

    node_endpoint = get_content_node_endpoint_by_wallet(node_addr)
    if not node_endpoint:
        raise Exception(f"content node for address {node_addr} not found")

    return ip, False


def get_ip_with_location(request_obj: Request):
    """Gets the IP address along with location from a request using the X-Forwarded-For header if present"""
    env = os.getenv("audius_discprov_env")
    ip, is_dev_mode = validate_ip_location_request(request_obj)

    # the content node is in dev, env not set, or env is set to dev
    is_dev_mode = is_dev_mode or not env or env == "dev"

    if is_dev_mode:
        # return expected location structure for dev purposes
        # but don't use api key
        return {"region": "The Lake Country", "city": "Theed", "country_name": "Naboo"}

    api_key = os.getenv("audius_ipdata_api_key")
    if not api_key:
        raise Exception("ip_data | ip location data requested from unconfigured node")

    url = f"https://api.ipdata.co/{ip}"
    response = requests.get(url, params={"api-key": api_key})
    data = response.json()

    return data
