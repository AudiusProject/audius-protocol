from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    abort_not_found,
    make_full_response_with_related,
    make_response,
    pagination_with_current_user_parser,
)
from src.api.v1.models.explore import best_selling_item_model

ns = Namespace("explore", description="Explore related operations")
full_ns = Namespace("explore", description="Full explore operations")

best_selling_response = make_response(
    "best_selling_response", ns, fields.Nested(best_selling_item_model, as_list=True)
)

best_selling_full_response = make_full_response_with_related(
    "best_selling_full_response",
    full_ns,
    fields.Nested(best_selling_item_model, as_list=True),
)

best_selling_parser = pagination_with_current_user_parser.copy()
best_selling_parser.add_argument(
    "type",
    required=False,
    default="all",
    choices=("all", "track", "album"),
    type=str,
    description="The type of content to filter by",
)


@ns.route("/best-selling")
class BestSelling(Resource):
    @ns.doc(
        id="Get Best Selling",
        description="Get best selling tracks and playlists",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(best_selling_parser)
    @ns.marshal_with(best_selling_response)
    def get(self):
        """Get best selling tracks and/or albums"""
        # This is stubbed, just generating docs
        abort_not_found("best_selling", ns)


@full_ns.route("/best-selling")
class FullBestSelling(Resource):
    @full_ns.doc(
        id="Get Full Best Selling",
        description="Get best selling tracks and/or albums with related entities",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(best_selling_parser)
    @full_ns.marshal_with(best_selling_full_response)
    def get(self):
        """Get best selling tracks and playlists with related entities"""
        # This is stubbed, just generating docs
        abort_not_found("best_selling", full_ns)
