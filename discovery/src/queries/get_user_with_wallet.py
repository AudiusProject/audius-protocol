import logging
from typing import Optional

from src.models.users.user import User
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_user_with_wallet(wallet: str) -> Optional[int]:
    """
    Returns id of user to which the given wallet belongs

    Args:
        wallet: string Wallet belonging to user

    Returns:
        the user id
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user = (
            session.query(User.user_id)
            .filter(
                # Convert checksum wallet to lowercase
                User.wallet == wallet.lower(),
                User.is_current == True,
            )
            .first()
        )
        if user:
            return user.user_id
        else:
            return None
