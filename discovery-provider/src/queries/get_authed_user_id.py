from src.api_helpers import recover_wallet
from src.models.users.user import User
from src.utils.db_session import get_db_read_replica


def get_authed_user_id(data: str, signature: str):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        user_wallet = recover_wallet(data, signature, strip_quotes=True)
        # todo: make sure user_wallet casing / checksum is correct
        result = (
            session.query(User.user_id)
            .filter(User.wallet == user_wallet)
            .filter(User.is_current == True)
            .one_or_none()
        )
        return result[0] if result else None
