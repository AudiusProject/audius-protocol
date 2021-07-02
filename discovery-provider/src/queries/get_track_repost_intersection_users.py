from src import exceptions
from src.models import User, Track, Repost, RepostType, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query


def get_track_repost_intersection_users(repost_track_id, follower_user_id):
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # ensure track_id exists
        track_entry = (
            session.query(Track)
            .filter(Track.track_id == repost_track_id, Track.is_current == True)
            .first()
        )
        if track_entry is None:
            raise exceptions.NotFoundError("Resource not found for provided track id")

        query = session.query(User).filter(
            User.is_current == True,
            User.user_id.in_(
                session.query(Repost.user_id)
                .filter(
                    Repost.repost_item_id == repost_track_id,
                    Repost.repost_type == RepostType.track,
                    Repost.is_current == True,
                    Repost.is_delete == False,
                )
                .intersect(
                    session.query(Follow.followee_user_id).filter(
                        Follow.follower_user_id == follower_user_id,
                        Follow.is_current == True,
                        Follow.is_delete == False,
                    )
                )
            ),
        )
        users = paginate_query(query).all()
        users = helpers.query_result_to_list(users)

    return users
