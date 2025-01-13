import logging  # pylint: disable=C0302
from datetime import datetime

from src.models.users.user import User
from src.utils import helpers

logger = logging.getLogger(__name__)

user_datetime_fields = []
for column in User.__table__.c:
    if column.type.python_type == datetime:
        user_datetime_fields.append(column.name)


def get_unpopulated_users(session, user_ids):
    """
    Fetches a list of users based on an input array of ids

    Args:
        session: DB session
        user_ids: array A list of user ids

    Returns:
        Array of users
    """

    users = (
        session.query(User)
        .filter(User.is_current == True, User.wallet != None)
        .filter(User.user_id.in_(user_ids))
        .all()
    )
    users = helpers.query_result_to_list(users)
    queried_users = {user["user_id"]: user for user in users}

    users_response = []
    for user_id in user_ids:
        if user_id in queried_users:
            users_response.append(queried_users[user_id])

    return users_response


def get_unpopulated_users_by_wallet(session, wallet_addresses):
    """
    Fetch users based on an input array of wallet addresses

    Args:
        session: DB session
        wallet_addresses: array A list of wallet addresses

    Returns:
        Array of users
    """

    wallets_lower = [wallet.lower() for wallet in wallet_addresses]
    users = (
        session.query(User)
        .filter(User.is_current == True, User.handle != None)
        .filter(User.wallet.in_(wallets_lower))
        .all()
    )
    users = helpers.query_result_to_list(users)
    queried_users = {user["wallet"]: user for user in users}

    users_response = []
    for wallet in wallets_lower:
        if wallet in queried_users:
            users_response.append(queried_users[wallet])

    return users_response
