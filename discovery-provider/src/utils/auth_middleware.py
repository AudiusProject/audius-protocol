import functools
from flask.globals import request
from eth_account.messages import encode_defunct
from src.models.models import User
from src.utils import web3_provider, db_session


MESSAGE_HEADER = 'Encoded-Data-Message'
SIGNATURE_HEADER = 'Encoded-Data-Signature'

def auth_middleware(**kwargs):
    """
    Auth middleware decorator.

    Should decorate a route and be used to supply an authed user to
    the query behind a route.

    Arguments:

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

            authed_user_id = None
            if message and signature:
                web3 = web3_provider.get_web3()
                # to_recover_hash = Web3.keccak(text=message).hex()
                encoded_to_recover = encode_defunct(text=message)
                wallet = web3.eth.account.recover_message(
                    encoded_to_recover,
                    signature=signature
                )
                db = db_session.get_db_read_replica()
                with db.scoped_session() as session:
                    user = (
                        session.query(User.user_id)
                        .filter(
                            # Convert checksum wallet to lowercase
                            User.wallet==wallet.lower(),
                            User.is_current==True
                        )
                        .first()
                    )
                    if user:
                        authed_user_id = user.user_id
            return func(*args, **kwargs, authed_user_id=authed_user_id)
        return inner_wrap

    return outer_wrap
