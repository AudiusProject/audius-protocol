from src.models import URSMContentNode
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries.query_helpers import paginate_query

def get_ursm_cnodes():
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query(URSMContentNode)
            .filter(
                URSMContentNode.is_current == True,
            )
            .order_by(URSMContentNode.cnode_sp_id)
        )
        query_results = paginate_query(query).all()
        ursm_content_nodes = helpers.query_result_to_list(query_results)

    return ursm_content_nodes
