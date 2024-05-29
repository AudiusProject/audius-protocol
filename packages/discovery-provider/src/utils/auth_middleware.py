import functools
import logging
from enum import Enum
from typing import cast

from eth_account.messages import encode_defunct
from flask.globals import request
from flask_restx import Namespace, reqparse

from src.models.users.user import User
from src.queries.get_managed_users import (
    GetUserManagersArgs,
    get_user_managers_with_grants,
)
from src.utils import db_session, web3_provider
from src.utils.helpers import decode_string_id

logger = logging.getLogger(__name__)

MESSAGE_HEADER = "Encoded-Data-Message"
SIGNATURE_HEADER = "Encoded-Data-Signature"


def is_active_manager(user_id: int, manager_id: int) -> bool:
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
            f"auth_middleware.py | Unexpected exception checking managers for user: {e}"
        )
    return False


class AccessLevel(Enum):
    ALL = "all"
    AUTHENTICATED = "authenticated"
    OWNER = "owner"


def auth_middleware(
    parser: reqparse.RequestParser = None,
    # Include the wallet in the kwargs for the wrapped function
    include_wallet: bool = False,
    access_level: AccessLevel = AccessLevel.ALL,
    # Name of the URL parameter to check for the user ID, required if access_level is `OWNER`
    id_param: str = "id",
    # Required if access_level is not `ALL`
    ns: Namespace = None,
):
    """
    Auth middleware decorator.

    Should decorate a route and be used to supply an authed user to
    the query behind a route.

    e.g.

    @auth_middleware()
    def get(self, authed_user_id):
        print(authed_user_id)

    If a flask restx RequestParser is passed, header arguments
    Encoded-Data-Message and Encoded-Data-Signature are expected on the parser.

    e.g.

    @ns.expect(request_parser)
    @auth_middleware(request_parser)
    def get(self):
        request.headers.get("Encoded-Data-Message")

    """

    def decorator(func):
        if parser:
            parser.add_argument(
                MESSAGE_HEADER,
                required=False,
                description="The data that was signed by the user for signature recovery",
                location="headers",
            )
            parser.add_argument(
                SIGNATURE_HEADER,
                required=False,
                description="The signature of data, used for signature recovery",
                location="headers",
            )
        if access_level != AccessLevel.ALL:
            if not ns:
                raise ValueError("Namespace is required when access_level is not ALL")
        if access_level == AccessLevel.OWNER and not id_param:
            raise ValueError("id_param is required when access_level is OWNER")

        # @functools.wraps simply ensures that if Python introspects `wrapper`, it refers to
        # `func` rather than `wrapper`.
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            message = request.headers.get(MESSAGE_HEADER)
            signature = request.headers.get(SIGNATURE_HEADER)
            wallet_lower = None

            authed_user_id = None
            if message and signature:
                web3 = web3_provider.get_web3()
                encoded_to_recover = encode_defunct(text=message)
                wallet = web3.eth.account.recover_message(
                    encoded_to_recover, signature=signature
                )
                wallet_lower = wallet.lower()
                db = db_session.get_db_read_replica()
                with db.scoped_session() as session:
                    user = (
                        session.query(User.user_id)
                        .filter(
                            # Convert checksum wallet to lowercase
                            User.wallet == wallet_lower,
                            User.is_current == True,
                        )
                        # In the case that multiple wallets match (not enforced on the data layer),
                        # pick the user that was created first.
                        .order_by(User.created_at.asc())
                        .first()
                    )
                    if user:
                        authed_user_id = user.user_id
                        logger.info(
                            f"auth_middleware.py | authed_user_id: {authed_user_id}"
                        )
            kwargs["authed_user_id"] = authed_user_id
            if include_wallet:
                kwargs["authed_user_wallet"] = wallet_lower

            if (
                access_level in [AccessLevel.AUTHENTICATED, AccessLevel.OWNER]
                and authed_user_id is None
            ):
                ns.abort(401, "You must be logged in to make this request.")

            if access_level == AccessLevel.OWNER:
                user_id_input = kwargs.get(id_param)
                decoded = decode_string_id(user_id_input)
                if decoded is None:
                    ns.abort(404, f"Invalid ID: '{user_id_input}'.")
                user_id = cast(int, decoded)

                if not user_id:
                    logger.error(
                        f"auth_middleware.py | Failed to find user id in request params. Is {id_param} the correct parameter?"
                    )
                    ns.abort(400, "Failed to validate requested user.")

                if not is_active_manager(user_id=user_id, manager_id=authed_user_id):
                    ns.abort(403, "You do not have permission to access this resource.")

            return func(*args, **kwargs)

        return wrapper

    return decorator
