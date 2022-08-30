import logging

# from src.utils import db_session

logger = logging.getLogger(__name__)


def does_user_have_nft_collection(user_id: int, nft_collection: str):
    # todo: check whether user has the nft from some user_wallet_nfts table
    # which is populated during nft indexing
    # db = db_session.get_db_read_replica()
    # with db.scoped_session() as session:
    return True
