import logging
from typing import List, TypedDict

from src.models.users.user import User
from src.utils import db_session

logger = logging.getLogger(__name__)


class UserWalletArgs(TypedDict):
    user_id: int


class UserWallet(TypedDict):
    wallet: str


def get_user_wallet(args: UserWalletArgs) -> UserWallet:
    """
    Returns a user wallet

    Args:
        args: dict The parsed args from the request
        args.user_id: number The blockchain user id

    Returns:
        String representing the user's wallet
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = (
            session.query(User.wallet)
            .filter(User.is_current == True)
            .filter(User.is_deactivated == False)
            .filter(User.user_id == args.get("user_id"))
            .first()
        )
        if user_wallet:
            return user_wallet.wallet
        else:
            return None
