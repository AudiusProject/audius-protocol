from src.models import User, AggregateUser
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
            User.cover_photo_sizes,
            User.wallet,
        )
        .filter(User.handle == handle)
        .filter(User.is_current == True)
        .first()
    )

    if not user_result:
        raise Exception(f"Could not find user id for handle '{handle}'")

    (
        user_id,
        profile_picture,
        profile_picture_sizes,
        cover_photo,
        cover_photo_sizes,
        wallet,
    ) = user_result

    user_follow_result = (
        session.query(AggregateUser.follower_count, AggregateUser.following_count)
        .filter(AggregateUser.user_id == user_id)
        .first()
    )
    num_followers = user_follow_result[0] if user_follow_result else 0
    num_following = user_follow_result[1] if user_follow_result else 0

    return {
        "num_followers": num_followers,
        "num_following": num_following,
        "has_profile_picture": profile_picture is not None
        or profile_picture_sizes is not None,
        "has_cover_photo": cover_photo is not None or cover_photo_sizes is not None,
        "wallet": wallet,
    }
