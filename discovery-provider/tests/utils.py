from src import models
from src.utils import helpers
from src.utils.db_session import get_db


def query_creator_by_name(app, creator_name=None):
    """Return list of creators filtered by name (if present)"""
    query_results = None
    with app.app_context():
        db = get_db()

        with db.scoped_session() as session:
            if creator_name is not None:
                query_results = (
                    session.query(models.User)
                    .filter(models.User.name == creator_name)
                    .order_by(models.User.user_id)
                    .all()
                )
            else:
                query_results = (
                    session.query(models.User)
                    .order_by(models.User.user_id)
                    .all()
                )

            assert query_results is not None
            return_list = helpers.query_result_to_list(query_results)
            return return_list

def to_bytes(val, length=32):
    val = val[:length]
    return bytes(val, 'utf-8')
