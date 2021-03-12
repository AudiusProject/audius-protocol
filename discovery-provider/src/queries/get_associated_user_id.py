from functools import reduce
import logging
from sqlalchemy import asc, desc, func

from src.models import AssociatedWallet
from src.utils import db_session

logger = logging.getLogger(__name__)


def get_associated_user_id(args):
    """
    Returns a user_id the associated wallet

    Args:
        args: dict The parsed args from the request
        args.wallet: string The wallet to find associated with an user id 

    Returns:
        number representing the user id
    """
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        user_id = (
            session.query(AssociatedWallet.user_id)
            .filter(AssociatedWallet.is_current == True)
            .filter(AssociatedWallet.is_delete == False)
            .filter(AssociatedWallet.wallet == args.get('wallet'))
            .first()
        )
        return user_id[0] if user_id else None
