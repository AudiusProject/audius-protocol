import logging

from src.models import AssociatedWallet
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_associated_user_wallet(args):
    """
    Returns a list of associated wallets

    Args:
        args: dict The parsed args from the request
        args.user_id: number The blockchain user id

    Returns:
        Array of strings representing the user's associated wallets
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = (
            session.query(AssociatedWallet.wallet)
            .filter(AssociatedWallet.is_current == True)
            .filter(AssociatedWallet.is_delete == False)
            .filter(AssociatedWallet.user_id == args.get('user_id'))
            .all()
        )
        return [wallet for [wallet] in user_wallet]
