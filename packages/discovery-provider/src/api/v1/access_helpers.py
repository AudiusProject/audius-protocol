import logging

from flask_restx.errors import abort

from src.queries.get_managed_users import (
    GetUserManagersArgs,
    get_user_managers_with_grants,
)

logger = logging.getLogger(__name__)


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
            f"access_helpers.py | Unexpected exception checking managers for user: {e}"
        )
    return False


def check_authorized(user_id, authed_user_id):
    """
    Checks that the authenticated user matches or is a manager of the requested user.

    Args:
        user_id: The requested user ID.
        authed_user_id: The ID of the authenticated user.

    Raises:
        HTTPError: If the user is not authorized to access the resource.
    """
    if user_id != authed_user_id and not is_active_manager(user_id, authed_user_id):
        abort(403, message="You are not authorized to access this resource")
