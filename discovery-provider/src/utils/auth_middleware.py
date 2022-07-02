import functools
import logging

from eth_account.messages import encode_defunct
from flask.globals import request
from src.models.users.user import User
from src.utils import db_session, web3_provider

logger = logging.getLogger(__name__)

MESSAGE_HEADER = "Encoded-Data-Message"
SIGNATURE_HEADER = "Encoded-Data-Signature"


def auth_middleware(**kwargs):
    """
    Auth middleware decorator.

    Should decorate a route and be used to supply an authed user to
    the query behind a route.

    Example:

    @auth_middleware
    def get(self):
        args = track_slug_parser.parse_args()
        slug, handle = (args.get("slug"), args.get("handle"))
        routes = args.get("route")

    @functools.wraps simply ensures that if Python introspects `inner_wrap`, it refers to
    `func` rather than `inner_wrap`.
    """

    def outer_wrap(func):
        @functools.wraps(func)
        def inner_wrap(*args, **kwargs):
            message = request.headers.get(MESSAGE_HEADER)
            signature = request.headers.get(SIGNATURE_HEADER)
            logger.info(f"isaac message {message}")
            logger.info(f"isaac signature {signature}")
            authed_user_id = None
            if message and signature:
                web3 = web3_provider.get_web3()
                encoded_to_recover = encode_defunct(text=message)
                wallet = web3.eth.account.recover_message(
                    encoded_to_recover, signature=signature
                )
                db = db_session.get_db_read_replica()
                with db.scoped_session() as session:
                    user = (
                        session.query(User.user_id)
                        .filter(
                            # Convert checksum wallet to lowercase
                            User.wallet == wallet.lower(),
                            User.is_current == True,
                        )
                        # In the case that multiple wallets match (not enforced on the data layer),
                        # pick the user id that is lowest (created first).
                        .order_by(User.user_id.asc())
                        .first()
                    )
                    if user:
                        authed_user_id = user.user_id
                        logger.info(
                            f"auth_middleware.py | authed_user_id: {authed_user_id}"
                        )
            return func(*args, **kwargs, authed_user_id=authed_user_id)

        return inner_wrap

    return outer_wrap
