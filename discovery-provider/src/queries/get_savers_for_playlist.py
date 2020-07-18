from sqlalchemy import func, desc

from src import exceptions
from src.models import User, Playlist, Save, SaveType, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import paginate_query


def get_savers_for_playlist(save_playlist_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Playlist exists for provided save_playlist_id.
        playlist_entry = session.query(Playlist).filter(
            Playlist.playlist_id == save_playlist_id,
            Playlist.is_current == True
        ).first()
        if playlist_entry is None:
            raise exceptions.NotFoundError('Resource not found for provided playlist id')

        # Subquery to get all (user_id, follower_count) entries from Follows table.
        follower_count_subquery = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id).label(response_name_constants.follower_count)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .group_by(Follow.followee_user_id)
            .subquery()
        )

        # Get all Users that saved Playlist, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0))
                .label(response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that saved given playlist.
                User.user_id.in_(
                    session.query(Save.user_id)
                    .filter(
                        Save.save_item_id == save_playlist_id,
                        # Select Saves for Playlists and Albums (i.e. not Tracks).
                        Save.save_type != SaveType.track,
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
