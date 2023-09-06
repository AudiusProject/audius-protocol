from sqlalchemy import func

from src.models.tracks.track import Track
from src.models.users.aggregate_user import AggregateUser
from src.queries.query_helpers import (
    get_users_by_id,
    get_users_ids,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_random_tracks(args):
    limit = args.get("limit", 25)

    current_user_id = args.get("user_id")
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Query for random tracks
        tracks_query = (
            session.query(
                Track,
            )
            .join(AggregateUser, Track.owner_id == AggregateUser.user_id)
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                AggregateUser.follower_count >= args.get("min_followers", 100),
            )
            .order_by(func.random())
            .limit(limit)
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
