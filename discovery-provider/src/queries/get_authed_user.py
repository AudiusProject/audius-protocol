import logging

from src.api_helpers import recover_wallet
from src.models.users.user import User
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_authed_user(data: str, signature: str):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = recover_wallet(data, signature)
        logger.info(f"get_authed_user_id user_wallet is {user_wallet}")
        # todo: make sure user_wallet casing / checksum is correct
        result = (
            session.query(User.user_id)
            .filter(User.wallet == user_wallet)
            .filter(User.is_current == True)
            .one_or_none()
        )
        logger.info(f"get_authed_user_id result is {result}")
        if not result:
            return None

        return {"user_id": result[0], "user_wallet": user_wallet}
