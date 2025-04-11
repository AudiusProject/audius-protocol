import logging
import re
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests

from src.utils.get_all_nodes import get_all_healthy_content_nodes_cached
from src.utils.redis_connection import get_redis
from src.utils.rendezvous import RendezvousHash

logger = logging.getLogger(__name__)


def get_track_inspect_info(
    cid: str, track_id: Optional[int] = None, redis_instance=None
) -> Optional[Dict[str, Any]]:
    """
    Gets the blob info for a track from content nodes.

    Args:
        cid: The CID of the track to inspect
        track_id: Optional track ID for logging purposes
        redis_instance: Optional redis instance to use. If not provided, a new connection will be made.

    Returns:
        The raw blob info if found, None otherwise
    """
    redis = redis_instance or get_redis()
    path = f"internal/blobs/info/{cid}"
    redis_key = f"track_cid:{cid}"

    # Try cached content node first
    cached_content_node = redis.get(redis_key)
    if cached_content_node:
        cached_content_node = cached_content_node.decode("utf-8")
        try:
            response = requests.get(urljoin(cached_content_node, path))
            if response:
                return response.json()
        except Exception as e:
            logger.error(f"Could not locate cid {cid} on cached node: {e}")

    # Get healthy nodes
    healthy_nodes = get_all_healthy_content_nodes_cached(redis)
    if not healthy_nodes:
        error_msg = "No healthy Content Nodes found when fetching"
        if track_id:
            error_msg += f" track ID {track_id}"
        error_msg += ". Please investigate."
        logger.error(f"tracks.py | stream | {error_msg}")
        return None

    # Try all content nodes using rendezvous hashing
    rendezvous = RendezvousHash(
        *[re.sub("/$", "", node["endpoint"].lower()) for node in healthy_nodes]
    )
    content_nodes = rendezvous.get_n(9999999, cid)

    for content_node in content_nodes:
        try:
            response = requests.get(urljoin(content_node, path))
            if response:
                return response.json()
        except Exception as e:
            logger.error(f"Could not locate cid {cid} on {content_node}: {e}")

    return None
