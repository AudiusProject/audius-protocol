import logging
from typing import Optional, TypedDict

from eth_account import Account
from eth_account.messages import defunct_hash_message

from src.models.users.user import User

logger = logging.getLogger(__name__)


class GetAuthedUserResult(TypedDict):
    user_id: int
    user_wallet: str


def get_authed_user(
    session, data: str, signature: str
) -> Optional[GetAuthedUserResult]:
    message_hash = defunct_hash_message(text=data)
    user_wallet = Account._recover_hash(message_hash, signature=signature)
    result = (
        session.query(User.user_id)
        .filter(User.wallet == user_wallet.lower())
        .filter(User.is_current == True)
        .first()
    )
    if not result:
        return None

    return {"user_id": result[0], "user_wallet": user_wallet}
