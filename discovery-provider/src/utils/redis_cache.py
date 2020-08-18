import logging  # pylint: disable=C0302
import functools
import json
from flask.json import dumps
from flask.globals import request
from src.utils import redis_connection
from src.utils.query_params import stringify_query_params
logger = logging.getLogger(__name__)

# Redis Key Convention:
# API_V1:path:queryparams

cache_prefix = "API_V1_ROUTE"
default_ttl_sec = 60


def extract_key():
    path = request.path
    req_args = request.args.items()
    req_args = stringify_query_params(req_args)
    key = f"{cache_prefix}:{path}:{req_args}"
    return key


def cache(**kwargs):
    """
    Cache decorator.
    Should be called with `@cache(ttl_sec=123, transform=transform_response)`

    Arguments:
        ttl_sec: optional,number The time in seconds to cache the response if
            status code < 400
        transform: optional,func The transform function of the wrapped function
            to convert the function response to request response

    Usage Notes:
        If the wrapper function returns a tuple, the transform function will not
        be run on the response. The first item of the tuple must be serializable.

        If the wrapper function returns a single response, the transform function
        must be passed to the decorator. The wrapper function response must be
        serializable.

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
    transform = kwargs["transform"] if "transform" in kwargs else None
    redis = redis_connection.get_redis()

    def outer_wrap(func):
        @functools.wraps(func)
        def inner_wrap(*args, **kwargs):
            key = extract_key()
            cached_resp = redis.get(key)

            if cached_resp:
                deserialized = json.loads(cached_resp)
                if transform is not None:
                    return transform(deserialized)
                return deserialized, 200

            response = func(*args, **kwargs)

            if len(response) == 2:
                resp, status_code = response
                if status_code < 400:
                    serialized = dumps(resp)
                    redis.set(key, serialized, ttl_sec)
                return resp, status_code
            serialized = dumps(response)
            redis.set(key, serialized, ttl_sec)
            return transform(response)
        return inner_wrap
    return outer_wrap
