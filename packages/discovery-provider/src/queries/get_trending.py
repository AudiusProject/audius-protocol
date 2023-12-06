import logging

from src.api.v1.helpers import extend_track, format_limit, format_offset
from src.gated_content.gated_content_constants import (
    SHOULD_TRENDING_EXCLUDE_PREMIUM_TRACKS,
)
from src.queries.generate_unpopulated_trending_tracks import TRENDING_TRACKS_LIMIT
from src.queries.get_trending_tracks import get_trending_tracks
from src.utils.helpers import decode_string_id  # pylint: disable=C0302

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
        "limit": format_limit(args, TRENDING_TRACKS_LIMIT),
        "offset": format_offset(args),
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
