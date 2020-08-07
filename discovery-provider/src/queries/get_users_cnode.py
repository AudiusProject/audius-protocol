import logging # pylint: disable=C0302
from sqlalchemy import asc, or_

from src import exceptions
from src.models import User
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import get_current_user_id, populate_user_metadata, paginate_query

logger = logging.getLogger(__name__)

def get_users_cnode(sp_node_id):
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(User)

        base_query = base_query.filter(
            User.is_current == True,
            or_(
                User.primary == sp_node_id,
                User.secondaries.any(sp_node_id)
            )
        )
        base_query = base_query.order_by(asc(User.user_id))
        users = paginate_query(base_query).all()
        users = helpers.query_result_to_list(users)
    return users
