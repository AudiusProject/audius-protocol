import logging
from typing import Dict, List, Optional, TypedDict

from src.models.grants.grant import Grant
from src.models.users.user import User
from src.queries.get_unpopulated_users import (
    get_unpopulated_users,
    get_unpopulated_users_by_wallet,
)
from src.queries.query_helpers import populate_user_metadata
from src.utils import db_session
from src.utils.helpers import query_result_to_list

logger = logging.getLogger(__name__)


class GetManagedUsersArgs(TypedDict):
    user_id: int
    is_approved: Optional[bool]
    is_revoked: Optional[bool]


class GetUserManagersArgs(TypedDict):
    user_id: int
    is_approved: Optional[bool]
    is_revoked: Optional[bool]


def make_user_managers_list(managers: List[Dict], grants: List[Dict]) -> List[Dict]:
    user_managers = []
    grants_map = {grant.get("grantee_address"): grant for grant in grants}

    for user in managers:
        grant = grants_map.get(user.get("wallet"))
        if grant is None:
            continue

        user_managers.append(
            {
                "manager": user,
                "grant": grant,
            }
        )

    return user_managers


def get_user_managers_with_grants(args: GetUserManagersArgs) -> List[Dict]:
    """
    Returns users which manage the given user

    Args:
        user_id: id of the managed user
        is_approved: Optional[bool] If set, filters by approval status
        is_revoked: Optional[bool] If set, filters by revocation status, defaults to False

    Returns:
        List of Users with grant information
    """
    is_approved = args.get("is_approved", None)
    is_revoked = args.get("is_revoked", False)
    user_id = args.get("user_id")

    if user_id is None:
        raise ValueError("user_id is required")

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        query = session.query(Grant).filter(
            Grant.user_id == user_id, Grant.is_current == True
        )

        if is_approved is not None:
            query = query.filter(Grant.is_approved == is_approved)
        if is_revoked is not None:
            query = query.filter(Grant.is_revoked == is_revoked)

        grants = query.all()
        if len(grants) == 0:
            return []

        wallet_addresses = [grant.grantee_address for grant in grants]
        users = get_unpopulated_users_by_wallet(session, wallet_addresses)
        user_ids = [user.get("user_id") for user in users]
        managers = populate_user_metadata(
            session, user_ids, users, current_user_id=user_id
        )

        grants = query_result_to_list(grants)

        return make_user_managers_list(managers, grants)


def make_managed_users_list(users: List[Dict], grants: List[Dict]) -> List[Dict]:
    managed_users = []
    grants_map = {grant.get("user_id"): grant for grant in grants}

    for user in users:
        grant = grants_map.get(user.get("user_id"))
        if grant is None:
            continue

        managed_users.append(
            {
                "user": user,
                "grant": grant,
            }
        )

    return managed_users


def get_managed_users_with_grants(args: GetManagedUsersArgs) -> List[Dict]:
    """
    Returns users managed by the given wallet address

    Args:
        user_id: Id of the manager
        is_approved: Optional[bool] If set, filters by approval status
        is_revoked: Optional[bool] If set, filters by revocation status, defaults to False

    Returns:
        List of Users with grant information
    """
    is_approved = args.get("is_approved", None)
    is_revoked = args.get("is_revoked", False)
    user_id = args.get("user_id")
    if user_id is None:
        raise ValueError("user_id is required")

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query(User.user_id, Grant)
            .join(Grant, User.wallet == Grant.grantee_address)
            .filter(User.user_id == user_id)
            .filter(Grant.is_current == True)
        )

        if is_approved is not None:
            query = query.filter(Grant.is_approved == is_approved)
        if is_revoked is not None:
            query = query.filter(Grant.is_revoked == is_revoked)

        results = query.all()
        if len(results) == 0:
            return []
        grants = [grant for [_, grant] in results]

        user_ids = [grant.user_id for grant in grants]
        users = get_unpopulated_users(session, user_ids)
        users = populate_user_metadata(
            session, user_ids, users, current_user_id=user_id
        )

        grants = query_result_to_list(grants)

        return make_managed_users_list(users, grants)


def is_active_manager(user_id: int, manager_id: int) -> bool:
    """
    Check if a manager is active for a given user.

    Args:
        user_id (int): The ID of the user.
        manager_id (int): The ID of the manager.

    Returns:
        bool: True if the manager is active for the user, False otherwise.
    """
    try:
        grants = get_user_managers_with_grants(
            GetUserManagersArgs(user_id=user_id, is_approved=True, is_revoked=False)
        )
        for grant in grants:
            manager = grant.get("manager")
            if manager and manager.get("user_id") == manager_id:
                return True
    except Exception as e:
        logger.error(
            f"get_managed_users.py | Unexpected exception checking managers for user: {e}"
        )
    return False
