import logging

from flask_restx import Namespace, Resource
from src.api.v1.helpers import success_response
from src.queries.get_cid_type_data import get_cid_type_data
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

ns = Namespace("cid_data", description="Metadata related operations")

# metadatas_response = make_response(
#     "metadata_response", ns, fields.List(fields.Nested(metadata_model))
# )
# full_metadatas_response = make_full_response(
#     "full_metadata_response", full_ns, fields.List(fields.Nested(full_metadata_model))
# )
# @ns.marshal_with(metadatas_response)


def get_data(cid: str):
    """Returns a single metadata, or None"""
    type, metadata = get_cid_type_data(cid)
    return type, metadata


CID_METDATA_ROUTE = "/<string:metadata_id>"


@ns.route(CID_METDATA_ROUTE)
class Metadata(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Metdata""",
        description="""Get a metadata by CID""",
        params={"metadata_id": "A Metdata CID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @cache(ttl_sec=5)
    def get(self, metadata_id):
        type, data = get_data(metadata_id)
        response = success_response({"type": type, "data": data})
        return response
