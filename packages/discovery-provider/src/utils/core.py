import json
import logging
from typing import Optional, TypedDict

from src.utils.redis_connection import get_redis

logger = logging.getLogger(__name__)


class CoreHealth(TypedDict):
    indexing_plays: bool
    indexing_entity_manager: bool
    latest_chain_block: int
    latest_chain_block_ts: int
    latest_indexed_block: int
    chain_id: str


core_health_check_cache_key = "core:indexer:health"
core_listens_health_check_cache_key = "core:indexer:health:listens"
core_em_health_check_cache_key = "core:indexer:health:em"


def get_core_health() -> Optional[CoreHealth]:
    redis = get_redis()
    try:
        core_health = redis.get(core_health_check_cache_key)
        if core_health:
            return json.loads(core_health)
        return None
    except Exception as e:
        logger.error(f"get_health.py | could not get core health {e}")
        return None
