import logging  # pylint: disable=C0302
from sqlalchemy import asc

from src.models import User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

def get_user_history(user_id):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        user_history_query = (
            session.query(User)
            .filter(User.user_id == user_id)
            .order_by(User.updated_at.desc())
        )

        user_history = user_history_query.all()

        if not user_history:
            return None

        return helpers.query_result_to_list(user_history)