import redis
import logging # pylint: disable=C0302
import json
import functools
from src.utils.config import shared_config
from flask.json import dumps
from flask.globals import request
logger = logging.getLogger(__name__)

REDIS_URL = shared_config["redis"]["url"]
REDIS = redis.Redis.from_url(url=REDIS_URL)

# Redis Key Convention:
# API_V1:path:queryparams:headers

cache_prefix = "API_V1_ROUTE"
# query params to always exclude from key construction
exclude_param_set = {"app_name"}
# headers to always include in key construction
required_headers_set = {"X-User-ID"}
default_ttl_sec = 60


def extract_key():
    path = request.path
    req_args = request.args.items()
    req_args = filter(lambda x: x[0] not in exclude_param_set, req_args)
    req_args = sorted(req_args)
    req_args = "&".join(["{}={}".format(x[0], x[1]) for x in req_args])
    headers = []
    for required_header in required_headers_set:
        val = request.headers.get(required_header)
        if val:
            headers.append((required_header, val))
    headers_str = "&".join(["{}={}".format(x[0], x[1]) for x in headers])

    key = f"{cache_prefix}:{path}:{req_args}:{headers_str}"
    return key

# Cache decorator.
def cached(**kwargs):
    ttl_sec = kwargs["ttl_sec"] if "ttl_sec" in kwargs else default_ttl_sec
    def outer_wrap(func):
        @functools.wraps(func)
        def inner_wrap(*args, **kwargs):
            key = extract_key()
            cached_resp = REDIS.get(key)

            if (cached_resp):
                logger.warn("GOT CACHED RESP!")
                deserialized = json.loads(cached_resp)
                return deserialized, 200

            resp, status = func(*args, **kwargs)
            if status == 200:
                serialized = dumps(resp)
                logger.warning("Caching for {}".format(ttl_sec))
                REDIS.set(key, serialized, ttl_sec)
            return resp, status
        return inner_wrap
    return outer_wrap