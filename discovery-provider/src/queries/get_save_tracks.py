from src.models import Track, Save, SaveType
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import (
    add_query_pagination,
    populate_track_metadata,
    get_users_by_id,
    get_users_ids,
)


def get_save_tracks(args):
    user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    filter_deleted = args.get("filter_deleted")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(Track, Save.created_at)
            .join(Save, Save.save_item_id == Track.track_id)
            .filter(
                Track.is_current == True,
                Save.user_id == user_id,
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_type == SaveType.track,
            )
        )

        # Allow filtering of deletes
        if filter_deleted:
            base_query = base_query.filter(Track.is_delete == False)

        base_query = base_query.order_by(Save.created_at.desc(), Track.track_id.desc())

        query_results = add_query_pagination(base_query, limit, offset).all()

        if not query_results:
            return []

        tracks, save_dates = zip(*query_results)
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if args.get("with_users", False):
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list, current_user_id)
            for track in tracks:
                user = users[track["owner_id"]]
                if user:
                    track["user"] = user

        for idx, track in enumerate(tracks):
            track[response_name_constants.activity_timestamp] = save_dates[idx]

        return tracks
