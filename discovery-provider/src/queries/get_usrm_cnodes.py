from src.models import USRMContentNode
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query

def get_usrm_cnodes():
    usrm_content_nodes = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query(USRMContentNode)
            .filter(
                USRMContentNode.is_current == True,
            )
        )
        query_results = paginate_query(query).all()
        usrm_content_nodes = helpers.query_result_to_list(query_results)

    return usrm_content_nodes
