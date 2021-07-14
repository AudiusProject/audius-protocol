import logging
from flask import Blueprint, request
from src.queries.get_user_signals import get_user_signals
from src.api_helpers import success_response, error_response
from src.utils.redis_cache import cache, internal_api_cache_prefix

logger = logging.getLogger(__name__)

bp = Blueprint("user_signals", __name__)


@bp.route("/user_signals", methods=["GET"])
@cache(ttl_sec=30, cache_prefix_override=internal_api_cache_prefix)
def user_signals():
    handle = request.args.get("handle")
    if not handle:
        return error_response("Please pass in a handle")
    try:
        response = get_user_signals(handle)
        return success_response(response)
    except Exception as e:
        return error_response(f"Request failed: {e}")
