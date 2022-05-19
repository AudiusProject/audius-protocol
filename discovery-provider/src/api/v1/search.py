import logging
import os  # pylint: disable=C0302

from flask_restx import Namespace, Resource, fields
from src.api.v1.helpers import (
    extend_playlist,
    extend_track,
    extend_user,
    format_limit,
    format_offset,
    full_search_parser,
    get_current_user_id,
    make_full_response,
    success_response,
)
from src.api.v1.models.search import search_model
from src.queries.search_es import search_es_full
from src.queries.search_queries import search
from src.utils.redis_cache import cache

logger = logging.getLogger(__name__)

# Models & namespaces

full_ns = Namespace("search", description="Full search operations")


# Helpers
def extend_search(resp):
    if "users" in resp:
        resp["users"] = list(map(extend_user, resp["users"]))
    if "followed_users" in resp:
        resp["followed_users"] = list(map(extend_user, resp["followed_users"]))
    if "tracks" in resp:
        resp["tracks"] = list(map(extend_track, resp["tracks"]))
    if "saved_tracks" in resp:
        resp["saved_tracks"] = list(map(extend_track, resp["saved_tracks"]))
    if "playlists" in resp:
        resp["playlists"] = list(map(extend_playlist, resp["playlists"]))
    if "saved_playlists" in resp:
        resp["saved_playlists"] = list(map(extend_playlist, resp["saved_playlists"]))
    if "albums" in resp:
        resp["albums"] = list(map(extend_playlist, resp["albums"]))
    if "saved_albums" in resp:
        resp["saved_albums"] = list(map(extend_playlist, resp["saved_albums"]))
    return resp


search_full_response = make_full_response(
    "search_full_response", full_ns, fields.Nested(search_model)
)

@full_ns.route("/full")
class FullElasticsearch(Resource):
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

        search_args = {
            "is_auto_complete": False,
            "kind": args.get("kind", "all"),
            "query": args.get("query"),
            "current_user_id": current_user_id,
            "with_users": True,
            "limit": limit,
            "offset": offset,
            "only_downloadable": False,
        }
        if os.getenv('search_elasticsearch_enabled'):
            try:
                resp = search_es_full(search_args)
                return success_response(resp)
            except:
                logger.info("Failed to get search results from Elasticsearch.")

        resp = search(search_args)
        resp = extend_search(resp)
        return success_response(resp)
        

search_autocomplete_response = make_full_response(
    "search_autocomplete_response", full_ns, fields.Nested(search_model)
)


@full_ns.route("/autocomplete")
class FullSearchAutocomplete(Resource):
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

        search_args = {
            "is_auto_complete": True,
            "kind": args.get("kind", "all"),
            "query": args.get("query"),
            "current_user_id": current_user_id,
            "with_users": False,
            "limit": limit,
            "offset": offset,
            "only_downloadable": False,
        }
        resp = search(search_args)
        resp = extend_search(resp)

        return success_response(resp)
