from typing import Optional, TypedDict

from sqlalchemy import asc, desc, or_
from src.models.social.aggregate_plays import AggregatePlay
from src.models.social.save import Save, SaveType
from src.models.tracks.aggregate_track import AggregateTrack
from src.models.tracks.track_with_aggregates import TrackWithAggregates
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.query_helpers import (
    SortDirection,
    SortMethod,
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


class GetSaveTracksArgs(TypedDict):
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


def get_save_tracks(args: GetSaveTracksArgs):
    user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    filter_deleted = args.get("filter_deleted")
    query = args.get("query")
    sort_method = args["sort_method"]
    sort_direction = args["sort_direction"]
    sort_fn = desc if sort_direction == SortDirection.desc else asc

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(TrackWithAggregates, Save.created_at)
            .join(Save, Save.save_item_id == TrackWithAggregates.track_id)
            .filter(
                TrackWithAggregates.is_current == True,
                Save.user_id == user_id,
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_type == SaveType.track,
            )
        )

        # Allow filtering of deletes
        if filter_deleted:
            base_query = base_query.filter(TrackWithAggregates.is_delete == False)

        if query:
            base_query = base_query.join(TrackWithAggregates.user, aliased=True).filter(
                or_(
                    TrackWithAggregates.title.ilike(f"%{query.lower()}%"),
                    User.name.ilike(f"%{query.lower()}%"),
                )
            )

        if sort_method == SortMethod.title:
            base_query = base_query.order_by(sort_fn(TrackWithAggregates.title))
        elif sort_method == SortMethod.artist_name:
            base_query = base_query.order_by(sort_fn(TrackWithAggregates.user.name))
        elif sort_method == SortMethod.release_date:
            base_query = base_query.order_by(sort_fn(TrackWithAggregates.release_date))
        elif sort_method == SortMethod.added_date:
            base_query = base_query.order_by(
                sort_fn(Save.created_at), desc(TrackWithAggregates.track_id)
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
            base_query = base_query.order_by(
                desc(Save.created_at), desc(TrackWithAggregates.track_id)
            )

        query_results = add_query_pagination(base_query, limit, offset).all()

        if not query_results:
            return []

        tracks, save_dates = zip(*query_results)
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(
            session, track_ids, tracks, current_user_id, track_has_aggregates=True
        )
        tracks = add_users_to_tracks(session, tracks, current_user_id)

        for idx, track in enumerate(tracks):
            track[response_name_constants.activity_timestamp] = save_dates[idx]

        return tracks
