import logging
from typing import TypedDict

from sqlalchemy import and_, or_  # pylint: disable=C0302

from src.models.playlists.playlist import Playlist
from src.models.social.repost import RepostType
from src.models.social.save import SaveType
from src.models.tracks.track import Track
from src.models.users.usdc_purchase import USDCPurchase
from src.queries.query_helpers import (
    add_query_pagination,
    populate_playlist_metadata,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


class GetUserPurchasedContentArgs(TypedDict):
    current_user_id: int
    user_id: int
    limit: int
    offset: int


def _get_user_purchasable_content(session, args: GetUserPurchasedContentArgs):
    """Fetch tracks owned by the given user that have been remixed by other users."""

    user_id = args.get("user_id")

    query = (
        session.query(USDCPurchase, Track, Playlist)
        .outerjoin(
            Track,
            and_(
                USDCPurchase.content_type == "track",
                USDCPurchase.content_id == Track.track_id,
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
            ),
        )
        .outerjoin(
            Playlist,
            and_(
                USDCPurchase.content_type == "playlist",
                USDCPurchase.content_id == Playlist.playlist_id,
                Playlist.is_current == True,
                Playlist.is_delete == False,
                Playlist.is_private == False,
            ),
        )
        .distinct(Track.track_id, Playlist.playlist_id)
        .filter(
            USDCPurchase.seller_user_id == user_id,
            # Drop rows that have no join found for either track or playlist
            or_(Track.track_id != None, Playlist.playlist_id != None),
            or_(Track.owner_id == user_id, Playlist.playlist_owner_id == user_id),
        )
        .order_by(
            USDCPurchase.created_at.desc(),
            USDCPurchase.content_id.desc(),
            USDCPurchase.content_type.desc(),
        )
    )

    return query


def get_user_purchasable_content(args: GetUserPurchasedContentArgs):
    user_purchasable_content = []
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    db = get_db_read_replica()

    with db.scoped_session() as session:
        query = _get_user_purchasable_content(session, args)
        query_results = add_query_pagination(query, limit, offset).all()
        purchasable_content = helpers.query_result_to_list(query_results)

        tracks = helpers.query_result_to_list(
            filter(None, [item[1] for item in purchasable_content])
        )
        playlists = helpers.query_result_to_list(
            filter(None, [item[2] for item in purchasable_content])
        )

        track_ids = [track["track_id"] for track in tracks]
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        playlist_ids = [playlist["playlist_id"] for playlist in playlists]
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id,
        )

        unsorted_purchasable_content = tracks + playlists

        user_purchasable_content = sorted(
            unsorted_purchasable_content,
            key=lambda x: x["created_at"],
            reverse=True,
        )

    return user_purchasable_content
