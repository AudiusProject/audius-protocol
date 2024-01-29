from typing import Optional, TypedDict

from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import contains_eager
from sqlalchemy.sql.functions import coalesce, max

from src.models.social.aggregate_plays import AggregatePlay
from src.models.social.repost import Repost, RepostType
from src.models.social.save import Save, SaveType
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track_with_aggregates import TrackWithAggregates
from src.models.users.usdc_purchase import USDCPurchase
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.query_helpers import (
    LibraryFilterType,
    SortDirection,
    SortMethod,
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class GetTrackLibraryArgs(TypedDict):
    # The current user logged in (from route param)
    user_id: int

    # The current user logged in (from query arg)
    current_user_id: int

    # Whether or not deleted tracks should be filtered out
    filter_deleted: bool

    # The maximum number of listens to return
    limit: int

    # The offset for the listen history
    offset: int

    # Optional filter for the returned results
    query: Optional[str]

    # Optional sort method for the returned results
    sort_method: Optional[SortMethod]
    sort_direction: Optional[SortDirection]
    filter_type: LibraryFilterType


def _get_track_library(args: GetTrackLibraryArgs, session):
    user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    filter_deleted = args.get("filter_deleted")
    query = args.get("query")
    sort_method = args.get("sort_method")
    sort_direction = args.get("sort_direction")
    filter_type = args.get("filter_type")

    if not filter_type:
        raise ValueError("Invalid filter type")

    # This query doesn't support all sort methods
    if (
        sort_method == SortMethod.last_listen_date
        or sort_method == SortMethod.most_listens_by_user
    ):
        raise ValueError(f"Invalid sort method {sort_method}")

    # Set `sort_fn` (direction) to match legacy behavior:
    # if no `sort_method` is specified, default to descending.
    # Otherwise, if sort method exists, default to ascending.

    sort_fn = None
    if not sort_method:
        sort_fn = desc
    else:
        sort_fn = desc if sort_direction == SortDirection.desc else asc

    # Query strategy:
    # Create unique queries for favorites/reposts/purchases, and in the case of querying 'all',
    # union them together and remove duplicate track IDs.
    #
    # It's a straight forward approach with a few SQLALchemy gotchas - namely
    # we have to use contains_eager when including the user for the query filter so that it doesn't get joined twice

    favorites_base = session.query(
        Save.save_item_id.label("item_id"), Save.created_at.label("item_created_at")
    ).filter(
        Save.user_id == user_id,
        Save.is_current == True,
        Save.is_delete == False,
        Save.save_type == SaveType.track,
    )
    reposts_base = session.query(
        Repost.repost_item_id.label("item_id"),
        Repost.created_at.label("item_created_at"),
    ).filter(
        Repost.user_id == user_id,
        Repost.is_current == True,
        Repost.is_delete == False,
        Repost.repost_type == RepostType.track,
    )
    purchase_base = session.query(
        USDCPurchase.content_id.label("item_id"),
        USDCPurchase.created_at.label("item_created_at"),
    ).filter(
        USDCPurchase.content_type == "track",
        USDCPurchase.buyer_user_id == user_id,
    )

    # Construct all query
    # Union the three base queries together, and remove duplicate track IDs,
    # select from union as a subquery.
    union_subquery = favorites_base.union_all(reposts_base, purchase_base).subquery(
        name="union_subquery"
    )
    all_base = (
        session.query(
            union_subquery.c.item_id,
            max(union_subquery.c.item_created_at).label("item_created_at"),
        )
        .select_from(union_subquery)
        .group_by(union_subquery.c.item_id)
    )

    # Set the base subquery
    subquery = {
        LibraryFilterType.all: all_base.subquery(name="library"),
        LibraryFilterType.favorite: favorites_base.subquery(name="favorites"),
        LibraryFilterType.repost: reposts_base.subquery(name="reposts"),
        LibraryFilterType.purchase: purchase_base.subquery(name="purchases"),
    }[filter_type]

    # Set the base query of tracks by joining on the subquery
    base_query = (
        session.query(TrackWithAggregates, subquery.c.item_created_at)
        .select_from(subquery)
        .join(
            TrackWithAggregates,
            TrackWithAggregates.track_id == subquery.c.item_id,
        )
        .filter(TrackWithAggregates.is_current == True)
    )

    # Allow filtering of deletes
    if filter_deleted:
        base_query = base_query.filter(TrackWithAggregates.is_delete == False)

    # Filter results based on user's filter query
    # Use contains_eager to load user without duplicating it
    if query:
        base_query = (
            base_query.join(TrackWithAggregates.user.of_type(User))
            .options(contains_eager(TrackWithAggregates.user))
            .filter(
                or_(
                    TrackWithAggregates.title.ilike(f"%{query.lower()}%"),
                    User.name.ilike(f"%{query.lower()}%"),
                )
            )
        )

    # Set sort methods
    if sort_method == SortMethod.title:
        base_query = base_query.order_by(sort_fn(TrackWithAggregates.title))
    elif sort_method == SortMethod.artist_name:
        base_query = base_query.join(TrackWithAggregates.user, aliased=True).order_by(
            sort_fn(User.name)
        )
    elif sort_method == SortMethod.release_date:
        base_query = base_query.order_by(
            sort_fn(
                coalesce(
                    TrackWithAggregates.release_date,
                    TrackWithAggregates.created_at,
                )
            )
        )
    elif sort_method == SortMethod.plays:
        base_query = base_query.join(TrackWithAggregates.aggregate_play).order_by(
            sort_fn(AggregatePlay.count)
        )
    elif sort_method == SortMethod.reposts:
        base_query = base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.repost_count)
        )
    elif sort_method == SortMethod.saves:
        base_query = base_query.join(TrackWithAggregates.aggregate_track).order_by(
            sort_fn(AggregateTrack.save_count)
        )
    else:
        # This branch covers added_date, or any other sort method
        base_query = base_query.order_by(
            sort_fn(subquery.c.item_created_at),
            desc(TrackWithAggregates.track_id),
        )

    query_results = add_query_pagination(base_query, limit, offset).all()

    if not query_results:
        return []

    tracks, activity_timestamp = zip(*query_results)
    tracks = helpers.query_result_to_list(tracks)
    track_ids = list(map(lambda track: track["track_id"], tracks))

    # bundle peripheral info into track results
    tracks = populate_track_metadata(
        session, track_ids, tracks, current_user_id, track_has_aggregates=True
    )
    tracks = add_users_to_tracks(session, tracks, current_user_id)

    for idx, track in enumerate(tracks):
        track[response_name_constants.activity_timestamp] = activity_timestamp[idx]

    return tracks


def get_track_library(args: GetTrackLibraryArgs):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_track_library(args, session)
