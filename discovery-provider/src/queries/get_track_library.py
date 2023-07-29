from typing import Optional, TypedDict, cast

from sqlalchemy import asc, desc, func, or_, text
from sqlalchemy.orm import aliased
from sqlalchemy.orm.util import AliasedClass
from sqlalchemy.sql.expression import ColumnElement
from sqlalchemy.sql.functions import coalesce

from src.models.social.aggregate_plays import AggregatePlay
from src.models.social.repost import Repost
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

    # Wehther or not deleted tracks should be filtered out
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
        sort_method == SortMethod.length
        or sort_method == SortMethod.last_listen_date
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
    # that in the case of querying 'all', we need to alias the TrackWithAggregates table
    # to avoid accidentally joining on TrackWithAggregates, and in subsequent query building logic
    # conditionally refer to either the aliased TrackWithAggregatesAlias table or the raw TrackWithAggregates table
    # to avoid an accidental join.

    favorites_base = (
        session.query(TrackWithAggregates, Save.created_at.label("item_created_at"))
        .join(Save, Save.save_item_id == TrackWithAggregates.track_id)
        .filter(
            TrackWithAggregates.is_current == True,
            Save.user_id == user_id,
            Save.is_current == True,
            Save.is_delete == False,
            Save.save_type == SaveType.track,
        )
    )
    reposts_base = (
        session.query(TrackWithAggregates, Repost.created_at.label("item_created_at"))
        .join(Repost, Repost.repost_item_id == TrackWithAggregates.track_id)
        .filter(
            TrackWithAggregates.is_current == True,
            Repost.user_id == user_id,
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.repost_type == SaveType.track,
        )
    )
    purchase_base = (
        session.query(
            TrackWithAggregates, USDCPurchase.created_at.label("item_created_at")
        )
        .join(
            USDCPurchase,
            USDCPurchase.content_id == TrackWithAggregates.track_id,
        )
        .filter(
            TrackWithAggregates.is_current == True,
            USDCPurchase.content_type == "track",
            USDCPurchase.buyer_user_id == user_id,
        )
    )

    # Construct all query
    # Union the three base queries together, and remove duplicate track IDs,
    # select from union as a subquery.
    subquery = (
        (favorites_base.union_all(reposts_base, purchase_base))
        .distinct(TrackWithAggregates.track_id)
        .order_by(TrackWithAggregates.track_id)
    ).subquery()
    TrackWithAggregatesAlias = aliased(TrackWithAggregates, subquery)
    TracksTable: AliasedClass | type[TrackWithAggregates] = TrackWithAggregatesAlias
    all_base = session.query(
        TrackWithAggregatesAlias,
        subquery.c.item_created_at.label("item_created_at"),
    )

    # Set the base query
    base_query = {
        LibraryFilterType.all: all_base,
        LibraryFilterType.favorite: favorites_base,
        LibraryFilterType.repost: reposts_base,
        LibraryFilterType.purchase: purchase_base,
    }[filter_type]

    # Depending on whether this is 'all' or not,
    # subsequent query building either needs to reference TrackWithAggregates or the aliased TrackWithAggregatesAlias
    # to avoid accidental join.
    TracksTable = (
        TrackWithAggregatesAlias
        if filter_type == LibraryFilterType.all
        else TrackWithAggregates
    )

    # Allow filtering of deletes
    if filter_deleted:
        base_query = base_query.filter(TracksTable.is_delete == False)

    if query:
        base_query = base_query.join(TracksTable.user, aliased=True).filter(
            or_(
                cast(ColumnElement, TracksTable.title).ilike(f"%{query.lower()}%"),
                User.name.ilike(f"%{query.lower()}%"),
            )
        )

    # Set sort methods
    if sort_method == SortMethod.title:
        base_query = base_query.order_by(
            sort_fn(cast(ColumnElement, TracksTable.title))
        )
    elif sort_method == SortMethod.artist_name:
        base_query = base_query.join(TracksTable.user, aliased=True).order_by(
            sort_fn(User.name)
        )
    elif sort_method == SortMethod.release_date:
        base_query = base_query.order_by(
            sort_fn(
                coalesce(
                    func.to_date_safe(
                        TracksTable.release_date,
                        "Dy Mon DD YYYY HH24:MI:SS",
                    ),
                    TracksTable.created_at,
                )
            )
        )
    elif sort_method == SortMethod.plays:
        base_query = base_query.join(TracksTable.aggregate_play).order_by(
            sort_fn(AggregatePlay.count)
        )
    elif sort_method == SortMethod.reposts:
        base_query = base_query.join(TracksTable.aggregate_track).order_by(
            sort_fn(AggregateTrack.repost_count)
        )
    elif sort_method == SortMethod.saves:
        base_query = base_query.join(TracksTable.aggregate_track).order_by(
            sort_fn(AggregateTrack.save_count)
        )
    else:
        # This branch covers added_date, or any other sort method
        if filter_type == LibraryFilterType.favorite:
            base_query = base_query.order_by(
                sort_fn(Save.created_at),
                desc(cast(ColumnElement, TracksTable.track_id)),
            )
        elif filter_type == LibraryFilterType.repost:
            base_query = base_query.order_by(
                sort_fn(Repost.created_at),
                desc(cast(ColumnElement, TracksTable.track_id)),
            )
        elif filter_type == LibraryFilterType.purchase:
            base_query = base_query.order_by(
                sort_fn(USDCPurchase.created_at),
                desc(cast(ColumnElement, TracksTable.track_id)),
            )
        elif filter_type == LibraryFilterType.all:
            base_query = base_query.order_by(
                sort_fn(cast(ColumnElement, text("item_created_at"))),
                desc(cast(ColumnElement, TracksTable.track_id)),
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
