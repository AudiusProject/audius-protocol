import logging
from typing import Dict, List, Optional, TypedDict

from src.models.grants.grant import Grant
from src.queries.get_unpopulated_users import get_unpopulated_users
from src.queries.query_helpers import populate_user_metadata
from src.utils import db_session
from src.utils.helpers import model_to_dictionary, query_result_to_list

logger = logging.getLogger(__name__)


class GetManagedUsersArgs(TypedDict):
    manager_wallet_address: str
    current_user_id: int
    is_approved: Optional[bool]
    is_revoked: Optional[bool]


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
        manager_wallet_address: str wallet address of the manager
        is_approved: Optional[bool] If set, filters by approval status
        is_revoked: Optional[bool] If set, filters by revocation status, defaults to False

    Returns:
        List of Users with grant information
    """
    is_approved = args.get("is_approved", None)
    is_revoked = args.get("is_revoked", False)
    current_user_id = args.get("current_user_id")
    grantee_address = args.get("manager_wallet_address")
    if grantee_address is None:
        raise ValueError("manager_wallet_address is required")
    if current_user_id is None:
        raise ValueError("current_user_id is required")

    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        query = session.query(Grant).filter(
            Grant.grantee_address == grantee_address, Grant.is_current == True
        )

        if is_approved is not None:
            query = query.filter(Grant.is_approved == is_approved)
        if is_revoked is not None:
            query = query.filter(Grant.is_revoked == is_revoked)

        grants = query.all()
        if len(grants) == 0:
            return []

        user_ids = [grant.user_id for grant in grants]
        users = get_unpopulated_users(session, user_ids)
        users = populate_user_metadata(session, user_ids, users, current_user_id)

        grants = query_result_to_list(grants)

        return make_managed_users_list(users, grants)
