from src import exceptions
from src.models import User, Playlist, Repost, RepostType, Follow
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query


def get_playlist_repost_intersection_users(repost_playlist_id, follower_user_id):
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # ensure playlist_id exists
        playlist_entry = (
            session.query(Playlist)
            .filter(
                Playlist.playlist_id == repost_playlist_id, Playlist.is_current == True
            )
            .first()
        )
        if playlist_entry is None:
            raise exceptions.NotFoundError(
                "Resource not found for provided playlist id"
            )

        query = session.query(User).filter(
            User.is_current == True,
            User.user_id.in_(
                session.query(Repost.user_id)
                .filter(
                    Repost.repost_item_id == repost_playlist_id,
                    Repost.repost_type != RepostType.track,
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
