from src import exceptions
from src.models import L2ContentNode
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query

def get_l2_cnodes():
    l2_content_nodes = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query(L2ContentNode)
            .filter(
                L2ContentNode.is_current == True,
            )
        )
        query_results = paginate_query(query).all()
        l2_content_nodes = helpers.query_result_to_list(query_results)

    return l2_content_nodes
