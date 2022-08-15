from sqlalchemy import or_
from src.models.social.save import Save, SaveType
from src.models.tracks.track import Track
from src.models.users.user import User
from src.queries import response_name_constants
from src.queries.query_helpers import (
    add_query_pagination,
    add_users_to_tracks,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_save_tracks(args):
    user_id = args.get("user_id")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    filter_deleted = args.get("filter_deleted")
    query = args.get("query")

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

        if query:
            base_query = base_query.join(Track.user, aliased=True).filter(
                or_(
                    Track.title.ilike(f"%{query.lower()}%"),
                    User.name.ilike(f"%{query.lower()}%"),
                )
            )

        base_query = base_query.order_by(Save.created_at.desc(), Track.track_id.desc())

        query_results = add_query_pagination(base_query, limit, offset).all()

        if not query_results:
            return []

        tracks, save_dates = zip(*query_results)
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        add_users_to_tracks(session, tracks, current_user_id)

        for idx, track in enumerate(tracks):
            track[response_name_constants.activity_timestamp] = save_dates[idx]

        return tracks
