from sqlalchemy import desc
from src.models.indexing.ursm_content_node import UrsmContentNode
from src.queries.query_helpers import paginate_query
from src.utils import helpers
from src.utils.db_session import get_db_read_replica


def get_ursm_cnodes(owner_wallet):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(UrsmContentNode)
            .filter(
                UrsmContentNode.is_current == True,
            )
            .order_by(desc(UrsmContentNode.cnode_sp_id))
        )
        if owner_wallet is not None:
            base_query = base_query.filter(UrsmContentNode.owner_wallet == owner_wallet)
        query_results = paginate_query(base_query).all()
        ursm_content_nodes = helpers.query_result_to_list(query_results)

    return ursm_content_nodes
