import logging
from typing import Dict, List

from sqlalchemy import func

from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser
from src.models.users.user import User
from src.utils import db_session
from src.utils.helpers import model_to_dictionary

logger = logging.getLogger(__name__)


def get_bulk_dashboard_wallet_users(wallets: List[str]) -> List[Dict]:
    """
    Returns dashboard wallet users matching array of wallets

    Args:
        wallets: List of wallet addresses

    Returns:
        List of dashboard wallet users
    """
    lc_wallets = [wallet.lower() for wallet in wallets]
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        rows = (
            session.query(DashboardWalletUser.wallet, User)
            .join(User, User.user_id == DashboardWalletUser.user_id)
            .filter(func.lower(DashboardWalletUser.wallet).in_(lc_wallets))
            .filter(DashboardWalletUser.is_delete == False)
            .all()
        )
        res = [{"wallet": row[0], "user": model_to_dictionary(row[1])} for row in rows]
        return res
