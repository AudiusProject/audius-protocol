import logging # pylint: disable=C0302
from sqlalchemy import asc

from src import exceptions
from src.models import User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_current_user_id, populate_user_metadata, paginate_query

logger = logging.getLogger(__name__)

def get_users(args):
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(User)
        # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
        base_query = base_query.filter(
            User.is_current == True, User.wallet != None, User.handle != None)

        # Process filters
        if "is_creator" in args:
            base_query = base_query.filter(User.is_creator == args.get("is_creator"))
        if "wallet" in args:
            wallet = args.get("wallet")
            wallet = wallet.lower()
            if len(wallet) == 42:
                base_query = base_query.filter_by(wallet=wallet)
                base_query = base_query.order_by(asc(User.created_at))
            else:
                logger.warning("Invalid wallet length")
        if "handle" in args:
            handle = args.get("handle").lower()
            base_query = base_query.filter_by(handle_lc=handle)

        # Conditionally process an array of users
        if "id" in args:
            user_id_list = args.get("id")
            try:
                base_query = base_query.filter(User.user_id.in_(user_id_list))
            except ValueError as e:
                raise exceptions.ArgumentError(
                    "Invalid value found in user id list", e)
        if "min_block_number" in args:
            base_query = base_query.filter(
                User.blocknumber >= args.get("min_block_number")
            )
        users = paginate_query(base_query).all()
        users = helpers.query_result_to_list(users)

        user_ids = list(map(lambda user: user["user_id"], users))

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(
            session, user_ids, users, current_user_id)
    return users
