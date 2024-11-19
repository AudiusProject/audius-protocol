import logging

from flask import Blueprint, Response
from flask.globals import request
from flask_restx import Namespace, Resource, fields, inputs

from src.api.v1.helpers import (
    abort_bad_path_param,
    abort_bad_request_param,
    abort_not_found,
    current_user_parser,
    decode_ids_array,
    decode_with_abort,
    extend_playlist,
    extend_track,
    extend_user,
    filter_hidden_tracks,
    full_trending_parser,
    get_current_user_id,
    get_default_max,
    make_full_response,
    make_response,
    pagination_with_current_user_parser,
    parse_bool_param,
    playlist_search_parser,
    success_response,
    trending_parser,
)
from src.api.v1.models.playlists import (
    album_access_info,
    full_playlist_model,
    playlist_model,
)
from src.api.v1.models.users import user_model_full
from src.queries.get_extended_purchase_gate import get_extended_purchase_gate
from src.queries.get_playlist_tracks import get_playlist_tracks
from src.queries.get_playlists import get_playlists
from src.queries.get_reposters_for_playlist import get_reposters_for_playlist
from src.queries.get_savers_for_playlist import get_savers_for_playlist
from src.queries.get_top_playlists import get_top_playlists  # pylint: disable=C0302
from src.queries.get_trending_playlists import (
    TRENDING_LIMIT,
    TRENDING_TTL_SEC,
    get_full_trending_playlists,
    get_trending_playlists,
)
from src.queries.get_unclaimed_id import get_unclaimed_id
from src.queries.search_queries import SearchKind, search
from src.trending_strategies.trending_strategy_factory import (
    DEFAULT_TRENDING_VERSIONS,
    TrendingStrategyFactory,
)
from src.trending_strategies.trending_type_and_version import TrendingType
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

from .models.tracks import track, track_full

logger = logging.getLogger(__name__)

trending_strategy_factory = TrendingStrategyFactory()

ns = Namespace("playlists", description="Playlist related operations")
full_ns = Namespace("playlists", description="Full playlist related operations")

playlists_response = make_response(
    "playlist_response", ns, fields.List(fields.Nested(playlist_model))
)
full_playlists_response = make_full_response(
    "full_playlist_response", full_ns, fields.List(fields.Nested(full_playlist_model))
)

playlists_with_score = ns.clone(
    "playlist_full",
    full_playlist_model,
    {"score": fields.Float},
)

full_playlists_with_score_response = make_full_response(
    "full_playlist_with_score_response",
    full_ns,
    fields.List(fields.Nested(playlists_with_score)),
)


def format_get_playlists_args(
    current_user_id,
    playlist_id,
    route,
    with_users,
):
    args = {
        "current_user_id": current_user_id,
        "with_users": with_users,
    }
    if playlist_id:
        args["playlist_ids"] = [playlist_id]
    if route:
        args["routes"] = [route]
    return args


def get_playlist(
    current_user_id,
    playlist_id=None,
    route=None,
    with_users=True,
):
    """Returns a single playlist, or None"""
    args = format_get_playlists_args(current_user_id, playlist_id, route, with_users)
    playlists = get_playlists(args)
    if playlists:
        return extend_playlist(playlists[0])
    return None


def get_tracks_for_playlist(playlist_id, current_user_id=None, exclude_gated=False):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        args = {
            "playlist_ids": [playlist_id],
            "populate_tracks": True,
            "current_user_id": current_user_id,
            "exclude_gated": exclude_gated,
        }
        playlist_tracks_map = get_playlist_tracks(session, args)
        playlist_tracks = playlist_tracks_map[playlist_id]
        tracks = list(map(extend_track, playlist_tracks))
        return tracks


def get_bulk_playlists(
    current_user_id,
    playlist_ids=None,
    route=None,
    with_users=True,
):
    """Returns a list of playlists"""
    args = {
        "playlist_ids": playlist_ids,
        "routes": route,
        "current_user_id": current_user_id,
        "with_users": with_users,
    }

    playlists = get_playlists(args)
    if playlists:
        return list(map(extend_playlist, playlists))
    return None


