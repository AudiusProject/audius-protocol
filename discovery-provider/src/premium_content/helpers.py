import logging
from typing import Any

from src.models.social.follow import Follow
from src.models.users.user_tip import UserTip
from src.utils import db_session

logger = logging.getLogger(__name__)


def does_user_have_nft_collection(user_id: int, nft_collection: Any):
    # Return False here as we want to avoid this check here, in favor of
    # calling the /tracks/<user-id>/nft-gated-signatures endpoint to check
    # whether a user has access to nft-gated tracks.
    return False


def does_user_follow_artist(user_id: int, follow_user_id: int):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        result = (
            session.query(Follow)
            .filter(Follow.is_current == True)
            .filter(Follow.is_delete == False)
            .filter(Follow.follower_user_id == user_id)
            .filter(Follow.followee_user_id == follow_user_id)
            .one_or_none()
        )
        return True if result else False


def does_user_support_artist(user_id: int, supporting_user_id: int):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        result = (
            session.query(UserTip)
            .filter(UserTip.sender_user_id == user_id)
            .filter(UserTip.receiver_user_id == supporting_user_id)
            .all()
        )
        return True if result else False
