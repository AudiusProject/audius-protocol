import logging  # pylint: disable=C0302
import random

from src.api.v1.helpers import extend_track, to_dict
from src.queries.generate_unpopulated_trending_tracks import TRENDING_TRACKS_TTL_SEC
from src.queries.get_trending_tracks import get_trending_tracks
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import get_trending_cache_key, use_redis_cache

logger = logging.getLogger(__name__)

DEFAULT_RECOMMENDED_LIMIT = 10


def get_recommended_tracks(args, strategy):
    """Gets recommended tracks from trending by getting the currently cached tracks and then populating them."""
    exclusion_list = args.get("exclusion_list") or []
    time = args.get("time") if args.get("time") is not None else "week"
    current_user_id = args.get("user_id")
    args = {
        "time": time,
        "genre": args.get("genre", None),
        "with_users": True,
        "limit": args.get("limit"),
        "offset": 0,
        "exclude_gated": True,
    }

    # decode and add user_id if necessary
    if current_user_id:
        args["current_user_id"] = decode_string_id(current_user_id)

    tracks = get_trending_tracks(args, strategy)
    filtered_tracks = list(
        filter(lambda track: track["track_id"] not in exclusion_list, tracks)
    )

    random.shuffle(filtered_tracks)
    return list(map(extend_track, filtered_tracks))


def get_full_recommended_tracks(request, args, strategy):
    # Attempt to use the cached tracks list
    if args["user_id"] is not None:
        full_recommended = get_recommended_tracks(args, strategy)
    else:
        key = get_trending_cache_key(to_dict(request.args), request.path)
        full_recommended = use_redis_cache(
            key, TRENDING_TRACKS_TTL_SEC, lambda: get_recommended_tracks(args, strategy)
        )
    return full_recommended
