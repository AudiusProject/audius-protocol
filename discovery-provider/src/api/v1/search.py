import logging

from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    format_limit,
    format_offset,
    full_search_parser,
    get_current_user_id,
    make_full_response,
    parse_bool_param,
    success_response,
)
from src.api.v1.models.search import search_model
from src.queries.search_queries import search
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

# Models & namespaces

full_ns = Namespace("search", description="Full search operations")


search_full_response = make_full_response(
    "search_full_response", full_ns, fields.Nested(search_model)
)


@full_ns.route("/full")
class FullSearch(Resource):
    @record_metrics
    @full_ns.doc(
        id="Search",
        description="""Get Users/Tracks/Playlists/Albums that best match the search query""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(full_search_parser)
    @full_ns.marshal_with(search_full_response)
    @cache(ttl_sec=5)
    def get(self):
        args = full_search_parser.parse_args()
        offset = format_offset(args)
        limit = format_limit(args)
        current_user_id = get_current_user_id(args)
        include_purchaseable = parse_bool_param(args.get("includePurchaseable"))

        search_args = {
            "is_auto_complete": False,
            "kind": args.get("kind", "all"),
            "query": args.get("query"),
            "current_user_id": current_user_id,
            "with_users": True,
            "limit": limit,
            "offset": offset,
            "only_downloadable": False,
            "include_purchaseable": include_purchaseable,
        }
        resp = search(search_args)
        return success_response(resp)


search_autocomplete_response = make_full_response(
    "search_autocomplete_response", full_ns, fields.Nested(search_model)
)


@full_ns.route("/autocomplete")
class FullSearchAutocomplete(Resource):
    @record_metrics
    @full_ns.doc(
        id="Search Autocomplete",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(full_search_parser)
    @full_ns.marshal_with(search_autocomplete_response)
    @cache(ttl_sec=5)
    def get(self):
        """
        Get Users/Tracks/Playlists/Albums that best match the search query

        Same as search but optimized for quicker response at the cost of some entity information.
        """
        args = full_search_parser.parse_args()
        offset = format_offset(args)
        limit = format_limit(args)
        current_user_id = get_current_user_id(args)
        include_purchaseable = parse_bool_param(args.get("includePurchaseable"))

        search_args = {
            "is_auto_complete": True,
            "kind": args.get("kind", "all"),
            "query": args.get("query"),
            "current_user_id": current_user_id,
            "with_users": False,
            "limit": limit,
            "offset": offset,
            "only_downloadable": False,
            "include_purchaseable": include_purchaseable,
        }
        resp = search(search_args)
        return success_response(resp)
