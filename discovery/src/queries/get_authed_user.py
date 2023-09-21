import logging

from eth_account.messages import defunct_hash_message

from src.models.users.user import User
from src.utils import web3_provider
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

web3 = web3_provider.get_web3()


def get_authed_user(data: str, signature: str):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Use acdc RPC to avoid calling external eth RPC
        message_hash = defunct_hash_message(text=data)
        user_wallet = web3.eth.account._recover_hash(message_hash, signature=signature)
        result = (
            session.query(User.user_id)
            .filter(User.wallet == user_wallet.lower())
            .filter(User.is_current == True)
            .first()
        )
        if not result:
            return None

        return {"user_id": result[0], "user_wallet": user_wallet}
