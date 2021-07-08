from sqlalchemy import func, desc

from src import exceptions
from src.models import User, Track, Save, SaveType, AggregateUser
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import populate_user_metadata, add_query_pagination


def get_savers_for_track(args):
    user_results = []
    current_user_id = args.get("current_user_id")
    save_track_id = args.get("save_track_id")
    limit = args.get("limit")
    offset = args.get("offset")

    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Track exists for provided save_track_id.
        track_entry = (
            session.query(Track)
            .filter(Track.track_id == save_track_id, Track.is_current == True)
            .first()
        )
        if track_entry is None:
            raise exceptions.NotFoundError("Resource not found for provided track id")

        # Get all Users that saved track, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(AggregateUser.follower_count, 0)).label(
                    response_name_constants.follower_count
                ),
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(AggregateUser, AggregateUser.user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that saved given track.
                User.user_id.in_(
                    session.query(Save.user_id).filter(
                        Save.save_item_id == save_track_id,
                        Save.save_type == SaveType.track,
                        Save.is_current == True,
                        Save.is_delete == False,
                    )
                ),
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = add_query_pagination(query, limit, offset).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, _ = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            # bundle peripheral info into user results
            user_ids = [user["user_id"] for user in user_results]
            user_results = populate_user_metadata(
                session, user_ids, user_results, current_user_id
            )

    return user_results
