from sqlalchemy import func, desc

from src import exceptions
from src.models import User, Track, Save, SaveType, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import paginate_query


def get_savers_for_track(save_track_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Track exists for provided save_track_id.
        track_entry = session.query(Track).filter(
            Track.track_id == save_track_id,
            Track.is_current == True
        ).first()
        if track_entry is None:
            raise exceptions.NotFoundError('Resource not found for provided track id')

        # Subquery to get all (user_id, follower_count) entries from Follows table.
        follower_count_subquery = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id).label(
                    response_name_constants.follower_count)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .group_by(Follow.followee_user_id)
            .subquery()
        )

        # Get all Users that saved track, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0)).label(
                    response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that saved given track.
                User.user_id.in_(
                    session.query(Save.user_id)
                    .filter(
                        Save.save_item_id == save_track_id,
                        Save.save_type == SaveType.track,
                        Save.is_current == True,
                        Save.is_delete == False
                    )
                )
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = paginate_query(query).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i]

    return user_results
