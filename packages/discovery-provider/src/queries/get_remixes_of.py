from flask.globals import request
from sqlalchemy import and_, case, desc, func

from src import exceptions
from src.models.social.repost import Repost, RepostType
from src.models.social.save import Save, SaveType
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.remix import Remix
from src.models.tracks.track import Track
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import (
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.utils.redis_cache import extract_key, use_redis_cache

UNPOPULATED_REMIXES_CACHE_DURATION_SEC = 10


def make_cache_key(args):
    cache_keys = {
        "limit": args.get("limit"),
        "offset": args.get("offset"),
        "track_id": args.get("track_id"),
    }
    return extract_key(f"unpopulated-remix-parents:{request.path}", cache_keys.items())


def get_remixes_of(args):
    track_id = args.get("track_id")
    current_user_id = args.get("current_user_id")
    limit, offset = args.get("limit"), args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:

        def get_unpopulated_remixes():
            # Fetch the parent track to get the track's owner id
            parent_track_res = get_unpopulated_tracks(
                session=session,
                track_ids=[track_id],
                filter_deleted=False,
                filter_unlisted=False,
            )

            if not parent_track_res or parent_track_res[0] is None:
                raise exceptions.ArgumentError("Invalid track_id provided")

            parent_track = parent_track_res[0]

            # Return empty list of remixes if track is gated on conditions other than USDC purchase
            if (
                parent_track["is_premium"]
                and "usdc_purchase" not in parent_track["premium_conditions"]
            ):
                return ([], [], 0)

            track_owner_id = parent_track["owner_id"]

            # Get the 'children' remix tracks
            # Use the track owner id to fetch reposted/saved tracks returned first
            base_query = (
                session.query(Track)
                .join(
                    Remix,
                    and_(
                        Remix.child_track_id == Track.track_id,
                        Remix.parent_track_id == track_id,
                    ),
                )
                .outerjoin(
                    Save,
                    and_(
                        Save.save_item_id == Track.track_id,
                        Save.save_type == SaveType.track,
                        Save.is_current == True,
                        Save.is_delete == False,
                        Save.user_id == track_owner_id,
                    ),
                )
                .outerjoin(
                    Repost,
                    and_(
                        Repost.repost_item_id == Track.track_id,
                        Repost.user_id == track_owner_id,
                        Repost.repost_type == RepostType.track,
                        Repost.is_current == True,
                        Repost.is_delete == False,
                    ),
                )
                .outerjoin(
                    AggregateTrack,
                    AggregateTrack.track_id == Track.track_id,
                )
                .filter(
                    Track.is_current == True,
                    Track.is_delete == False,
                    Track.is_unlisted == False,
                )
                # 1. Co-signed tracks ordered by save + repost count
                # 2. Other tracks ordered by save + repost count
                .order_by(
                    desc(
                        # If there is no "co-sign" for the track (no repost or save from the parent owner),
                        # defer to secondary sort
                        case(
                            [
                                (
                                    and_(
                                        Repost.created_at == None,
                                        Save.created_at == None,
                                    ),
                                    0,
                                ),
                            ],
                            else_=(
                                func.coalesce(AggregateTrack.repost_count, 0)
                                + func.coalesce(AggregateTrack.save_count, 0)
                            ),
                        )
                    ),
                    # Order by saves + reposts
                    desc(
                        func.coalesce(AggregateTrack.repost_count, 0)
                        + func.coalesce(AggregateTrack.save_count, 0)
                    ),
                    # Ties, pick latest track id
                    desc(Track.track_id),
                )
            )

            (tracks, count) = add_query_pagination(
                base_query, limit, offset, True, True
            )
            tracks = tracks.all()
            tracks = helpers.query_result_to_list(tracks)
            track_ids = list(map(lambda track: track["track_id"], tracks))
            return (tracks, track_ids, count)

        key = make_cache_key(args)
        (tracks, track_ids, count) = use_redis_cache(
            key, UNPOPULATED_REMIXES_CACHE_DURATION_SEC, get_unpopulated_remixes
        )

        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        if args.get("with_users", False):
            add_users_to_tracks(session, tracks, current_user_id)

    return {"tracks": tracks, "count": count}
