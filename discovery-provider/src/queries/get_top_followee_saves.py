from sqlalchemy import func, desc

from src import exceptions
from src.models import Track, Follow, Save
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import (
    get_current_user_id,
    populate_track_metadata,
    get_users_by_id,
    get_users_ids,
)


def get_top_followee_saves(saveType, args):
    if saveType != "track":
        raise exceptions.ArgumentError("Invalid type provided, must be one of 'track'")

    limit = args.get("limit", 25)

    current_user_id = get_current_user_id()
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Construct a subquery of all followees
        followee_user_ids = session.query(Follow.followee_user_id).filter(
            Follow.follower_user_id == current_user_id,
            Follow.is_current == True,
            Follow.is_delete == False,
        )
        followee_user_ids_subquery = followee_user_ids.subquery()

        # Construct a subquery of all saves from followees aggregated by id
        save_count = (
            session.query(
                Save.save_item_id,
                func.count(Save.save_item_id).label(response_name_constants.save_count),
            )
            .join(
                followee_user_ids_subquery,
                Save.user_id == followee_user_ids_subquery.c.followee_user_id,
            )
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_type == saveType,
            )
            .group_by(Save.save_item_id)
            .order_by(desc(response_name_constants.save_count))
            .limit(limit)
        )
        save_count_subquery = save_count.subquery()

        # Query for tracks joined against followee save counts
        tracks_query = (
            session.query(
                Track,
            )
            .join(
                save_count_subquery,
                Track.track_id == save_count_subquery.c.save_item_id,
            )
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
            )
        )

        tracks_query_results = tracks_query.all()
        tracks = helpers.query_result_to_list(tracks_query_results)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track["owner_id"]]
                if user:
                    track["user"] = user

    return tracks
