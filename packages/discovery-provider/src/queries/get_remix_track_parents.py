import logging  # pylint: disable=C0302

from flask.globals import request
from sqlalchemy import and_, desc

from src.models.tracks.remix import Remix
from src.models.tracks.track import Track
from src.queries.query_helpers import (
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import extract_key, use_redis_cache

logger = logging.getLogger(__name__)

UNPOPULATED_REMIX_PARENTS_CACHE_DURATION_SEC = 10


def make_cache_key(args):
    cache_keys = {
        "limit": args.get("limit"),
        "offset": args.get("offset"),
        "track_id": args.get("track_id"),
    }
    return extract_key(f"unpopulated-remix-parents:{request.path}", cache_keys.items())


def get_remix_track_parents(args):
    """Fetch remix parents for a given track.

    Args:
        args:dict
        args.track_id: track id
        args.limit: limit
        args.offset: offset
        args.with_users: with users
        args.current_user_id: current user ID
    """
    track_id = args.get("track_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:

        def get_unpopulated_remix_parents():
            track = (
                session.query(Track)
                .filter(Track.track_id == track_id)
                .filter(Track.is_current == True)
                .filter(Track.stream_conditions is None)
            ).one_or_none()
            if not track:
                return [], []

            base_query = (
                session.query(Track)
                .join(
                    Remix,
                    and_(
                        Remix.parent_track_id == Track.track_id,
                        Remix.child_track_id == track_id,
                    ),
                )
                .filter(Track.is_current == True, Track.is_unlisted == False)
                .order_by(desc(Track.created_at), desc(Track.track_id))
            )

            tracks = add_query_pagination(base_query, limit, offset).all()
            tracks = helpers.query_result_to_list(tracks)
            track_ids = list(map(lambda track: track["track_id"], tracks))
            return (tracks, track_ids)

        key = make_cache_key(args)
        (tracks, track_ids) = use_redis_cache(
            key,
            UNPOPULATED_REMIX_PARENTS_CACHE_DURATION_SEC,
            get_unpopulated_remix_parents,
        )

        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        if args.get("with_users", False):
            add_users_to_tracks(session, tracks, current_user_id)

    return tracks
