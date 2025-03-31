from flask import has_request_context

from src.models.grants.grant import Grant
from src.utils import db_session
from src.utils.auth_middleware import recover_authority_from_signature_headers


def is_authorized_request(user_id: int):
    """Returns true if the request was signed by an authority that the user has granted access

    TODO: Make this take in a a `scope` parameter and add scopes to grants.

    "Authority" here refers to the signer of the request that is attempting to claim it has
    the authority to do a certain action.

    This function differs from `is_active_manager` in that:
    1. It works for non-users (eg. dev apps).
    2. It doesn't depend on query helpers (preventing circular dependency).
    3. It doesn't take in the authed user ID, instead getting it directly from request headers.
    """

    # If not in request context, we won't have headers
    if not has_request_context():
        return False

    # Get the authority (the wallet and/or user that signed the request)
    authority_user_id, authority_wallet = recover_authority_from_signature_headers()

    # The user has access every scope of their own
    if authority_user_id == user_id:
        return True

    # Check the grants to see if a wallet has authority on behalf of the user.
    # Both managers and dev apps have grant entries.
    # Developer apps are approved by default.
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        result = (
            session.query(Grant.is_approved)
            .filter(
                Grant.is_current == True,
                Grant.grantee_address == authority_wallet,
                Grant.user_id == user_id,
                Grant.is_revoked == False,
            )
            .first()
        )
        return result
