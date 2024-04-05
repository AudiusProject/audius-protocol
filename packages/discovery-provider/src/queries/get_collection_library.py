import enum
from typing import Optional, TypedDict

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import contains_eager
from sqlalchemy.sql.functions import max

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

    # One of: all, favorite, repost, purchase
    filter_type: LibraryFilterType

    # Include deleted collections
    filter_deleted: Optional[bool]

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

    filter_deleted = args.get("filter_deleted", False)
    query = args.get("query")
    sort_method = args.get("sort_method", CollectionLibrarySortMethod.added_date)
    sort_direction = args.get("sort_direction", SortDirection.desc)

    # Doesn't yet support album/playlist purchases
    if not filter_type or filter_type == LibraryFilterType.purchase:
        raise ValueError("Invalid filter type")

    sort_fn = desc if sort_direction == SortDirection.desc else asc

    own_playlists_base = session.query(
        Playlist.playlist_id.label("item_id"),
        Playlist.created_at.label("item_created_at"),
    ).filter(
        Playlist.is_current == True,
        Playlist.is_album == (collection_type == CollectionType.album),
        Playlist.playlist_owner_id == user_id,
    )
    if filter_deleted:
        own_playlists_base = own_playlists_base.filter(Playlist.is_delete == False)

    favorites_base = session.query(
        Save.save_item_id.label("item_id"), Save.created_at.label("item_created_at")
    ).filter(
        Save.user_id == user_id,
        Save.is_current == True,
        Save.is_delete == False,
        # Both albums and playlists have SaveType.playlist at the moment, will filter albums with the join as necessary
        or_(Save.save_type == SaveType.playlist, Save.save_type == SaveType.album),
    )

    reposts_base = session.query(
        Repost.repost_item_id.label("item_id"),
        Repost.created_at.label("item_created_at"),
    ).filter(
        Repost.user_id == user_id,
        Repost.is_current == True,
        Repost.is_delete == False,
        # Both albums and playlists have RepostType.playlist at the moment, will filter albums with the join as necessary
        or_(
            Repost.repost_type == RepostType.playlist,
            Repost.repost_type == RepostType.album,
        ),
    )

    # Union everything for the "all" query
    union_subquery = favorites_base.union_all(
        reposts_base, own_playlists_base
    ).subquery(name="union_subquery")
    # Remove dupes
    all_base = (
        session.query(
            union_subquery.c.item_id,
            max(union_subquery.c.item_created_at).label("item_created_at"),
        )
        .select_from(union_subquery)
        .group_by(union_subquery.c.item_id)
    )

    # Favorites are unioned with own playlists by design
    favorites_base = favorites_base.union_all(own_playlists_base)

    subquery = {
        LibraryFilterType.all: all_base.subquery("library"),
        LibraryFilterType.favorite: favorites_base.subquery(name="favorites_and_own"),
        LibraryFilterType.repost: reposts_base.subquery(name="reposts"),
    }[filter_type]

    base_query = (
        session.query(Playlist, subquery.c.item_created_at)
        .select_from(subquery)
        .join(Playlist, Playlist.playlist_id == subquery.c.item_id)
        .filter(
            Playlist.is_current == True,
            or_(Playlist.is_private == False, Playlist.playlist_owner_id == user_id),
            Playlist.is_album == (collection_type == CollectionType.album),
        )
    )

    if filter_deleted:
        base_query = base_query.filter(Playlist.is_delete == False)

    if query:
        # Need to disable lazy join for this to work
        base_query = (
            base_query.join(Playlist.user.of_type(User))
            .options(contains_eager(Playlist.user))
            .filter(
                or_(
                    Playlist.playlist_name.ilike(f"%{query.lower()}%"),
                    User.name.ilike(f"%{query.lower()}%"),
                )
            )
        )

    # Set sort methods
    if sort_method == CollectionLibrarySortMethod.added_date:
        base_query = base_query.order_by(
            sort_fn(subquery.c.item_created_at), desc(Playlist.playlist_id)
        )
    elif sort_method == CollectionLibrarySortMethod.reposts:
        base_query = base_query.join(
            AggregatePlaylist,
            AggregatePlaylist.playlist_id == Playlist.playlist_id,
        ).order_by(sort_fn(AggregatePlaylist.repost_count))

    elif sort_method == CollectionLibrarySortMethod.saves:
        base_query = base_query.join(
            AggregatePlaylist,
            AggregatePlaylist.playlist_id == Playlist.playlist_id,
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
            (
                RepostType.playlist
                if collection_type == CollectionType.playlist
                else RepostType.album
            )
        ],
        [
            (
                SaveType.playlist
                if collection_type == CollectionType.playlist
                else SaveType.album
            )
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
