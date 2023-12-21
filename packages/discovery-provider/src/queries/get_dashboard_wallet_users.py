import logging
from typing import Dict, List

from sqlalchemy import func

from src.models.dashboard_wallet_user.dashboard_wallet_user import DashboardWalletUser
from src.models.users.user import User
from src.utils import db_session
from src.utils.helpers import query_result_to_list

logger = logging.getLogger(__name__)


def get_bulk_dashboard_wallet_users(wallets: List[int]) -> List[Dict]:
    """
    Returns dashboard wallet users matching array of wallets

    Args:
        wallets: List of wallet addresses

    Returns:
        List of dashboard wallet users
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        dashboard_wallet_users = (
            session.query(DashboardWalletUser.wallet, User)
            .join(User, User.user_id == DashboardWalletUser.user_id)
            .filter(func.lower(DashboardWalletUser.wallet).in_(wallets))
            .filter(DashboardWalletUser.is_delete == False)
            .all()
        )
        return query_result_to_list(dashboard_wallet_users)

