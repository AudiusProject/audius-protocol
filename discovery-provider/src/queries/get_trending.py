import logging  # pylint: disable=C0302

from src.queries.get_trending_tracks import get_trending_tracks, TRENDING_LIMIT
from src.api.v1.helpers import extend_track, decode_string_id

logger = logging.getLogger(__name__)

def get_trending(args, strategy):
    """Get Trending, shared between full and regular endpoints."""
    # construct args
    time = args.get("time") if args.get("time") is not None else 'week'
    current_user_id = args.get("user_id")
    args = {
        'time': time,
        'genre': args.get("genre", None),
        'with_users': True,
        'limit': TRENDING_LIMIT,
        'offset': 0
    }

    # decode and add user_id if necessary
    if current_user_id:
        decoded_id = decode_string_id(current_user_id)
        args["current_user_id"] = decoded_id

    tracks = get_trending_tracks(args, strategy)
    return list(map(extend_track, tracks))