PLAYLIST_ROUTE = "/<string:playlist_id>"


@ns.route(PLAYLIST_ROUTE)
class Playlist(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Playlist""",
        description="""Get a playlist by ID""",
        params={"playlist_id": "A Playlist ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(playlists_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        playlist_id = decode_with_abort(playlist_id, ns)
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)
        playlist = get_playlist(
            current_user_id=current_user_id,
            playlist_id=playlist_id,
        )
        if playlist:
            tracks = get_tracks_for_playlist(playlist_id, current_user_id)
            playlist["tracks"] = tracks
            filter_hidden_tracks(playlist, current_user_id)
        response = success_response([playlist] if playlist else [])
        return response


@full_ns.route(PLAYLIST_ROUTE)
class FullPlaylist(Resource):
    @ns.doc(
        id="""Get Playlist""",
        description="""Get a playlist by ID""",
        params={"playlist_id": "A Playlist ID"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(full_playlists_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        playlist_id = decode_with_abort(playlist_id, full_ns)
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)
        playlist = get_playlist(
            current_user_id=current_user_id,
            playlist_id=playlist_id,
        )
        if playlist:
            tracks = get_tracks_for_playlist(playlist_id, current_user_id)
            playlist["tracks"] = tracks
            filter_hidden_tracks(playlist, current_user_id)
        response = success_response([playlist] if playlist else [])
        return response


playlists_route_parser = current_user_parser.copy()
playlists_route_parser.add_argument(
    "id", action="append", required=False, description="The ID of the playlist(s)"
)


@ns.route("")
class BulkPlaylists(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Bulk Playlists""",
        description="""Gets a list of playlists by ID""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(playlists_route_parser)
    @ns.marshal_with(playlists_response)
    @cache(ttl_sec=5)
    def get(self):
        args = playlists_route_parser.parse_args()
        ids = decode_ids_array(args.get("id"))
        current_user_id = get_current_user_id(args)
        playlists = get_bulk_playlists(
            current_user_id=current_user_id,
            playlist_ids=ids,
        )
        if not playlists:
            abort_not_found(ids, ns)

        for playlist in playlists:
            filter_hidden_tracks(playlist, current_user_id)

        response = success_response(playlists)
        return response


@full_ns.route("")
class BulkPlaylistsFull(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Bulk Playlists""",
        description="""Gets a list of playlists by ID""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(playlists_route_parser)
    @ns.marshal_with(full_playlists_response)
    @cache(ttl_sec=5)
    def get(self):
        args = playlists_route_parser.parse_args()
        ids = decode_ids_array(args.get("id"))
        current_user_id = get_current_user_id(args)
        playlists = get_bulk_playlists(
            current_user_id=current_user_id,
            playlist_ids=ids,
        )

        if not playlists:
            abort_not_found(ids, ns)

        def add_playlist_tracks(playlist):
            tracks = get_tracks_for_playlist(playlist["playlist_id"], current_user_id)
            playlist["tracks"] = tracks
            return playlist

        playlists = list(map(add_playlist_tracks, playlists))
        for playlist in playlists:
            filter_hidden_tracks(playlist, current_user_id)
        response = success_response(playlists)
        return response


@ns.route("/by_permalink/<string:handle>/<string:slug>")
class PlaylistByHandleAndSlug(Resource):
    @ns.doc(
        id="""Get Playlist By Handle and Slug""",
        description="""Get a playlist by handle and slug""",
        params={"handle": "playlist owner handle", "slug": "playlist slug"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(playlists_response)
    @cache(ttl_sec=5)
    def get(self, handle, slug):
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        route = {
            "handle": handle,
            "slug": slug,
        }

        playlist = get_playlist(current_user_id=current_user_id, route=route)
        return_response = []
        if playlist:
            tracks = get_tracks_for_playlist(playlist["playlist_id"], current_user_id)
            playlist["tracks"] = tracks
            filter_hidden_tracks(playlist, current_user_id)
            return_response = [playlist]

        return success_response(return_response)


@full_ns.route("/by_permalink/<string:handle>/<string:slug>")
class FullPlaylistByHandleAndSlug(Resource):
    @ns.doc(
        id="""Get Playlist By Handle and Slug""",
        description="""Get a playlist by handle and slug""",
        params={"handle": "playlist owner handle", "slug": "playlist slug"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(full_playlists_response)
    @cache(ttl_sec=5)
    def get(self, handle, slug):
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        route = {
            "handle": handle,
            "slug": slug,
        }

        playlist = get_playlist(current_user_id=current_user_id, route=route)
        return_response = []
        if playlist:
            tracks = get_tracks_for_playlist(playlist["playlist_id"], current_user_id)
            playlist["tracks"] = tracks
            filter_hidden_tracks(playlist, current_user_id)
            return_response = [playlist]

        return success_response(return_response)


playlist_tracks_response = make_response(
    "playlist_tracks_response", ns, fields.List(fields.Nested(track))
)
full_playlist_tracks_response = make_full_response(
    "full_playlist_tracks_response", full_ns, fields.List(fields.Nested(track_full))
)


@ns.route("/<string:playlist_id>/tracks")
class PlaylistTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Playlist Tracks""",
        description="""Fetch tracks within a playlist.""",
        params={"playlist_id": "A Playlist ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(playlist_tracks_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        decoded_id = decode_with_abort(playlist_id, ns)
        tracks = get_tracks_for_playlist(playlist_id=decoded_id, exclude_gated=True)
        return success_response(tracks)


@full_ns.route("/<string:playlist_id>/tracks")
class FullPlaylistTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Playlist Tracks""",
        description="""Fetch tracks within a playlist.""",
        params={"playlist_id": "A Playlist ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(full_playlist_tracks_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        decoded_id = decode_with_abort(playlist_id, ns)
        tracks = get_tracks_for_playlist(decoded_id)
        return success_response(tracks)


playlist_search_result = make_response(
    "playlist_search_result", ns, fields.List(fields.Nested(playlist_model))
)


@ns.route("/search")
class PlaylistSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Playlists""",
        description="""Search for a playlist""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(playlist_search_parser)
    @ns.marshal_with(playlist_search_result)
    @cache(ttl_sec=600)
    def get(self):
        args = playlist_search_parser.parse_args()
        query = args.get("query")
        genres = args.get("genre")
        moods = args.get("mood")
        include_purchaseable = parse_bool_param(args.get("includePurchaseable"))
        has_downloads = parse_bool_param(args.get("has_downloads"))
        sort_method = args.get("sort_method")
        search_args = {
            "query": query,
            "kind": SearchKind.playlists.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True,
            "limit": 10,
            "offset": 0,
            "genres": genres,
            "moods": moods,
            "include_purchaseable": include_purchaseable,
            "only_with_downloads": has_downloads,
            "sort_method": sort_method,
        }
        response = search(search_args)
        return success_response(response["playlists"])


top_parser = pagination_with_current_user_parser.copy()
top_parser.add_argument(
    "type",
    required=True,
    choices=("album", "playlist"),
    description="The collection type",
)
top_parser.add_argument(
    "mood",
    required=False,
    description="Filter to a mood",
)
top_parser.add_argument(
    "filter",
    required=False,
    description="Filter for the playlist query",
)


@full_ns.route("/top", doc=False)
class Top(Resource):
    @record_metrics
    @ns.doc(id="""Top Playlists""", description="""Gets top playlists.""")
    @ns.marshal_with(full_playlists_with_score_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        args = top_parser.parse_args()
        if args.get("limit") is None:
            args["limit"] = 100
        else:
            args["limit"] = min(args.get("limit"), 100)
        if args.get("offset") is None:
            args["offset"] = 0
        if args.get("type") not in ["album", "playlist"]:
            abort_bad_request_param("type", ns)
        current_user_id = get_current_user_id(args)
        if current_user_id:
            args["current_user_id"] = current_user_id

        args["with_users"] = True

        response = get_top_playlists(args.type, args)

        playlists = list(map(extend_playlist, response))
        return success_response(playlists)


playlist_favorites_response = make_full_response(
    "following_response", full_ns, fields.List(fields.Nested(user_model_full))
)


@full_ns.route("/<string:playlist_id>/favorites")
class FullTrackFavorites(Resource):
    @full_ns.doc(
        id="""Get Users From Playlist Favorites""",
        description="""Get users that favorited a playlist""",
        params={"playlist_id": "A Playlist ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(playlist_favorites_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(playlist_id, full_ns)
        limit = get_default_max(args.get("limit"), 10, 100)
        offset = get_default_max(args.get("offset"), 0)
        current_user_id = get_current_user_id(args)
        args = {
            "save_playlist_id": decoded_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        users = get_savers_for_playlist(args)
        users = list(map(extend_user, users))

        return success_response(users)


playlist_reposts_response = make_full_response(
    "following_response", full_ns, fields.List(fields.Nested(user_model_full))
)


@full_ns.route("/<string:playlist_id>/reposts")
class FullPlaylistReposts(Resource):
    @full_ns.doc(
        id="""Get Users From Playlist Reposts""",
        description="""Get users that reposted a playlist""",
        params={"playlist_id": "A Playlist ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(playlist_reposts_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(playlist_id, full_ns)
        limit = get_default_max(args.get("limit"), 10, 100)
        offset = get_default_max(args.get("offset"), 0)
        current_user_id = get_current_user_id(args)
        args = {
            "repost_playlist_id": decoded_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        users = get_reposters_for_playlist(args)
        users = list(map(extend_user, users))
        return success_response(users)


trending_response = make_response(
    "trending_playlists_response", ns, fields.List(fields.Nested(playlist_model))
)
trending_playlist_parser = trending_parser.copy()
trending_playlist_parser.remove_argument("genre")


@ns.route(
    "/trending",
    defaults={"version": DEFAULT_TRENDING_VERSIONS[TrendingType.PLAYLISTS].name},
    strict_slashes=False,
    doc={
        "get": {
            "id": """Get Trending Playlists""",
            "description": """Gets trending playlists for a time period""",
            "responses": {200: "Success", 400: "Bad request", 500: "Server error"},
        }
    },
)
@ns.route("/trending/<string:version>", doc=False)
class TrendingPlaylists(Resource):
    @record_metrics
    @ns.expect(trending_playlist_parser)
    @ns.marshal_with(trending_response)
    @cache(ttl_sec=TRENDING_TTL_SEC)
    def get(self, version):
        trending_playlist_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.PLAYLISTS
        ).keys()
        version_list = list(
            filter(lambda v: v.name == version, trending_playlist_versions)
        )
        if not version_list:
            abort_bad_path_param("version", ns)

        args = trending_playlist_parser.parse_args()
        time = args.get("time")
        time = "week" if time not in ["week", "month", "year"] else time
        args = {"time": time, "with_tracks": False}
        strategy = trending_strategy_factory.get_strategy(
            TrendingType.PLAYLISTS, version_list[0]
        )
        playlists = get_trending_playlists(args, strategy)
        playlists = playlists[:TRENDING_LIMIT]
        playlists = list(map(extend_playlist, playlists))

        return success_response(playlists)


full_trending_playlists_response = make_full_response(
    "full_trending_playlists_response",
    full_ns,
    fields.List(fields.Nested(full_playlist_model)),
)

full_trending_playlist_parser = full_trending_parser.copy()
full_trending_playlist_parser.remove_argument("genre")


@full_ns.route(
    "/trending",
    defaults={"version": DEFAULT_TRENDING_VERSIONS[TrendingType.PLAYLISTS].name},
    strict_slashes=False,
    doc={
        "get": {
            "id": """Get Trending Playlists""",
            "description": """Returns trending playlists for a time period""",
            "responses": {200: "Success", 400: "Bad request", 500: "Server error"},
        }
    },
)
@full_ns.route(
    "/trending/<string:version>",
    doc={
        "get": {
            "id": """Get Trending Playlists With Version""",
            "description": """Returns trending playlists for a time period based on the given trending version""",
            "params": {"version": "The strategy version of trending to use"},
            "responses": {200: "Success", 400: "Bad request", 500: "Server error"},
        }
    },
)
class FullTrendingPlaylists(Resource):
    @record_metrics
    @full_ns.expect(full_trending_playlist_parser)
    @full_ns.marshal_with(full_trending_playlists_response)
    def get(self, version):
        trending_playlist_versions = trending_strategy_factory.get_versions_for_type(
            TrendingType.PLAYLISTS
        ).keys()
        version_list = list(
            filter(lambda v: v.name == version, trending_playlist_versions)
        )
        if not version_list:
            abort_bad_path_param("version", full_ns)

        args = full_trending_playlist_parser.parse_args()
        strategy = trending_strategy_factory.get_strategy(
            TrendingType.PLAYLISTS, version_list[0]
        )
        playlists = get_full_trending_playlists(request, args, strategy)
        playlists = list(map(extend_playlist, playlists))
        return success_response(playlists)


playlist_stream_bp = Blueprint("playlist_stream", __name__)


@playlist_stream_bp.route("/v1/playlists/<string:playlist_id>/stream", methods=["GET"])
def playlist_stream(playlist_id):
    decoded_id = decode_string_id(playlist_id)
    if decoded_id is None:
        return f"#Invalid Id: {playlist_id}", 404

    tracks = get_tracks_for_playlist(playlist_id=decoded_id, exclude_gated=True)

    return Response(
        response="#EXTM3U\n"
        + "\n".join(
            [
                f"#EXTINF:{track['duration']},{track['title']}\n../../tracks/{track['id']}/stream"
                for track in tracks
            ]
        ),
        status=200,
        mimetype="application/mpegurl",
    )


@ns.route("/unclaimed_id", doc=False)
class GetUnclaimedPlaylistId(Resource):
    @ns.doc(
        id="""Get unclaimed playlist ID""",
        description="""Gets an unclaimed blockchain playlist ID""",
    )
    def get(self):
        unclaimed_id = get_unclaimed_id("playlist")
        return success_response(unclaimed_id)


access_info_response = make_response(
    "access_info_response", ns, fields.Nested(album_access_info)
)

access_info_parser = current_user_parser.copy()
access_info_parser.add_argument(
    "include_network_cut",
    required=False,
    type=inputs.boolean,
    description="Whether to include the staking system as a recipient",
)


@ns.route("/<string:playlist_id>/access-info")
class GetPlaylistAccessInfo(Resource):
    @record_metrics
    @ns.doc(
        id="Get Playlist Access Info",
        description="Gets the information necessary to access the playlist and what access the given user has.",
        params={"playlist_id": "A Playlist ID"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(access_info_response)
    def get(self, playlist_id: str):
        args = access_info_parser.parse_args()
        decoded_id = decode_with_abort(playlist_id, ns)
        current_user_id = get_current_user_id(args)
        playlists = get_playlists(
            {
                "current_user_id": current_user_id,
                "playlist_ids": [decoded_id],
                "with_users": True,  # needed for extend_playlist()
            }
        )
        if not playlists:
            abort_not_found(playlist_id, ns)
        raw = playlists[0]
        stream_conditions = get_extended_purchase_gate(gate=raw["stream_conditions"])
        playlist = extend_playlist(raw)
        playlist["stream_conditions"] = stream_conditions
        return success_response(playlist)
