from sqlalchemy import func
from src.models import User, Follow
from src.utils import db_session

def get_user_signals(handle):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        return _get_user_signals(session, handle)

def _get_user_signals(session, handle):
    user_result = (
        session.query(
            User.user_id,
            User.profile_picture,
            User.profile_picture_sizes,
            User.cover_photo,
            User.cover_photo_sizes
        )
        .filter(User.handle == handle)
        .filter(User.is_current == True)
        .first()
    )

    if not user_result:
        raise Exception(f"Could not find user id for handle '{handle}'")

    user_id, profile_picture, profile_picture_sizes, cover_photo, cover_photo_sizes = user_result

    follower_results = (
        session.query(func.count(Follow.followee_user_id))
        .filter(Follow.is_current == True)
        .filter(Follow.is_delete == False)
        .filter(Follow.followee_user_id == user_id)
        .group_by(Follow.followee_user_id)
        .first()
    )
    num_followers = follower_results[0] if follower_results else 0

    following_results = (
        session.query(func.count(Follow.follower_user_id))
        .filter(Follow.is_current == True)
        .filter(Follow.is_delete == False)
        .filter(Follow.follower_user_id == user_id)
        .group_by(Follow.follower_user_id)
        .first()
    )
    num_following = following_results[0] if following_results else 0

    return {
        "num_followers": num_followers,
        "num_following": num_following,
        "has_profile_picture": profile_picture is not None or profile_picture_sizes is not None,
        "has_cover_photo": cover_photo is not None or cover_photo_sizes is not None
    }
