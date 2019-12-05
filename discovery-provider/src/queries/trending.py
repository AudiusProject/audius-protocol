import logging # pylint: disable=C0302
import redis
import json
import sqlalchemy

from flask import Blueprint, request
from urllib.parse import urljoin, unquote

from src import api_helpers
from src.models import User, Track, RepostType, Follow, SaveType
from src.utils.db_session import get_db
from src.utils.config import shared_config
from src.queries import response_name_constants
from src.queries.query_helpers import get_repost_counts, get_pagination_vars, get_save_counts, get_genre_list
from src.tasks.generate_trending import generate_trending

logger = logging.getLogger(__name__)
bp = Blueprint("trending", __name__)

REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

######## ROUTES ########

@bp.route("/trending/<time>", methods=("GET",))
def trending(time):
    (limit, offset) = get_pagination_vars()
    genre = request.args.get("genre", default=None, type=str)
    if genre is not None:
        final_resp = generate_trending(get_db(), time, genre, limit, offset)
        return api_helpers.success_response(final_resp)
    else:
        redis_key = f"trending-{time}"
        redis_cache_value = REDIS.get(redis_key)
        logger.error(redis_cache_value)
        if redis_cache_value is not None:
            json_cache = json.loads(redis_cache_value.decode('utf-8'))
            if json_cache is not None:
                num_cached_entries = len(json_cache['listen_counts'])
                if limit <= num_cached_entries:
                    json_cache['listen_counts'] = json_cache['listen_counts'][offset:limit]
                    logger.error(f'Returning cache for {redis_key}')
                    return api_helpers.success_response(json_cache)
    final_resp = generate_trending(get_db(), time, genre, limit, offset)
    return api_helpers.success_response(final_resp)
