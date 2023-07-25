import logging

from flask_restx import Namespace, Resource

from src.api.v1.helpers import success_response
from src.queries.get_cid_type_data import get_cid_type_data
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

full_ns = Namespace("cid_data", description="Metadata related operations")


def get_data(cid: str):
    """Returns a single metadata, or None"""
    type, metadata = get_cid_type_data(cid)
    return type, metadata


CID_METDATA_ROUTE = "/<string:metadata_id>"


@full_ns.route(CID_METDATA_ROUTE, doc=False)
class Metadata(Resource):
    @record_metrics
    @full_ns.doc(
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
