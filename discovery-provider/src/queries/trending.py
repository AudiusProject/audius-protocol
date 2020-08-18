import logging  # pylint: disable=C0302
import json
import redis

from flask import Blueprint, request

from src import api_helpers
from src.utils.db_session import get_db_read_replica
from src.utils.config import shared_config
from src.queries.query_helpers import get_pagination_vars
from src.tasks.generate_trending import generate_trending, trending_cache_hits_key, \
    trending_cache_miss_key, trending_cache_total_key

logger = logging.getLogger(__name__)
bp = Blueprint("trending", __name__)

REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

######## ROUTES ########


@bp.route("/trending/<time>", methods=("GET",))
def trending(time):
    (limit, offset) = get_pagination_vars()
    # Increment total trending count
    REDIS.incr(trending_cache_total_key, 1)

    genre = request.args.get("genre", default=None, type=str)
    if genre is None:
        redis_key = f"trending-{time}"
        redis_cache_value = REDIS.get(redis_key)
        if redis_cache_value is not None:
            json_cache = json.loads(redis_cache_value.decode('utf-8'))
            if json_cache is not None:
                num_cached_entries = len(json_cache['listen_counts'])
                logger.info(
                    f'Cache for {redis_key}, {num_cached_entries} entries, request limit {limit}')
                if offset + limit <= num_cached_entries:
                    json_cache['listen_counts'] = json_cache['listen_counts'][offset:offset + limit]
                    logger.info(f'Returning cache for {redis_key}')
                    # Increment cache hit count
                    REDIS.incr(trending_cache_hits_key, 1)
                    return api_helpers.success_response(json_cache)
    # Increment cache miss count
    REDIS.incr(trending_cache_miss_key, 1)
    # Recalculate trending values if necessary
    final_resp = generate_trending(
        get_db_read_replica(), time, genre, limit, offset)
    return api_helpers.success_response(final_resp)
