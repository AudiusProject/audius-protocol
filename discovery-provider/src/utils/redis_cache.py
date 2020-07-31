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
# API_V1:path:queryparams

cache_prefix = "API_V1_ROUTE"
# query params to always exclude from key construction
exclude_param_set = {"app_name"}
default_ttl_sec = 60

def extract_key():
    path = request.path
    req_args = request.args.items()
    req_args = filter(lambda x: x[0] not in exclude_param_set, req_args)
    req_args = sorted(req_args)
    req_args = "&".join(["{}={}".format(x[0], x[1]) for x in req_args])
    key = f"{cache_prefix}:{path}:{req_args}"
    return key

def cache(**kwargs):
    """
    Cache decorator.
    Should be called with `@cache(ttl_sec=123)`

    Decorators in Python are just higher-order-functions that accept a function
    as a single parameter, and return a function that wraps the input function.

    In this case, because we need to pass kwargs into our decorator function,
    we need an additional layer of wrapping; the outermost function accepts the kwargs,
    and when called, returns the decorating function `outer_wrap`, which in turn returns
    the wrapped input function, `inner_wrap`.

    @functools.wraps simply ensures that if Python introspects `inner_wrap`, it refers to
    `func` rather than `inner_wrap`.
    """
    ttl_sec = kwargs["ttl_sec"] if "ttl_sec" in kwargs else default_ttl_sec
    def outer_wrap(func):
        @functools.wraps(func)
        def inner_wrap(*args, **kwargs):
            key = extract_key()
            cached_resp = REDIS.get(key)

            if (cached_resp):
                deserialized = json.loads(cached_resp)
                return deserialized, 200

            resp, status = func(*args, **kwargs)
            if status == 200:
                serialized = dumps(resp)
                REDIS.set(key, serialized, ttl_sec)
            return resp, status
        return inner_wrap
    return outer_wrap
