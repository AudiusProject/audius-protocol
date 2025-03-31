import logging

from flask_restx.errors import abort

from src.queries.get_authorization import is_authorized_request
from src.queries.get_managed_users import is_active_manager

logger = logging.getLogger(__name__)


def check_authorized(user_id, authed_user_id):
    """
    Checks that the authenticated user matches or is a manager of the requested user.

    Args:
        user_id: The requested user ID.
        authed_user_id: The ID of the authenticated user.

    Raises:
        HTTPError: If the user is not authorized to access the resource.
    """
    user_granted_access = is_authorized_request(user_id)

    if (
        user_id != authed_user_id
        and not is_active_manager(user_id, authed_user_id)
        and not user_granted_access
    ):
        abort(403, message="You are not authorized to access this resource")
