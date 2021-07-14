import logging  # pylint: disable=C0302
from sqlalchemy import asc

from src import exceptions
from src.models import User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import populate_user_metadata, paginate_query
from src.queries.get_unpopulated_users import get_unpopulated_users

logger = logging.getLogger(__name__)


def get_users(args):
    users = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:

        def get_users_and_ids():

            can_use_shared_cache = (
                "id" in args
                and "is_creator" not in args
                and "wallet" not in args
                and "min_block_number" not in args
                and "handle" not in args
            )

            if can_use_shared_cache:
                users = get_unpopulated_users(session, args.get("id"))
                ids = list(map(lambda user: user["user_id"], users))
                return (users, ids)

            # Create initial query
            base_query = session.query(User)
            # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
            base_query = base_query.filter(
                User.is_current == True, User.wallet != None, User.handle != None
            )

            # Process filters
            if "is_creator" in args:
                base_query = base_query.filter(
                    User.is_creator == args.get("is_creator")
                )
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
                        "Invalid value found in user id list", e
                    )
            if "min_block_number" in args:
                base_query = base_query.filter(
                    User.blocknumber >= args.get("min_block_number")
                )
            users = paginate_query(base_query).all()
            users = helpers.query_result_to_list(users)

            user_ids = list(map(lambda user: user["user_id"], users))

            return (users, user_ids)

        (users, user_ids) = get_users_and_ids()

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

    return users
