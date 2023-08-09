import enum
from typing import Optional, TypedDict

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import aliased, contains_eager

from src.models.playlists.aggregate_playlist import AggregatePlaylist
from src.models.playlists.playlist import Playlist
from src.models.social.repost import Repost, RepostType
from src.models.social.save import Save, SaveType
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.get_playlists import add_users_to_playlists
from src.queries.query_helpers import (
    CollectionLibrarySortMethod,
    LibraryFilterType,
    SortDirection,
    add_query_pagination,
    populate_playlist_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class CollectionType(str, enum.Enum):
    playlist = "playlist"
    album = "album"


class GetCollectionLibraryArgs(TypedDict):
    # The current user logged in (from route param)
    user_id: int

    collection_type: CollectionType

    # The maximum number of listens to return
    limit: int

    # The offset for the listen history
    offset: int

    filter_type: LibraryFilterType

    # Optional filter for the returned results
    query: Optional[str]

    sort_direction: Optional[SortDirection]
    sort_method: Optional[CollectionLibrarySortMethod]


# Most of the code in this file is copied from/similar to src/queries/get_track_library.py -
# see that file for more in depth comments about query structure etc
def _get_collection_library(args: GetCollectionLibraryArgs, session):
    user_id = args["user_id"]
    limit = args["limit"]
    offset = args["offset"]
    collection_type = args["collection_type"]
    filter_type = args["filter_type"]

    query = args.get("query")
    sort_method = args.get("sort_method", CollectionLibrarySortMethod.added_date)
    sort_direction = args.get("sort_direction", SortDirection.desc)

    # Doesn't yet support album/playlist purchases
    if not filter_type or filter_type == LibraryFilterType.purchase:
        raise ValueError("Invalid filter type")

    sort_fn = desc if sort_direction == SortDirection.desc else asc

    own_playlists_base = session.query(
        Playlist, Playlist.created_at.label("item_created_at")
    ).filter(
        Playlist.is_current == True,
        Playlist.is_album == (collection_type == CollectionType.album),
        Playlist.playlist_owner_id == user_id,
    )

    favorites_base = (
        session.query(Playlist, Save.created_at.label("item_created_at"))
        .join(Save, Save.save_item_id == Playlist.playlist_id)
        .filter(
            Playlist.is_current == True,
            Playlist.is_private == False,
            Playlist.is_album == (collection_type == CollectionType.album),
            Save.user_id == user_id,
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == SaveType[collection_type],
        )
    )

    reposts_base = (
        session.query(Playlist, Repost.created_at.label("item_created_at"))
        .join(Repost, Repost.repost_item_id == Playlist.playlist_id)
        .filter(
            Playlist.is_current == True,
            Playlist.is_private == False,
            Playlist.is_album == (collection_type == CollectionType.album),
            Repost.user_id == user_id,
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.repost_type == RepostType[collection_type],
        )
    )

    # Favorites are unioned with own playlists by design
    favorites_subquery = (
        favorites_base.union_all(own_playlists_base)
        .distinct(Playlist.playlist_id)
        .order_by(Playlist.playlist_id)
    ).subquery()

    reposts_subquery = (reposts_base).subquery()

    all_subquery = (
        favorites_base.union_all(reposts_base, own_playlists_base)
        .distinct(Playlist.playlist_id)
        .order_by(Playlist.playlist_id)
    ).subquery()

    base_query = {
        LibraryFilterType.all: all_subquery,
        LibraryFilterType.favorite: favorites_subquery,
        LibraryFilterType.repost: reposts_subquery,
    }[filter_type]

    PlaylistAlias = aliased(Playlist, base_query)

    base_query = session.query(
        PlaylistAlias, base_query.c.item_created_at.label("item_created_at")
    )

    if query:
        # Need to disable lazy join for this to work
        base_query = (
            base_query.join(User, PlaylistAlias.playlist_owner_id == User.user_id)
            .filter(
                or_(
                    PlaylistAlias.playlist_name.ilike(f"%{query.lower()}%"),
                    User.name.ilike(f"%{query.lower()}%"),
                )
            )
            .options(contains_eager(PlaylistAlias.user))
        )

    # Set sort methods
    if sort_method == CollectionLibrarySortMethod.added_date:
        base_query = base_query.order_by(
            sort_fn("item_created_at"), desc(PlaylistAlias.playlist_id)
        )
    elif sort_method == CollectionLibrarySortMethod.reposts:
        base_query = base_query.join(
            AggregatePlaylist,
            AggregatePlaylist.playlist_id == PlaylistAlias.playlist_id,
        ).order_by(sort_fn(AggregatePlaylist.repost_count))

    elif sort_method == CollectionLibrarySortMethod.saves:
        base_query = base_query.join(
            AggregatePlaylist,
            AggregatePlaylist.playlist_id == PlaylistAlias.playlist_id,
        ).order_by(sort_fn(AggregatePlaylist.save_count))

    query_results = add_query_pagination(base_query, limit, offset).all()

    if not query_results:
        return []

    playlists, activity_timestamp = zip(*query_results)
    playlists = helpers.query_result_to_list(playlists)
    playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

    # Populate playlists
    playlists = populate_playlist_metadata(
        session,
        playlist_ids,
        playlists,
        [
            RepostType.playlist
            if collection_type == CollectionType.playlist
            else RepostType.album
        ],
        [
            SaveType.playlist
            if collection_type == CollectionType.playlist
            else SaveType.album
        ],
        user_id,
    )

    # attach users
    playlists = add_users_to_playlists(playlists, session, user_id)

    for idx, playlist in enumerate(playlists):
        playlist[response_name_constants.activity_timestamp] = activity_timestamp[idx]

    return playlists


def get_collection_library(args: GetCollectionLibraryArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_collection_library(args, session)
