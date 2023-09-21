from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    abort_not_found,
    format_developer_app,
    get_prefixed_eth_address,
    make_response,
    success_response,
)
from src.api.v1.models.developer_apps import developer_app
from src.queries.get_developer_apps import get_developer_app_by_address
from src.utils.redis_metrics import record_metrics

ns = Namespace("developer_apps", description="Developer app related operations")

developer_app_response = make_response(
    "developer_app_response", ns, fields.Nested(developer_app)
)


@ns.route("/<string:address>")
class GetDeveloperApp(Resource):
    @record_metrics
    @ns.doc(
        id="Get Developer App",
        description="Gets developer app matching given address (API key)",
        params={"address": "A developer app address (API Key)"},
        responses={
            200: "Success",
            400: "Bad request",
            404: "Not found",
            500: "Server error",
        },
    )
    @ns.marshal_with(developer_app_response)
    def get(self, address):
        raw_developer_app = get_developer_app_by_address(
            get_prefixed_eth_address(address)
        )
        if not raw_developer_app:
            abort_not_found(address, ns)
        developer_app = format_developer_app(raw_developer_app)
        return success_response(developer_app)
