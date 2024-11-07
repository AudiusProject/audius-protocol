import functools
import logging

from eth_account.messages import encode_defunct
from flask.globals import request
from flask_restx import reqparse
from flask_restx.errors import abort

from src.models.users.user import User
from src.utils import db_session, web3_provider

logger = logging.getLogger(__name__)

MESSAGE_HEADER = "Encoded-Data-Message"
SIGNATURE_HEADER = "Encoded-Data-Signature"


def recover_authority_from_signature_headers() -> tuple[int | None, str | None]:
    message = request.headers.get(MESSAGE_HEADER)
    signature = request.headers.get(SIGNATURE_HEADER)
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
                return user.user_id, wallet_lower
            else:
                return None, wallet_lower
    return None, None


def auth_middleware(
    parser: reqparse.RequestParser = None,
    # If True, user must be authenticated to access this route, will abort with 401 if no user is found in headers.
    require_auth: bool = False,
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

    If you want to abort the request if the user is not authenticated, set require_auth=True.

    e.g.

    @auth_middleware(require_auth=True)
    def get(self, authed_user_id):
        print(authed_user_id)

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

        # @functools.wraps simply ensures that if Python introspects `wrapper`, it refers to
        # `func` rather than `wrapper`.
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            authed_user_id, _ = recover_authority_from_signature_headers()
            if authed_user_id:
                logger.debug(f"auth_middleware.py | authed_user_id: {authed_user_id}")

            if require_auth and authed_user_id is None:
                abort(401, "You must be logged in to make this request.")

            kwargs["authed_user_id"] = authed_user_id

            return func(*args, **kwargs)

        return wrapper

    return decorator
