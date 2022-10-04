import logging

from src.models.social.follow import Follow
from src.utils import db_session

logger = logging.getLogger(__name__)


def does_user_have_nft_collection(user_id: int, nft_collection: str):
    # todo: check whether user has the nft from some user_wallet_nfts table
    # which is populated during nft indexing
    # db = db_session.get_db_read_replica()
    # with db.scoped_session() as session:
    return True


def does_user_follow_artist(user_id: int, artist_id: int):
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        result = (
            session.query(Follow)
            .filter(Follow.is_current == True)
            .filter(Follow.is_delete == False)
            .filter(Follow.follower_user_id == user_id)
            .filter(Follow.followee_user_id == artist_id)
            .one_or_none()
        )
        return True if result else False
