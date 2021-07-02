import logging  # pylint: disable=C0302
from flask_restx import Resource, Namespace, fields, reqparse
from src.api.v1.helpers import (
    extend_track,
    make_full_response,
    success_response,
    format_offset,
    format_limit,
    decode_string_id,
    extend_user,
    extend_track,
    extend_playlist,
    get_current_user_id,
)
from src.queries.search_queries import SearchKind, search
from src.utils.redis_cache import cache, extract_key, use_redis_cache
from src.utils.redis_metrics import record_metrics
from src.api.v1.models.search import search_model

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


search_route_parser = reqparse.RequestParser()
search_route_parser.add_argument("user_id", required=False)
search_route_parser.add_argument(
    "kind",
    required=False,
    type=str,
    default="all",
    choices=("all", "users", "tracks", "playlists", "albums"),
)
search_route_parser.add_argument("query", required=True, type=str)
search_route_parser.add_argument("limit", required=False, type=int)
search_route_parser.add_argument("offset", required=False, type=int)
search_full_response = make_full_response(
    "search_full_response", full_ns, fields.Nested(search_model)
)


@full_ns.route("/full")
class FullSearch(Resource):
    @full_ns.expect(search_route_parser)
    @full_ns.doc(
        id="""Get Users/Tracks/Playlists/Albums that best match the search query""",
        params={
            "user_id": "A User ID of the requesting user to personalize the response",
            "query": "Search query text",
            "kind": "The type of response, one of: all, users, tracks, playlists, or albums",
            "limit": "Limit",
            "offset": "Offset",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(search_full_response)
    @cache(ttl_sec=5)
    def get(self):
        args = search_route_parser.parse_args()
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
        resp = search(search_args)
        resp = extend_search(resp)

        return success_response(resp)


search_autocomplete_response = make_full_response(
    "search_autocomplete_response", full_ns, fields.Nested(search_model)
)


@full_ns.route("/autocomplete")
class FullSearch(Resource):
    @full_ns.expect(search_route_parser)
    @full_ns.doc(
        id="""Get Users/Tracks/Playlists/albums that best match the search query""",
        params={
            "user_id": "A User ID of the requesting user to personalize the response",
            "query": "Search query text",
            "kind": "The type of response, one of: all, users, tracks, playlists, or albums",
            "limit": "Limit",
            "offset": "Offset",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(search_autocomplete_response)
    @cache(ttl_sec=5)
    def get(self):
        args = search_route_parser.parse_args()
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
