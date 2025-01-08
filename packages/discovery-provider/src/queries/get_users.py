import logging
from typing import List  # pylint: disable=C0302

from sqlalchemy import asc

from src import exceptions
from src.models.users.user import User
from src.models.users.user_bank import UserBankAccount
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import paginate_query, populate_user_metadata
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)


def get_users(args):
    users = []
    current_user_id = args.get("current_user_id")

    db = get_db_read_replica()
    with db.scoped_session() as session:

        def get_users_and_ids():
            can_use_shared_cache = (
                "id" in args
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
            if "include_incomplete" not in args or not args["include_incomplete"]:
                base_query = base_query.filter(
                    User.is_current == True, User.wallet != None
                )

            # Process filters
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
        logger.info(f"asdf populated users {users}")

        # Debugging flag for checking user solana bank existence
        # used by createSolanaUserBank script to confirm banks are created successfully
        if "with_banks" in args:
            secondary_query = session.query(UserBankAccount).filter(
                UserBankAccount.ethereum_address.in_(user["wallet"] for user in users)
            )
            banks: List[UserBankAccount] = secondary_query.all()
            users_by_wallet = {user["wallet"]: user for user in users}
            for bank in banks:
                users_by_wallet[bank.ethereum_address]["has_solana_bank"] = True

    return users
