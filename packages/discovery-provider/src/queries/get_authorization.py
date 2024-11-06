from src.models.grants.grant import Grant
from src.utils import db_session
from src.utils.auth_middleware import recover_authority_from_signature_headers


def is_authorized_request(user_id: int):
    """Returns true if the request was signed by an authority that has been granted access by the given user"""
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
