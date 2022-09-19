import logging

from src.api.v1.helpers import extend_track, format_limit, format_offset, to_dict
from src.premium_content.premium_content_constants import (
    SHOULD_TRENDING_EXCLUDE_PREMIUM_TRACKS,
)
from src.queries.get_trending_tracks import (
    TRENDING_LIMIT,
    TRENDING_TTL_SEC,
    get_trending_tracks,
)
from src.utils.helpers import decode_string_id  # pylint: disable=C0302
from src.utils.redis_cache import get_trending_cache_key, use_redis_cache

logger = logging.getLogger(__name__)


def get_trending(args, strategy):
    """Get Trending, shared between full and regular endpoints."""
    # construct args
    time = args.get("time") if args.get("time") is not None else "week"
    current_user_id = args.get("user_id")
    args = {
        "time": time,
        "genre": args.get("genre", None),
        "with_users": True,
        "limit": TRENDING_LIMIT,
        "offset": 0,
        "exclude_premium": args.get(
            "exclude_premium", SHOULD_TRENDING_EXCLUDE_PREMIUM_TRACKS
        ),
    }

    # decode and add user_id if necessary
    if current_user_id:
        decoded_id = decode_string_id(current_user_id)
        args["current_user_id"] = decoded_id

    tracks = get_trending_tracks(args, strategy)
    return list(map(extend_track, tracks))


def get_full_trending(request, args, strategy):
    offset = format_offset(args)
    limit = format_limit(args, TRENDING_LIMIT)
    key = get_trending_cache_key(to_dict(request.args), request.path)

    # Attempt to use the cached tracks list
    if args["user_id"] is not None:
        full_trending = get_trending(args, strategy)
    else:
        full_trending = use_redis_cache(
            key, TRENDING_TTL_SEC, lambda: get_trending(args, strategy)
        )
    trending_tracks = full_trending[offset : limit + offset]
    return trending_tracks
