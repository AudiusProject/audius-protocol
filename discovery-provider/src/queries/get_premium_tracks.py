import logging  # pylint: disable=C0302

from src.api.v1.helpers import extend_track, to_dict
from src.queries.get_trending_tracks import TRENDING_TTL_SEC, get_trending_tracks
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import get_trending_cache_key, use_redis_cache

logger = logging.getLogger(__name__)

DEFAULT_PREMIUM_TRACKS_LIMIT = 50


def get_usdc_purchase_tracks(args, strategy):
    """Gets USDC purchase tracks from trending by getting the currently cached tracks and then populating them."""
    current_user_id = args.get("user_id")
    args = {
        "time": args.get("time", "week"),
        "genre": args.get("genre", None),
        "limit": args.get("limit"),
        "offset": 0,
        "exclude_premium": False,
        "usdc_purchase_only": True,
        "with_users": True,
    }

    # decode and add user_id if necessary
    if current_user_id:
        args["current_user_id"] = decode_string_id(current_user_id)

    tracks = get_trending_tracks(args, strategy)
    return list(map(extend_track, tracks))


def get_full_usdc_purchase_tracks(request, args, strategy):
    # Attempt to use the cached tracks list
    if args["user_id"] is not None:
        full_usdc_purchase_tracks = get_usdc_purchase_tracks(args, strategy)
    else:
        key = get_trending_cache_key(to_dict(request.args), request.path)
        full_usdc_purchase_tracks = use_redis_cache(
            key, TRENDING_TTL_SEC, lambda: get_usdc_purchase_tracks(args, strategy)
        )
    return full_usdc_purchase_tracks
