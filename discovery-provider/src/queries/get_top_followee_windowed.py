from sqlalchemy import desc, text

from src import exceptions
from src.models import Track, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import (
    get_current_user_id,
    populate_track_metadata,
    get_users_by_id,
    get_users_ids,
    create_save_repost_count_subquery,
)


def get_top_followee_windowed(type, window, args):
    if type != "track":
        raise exceptions.ArgumentError("Invalid type provided, must be one of 'track'")

    valid_windows = ["week", "month", "year"]
    if not window or window not in valid_windows:
        raise exceptions.ArgumentError(
            "Invalid window provided, must be one of {}".format(valid_windows)
        )

    limit = args.get("limit", 25)

    current_user_id = get_current_user_id()
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Construct a subquery to get the summed save + repost count for the `type`
        count_subquery = create_save_repost_count_subquery(session, type)

        followee_user_ids = session.query(Follow.followee_user_id).filter(
            Follow.follower_user_id == current_user_id,
            Follow.is_current == True,
            Follow.is_delete == False,
        )
        followee_user_ids_subquery = followee_user_ids.subquery()

        # Queries for tracks joined against followed users and counts
        tracks_query = (
            session.query(
                Track,
            )
            .join(
                followee_user_ids_subquery,
                Track.owner_id == followee_user_ids_subquery.c.followee_user_id,
            )
            .join(count_subquery, Track.track_id == count_subquery.c["id"])
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                # Query only tracks created `window` time ago (week, month, etc.)
                Track.created_at >= text("NOW() - interval '1 {}'".format(window)),
            )
            .order_by(desc(count_subquery.c["count"]), desc(Track.track_id))
            .limit(limit)
        )

        tracks_query_results = tracks_query.all()
        tracks = helpers.query_result_to_list(tracks_query_results)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # Bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track["owner_id"]]
                if user:
                    track["user"] = user

    return tracks
