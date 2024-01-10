from sqlalchemy import desc, func, text

from src import exceptions
from src.models.social.repost import Repost, RepostType
from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import add_query_pagination, populate_user_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_top_listeners_for_track(args):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        return _get_top_listeners_for_track(session, args)


def _get_top_listeners_for_track(session, args):
    users_with_count = []
    current_user_id = args.get("current_user_id")
    track_id = args.get("track_id")
    limit = args.get("limit")
    offset = args.get("offset")

    # Ensure Track exists for provided track_id.
    track_entry = (
        session.query(Track)
        .filter(Track.track_id == track_id, Track.is_current == True)
        .first()
    )
    if track_entry is None:
        raise exceptions.NotFoundError("Resource not found for provided track id")

    cid_source_res = text(
        """
        with
        deduped as (
          select distinct play_item_id, user_id, date_trunc('hour', created_at) as created_at
          from plays
          where user_id is not null
            and play_item_id = :track_id
        ),
        counted as (
          select user_id, count(*) as play_count
          from deduped
          group by 1
        )
        select *
        from counted
        join users u using (user_id)
        left join aggregate_user au on u.user_id = au.user_id
        order by play_count, follower_count, u.user_id desc
        limit :limit
        offset :offset
        """
    )
    top_listener_rows = session.execute(
        cid_source_res, {"track_id": track_id, "limit": limit, "offset": offset}
    ).fetchall()

    top_listeners = {r["user_id"]: r["play_count"] for r in top_listener_rows}

    # Fix format to return only Users objects with follower_count field.
    user_ids = top_listeners.keys()
    users = get_unpopulated_users(session, user_ids)
    users = populate_user_metadata(session, user_ids, users, current_user_id)

    users_with_count = [
        {"user": u, "count": top_listeners[u["user_id"]]} for u in users
    ]

    return users_with_count
