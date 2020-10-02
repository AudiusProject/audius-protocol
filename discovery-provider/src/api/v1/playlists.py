import logging
from src.queries.get_top_playlists import get_top_playlists # pylint: disable=C0302
from src.api.v1.models.playlists import playlist_model
from src.api.v1.models.users import user_model_full
from src.queries.get_playlists import get_playlists
from flask_restx import Resource, Namespace, fields, reqparse
from src.queries.get_playlist_tracks import get_playlist_tracks
from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_playlist, \
    extend_track, make_response, success_response, search_parser, \
    abort_bad_request_param, extend_user, get_default_max, decode_string_id
from .models.tracks import track
from src.queries.search_queries import SearchKind, search
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics
from src.queries.get_reposters_for_playlist import get_reposters_for_playlist
from src.queries.get_savers_for_playlist import get_savers_for_playlist

logger = logging.getLogger(__name__)

ns = Namespace('playlists', description='Playlist related operations')
full_ns = Namespace('playlists', description='Full Playlist operations')

playlists_response = make_response("playlist_response", ns, fields.List(fields.Nested(playlist_model)))

@ns.route("/<string:playlist_id>")
class Playlist(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Playlist""",
        params={'playlist_id': 'A Playlist ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(playlists_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        """Fetch a playlist."""
        playlist_id = decode_with_abort(playlist_id, ns)
        args = {"playlist_id": [playlist_id], "with_users": True}
        playlists = get_playlists(args)
        playlists = list(map(extend_playlist, playlists))
        response = success_response(playlists)
        return response

playlist_tracks_response = make_response("playlist_tracks_response", ns, fields.List(fields.Nested(track)))

@ns.route("/<string:playlist_id>/tracks")
class PlaylistTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Playlist Tracks""",
        params={'playlist_id': 'A Playlist ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(playlist_tracks_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        """Fetch tracks within a playlist."""
        decoded_id = decode_with_abort(playlist_id, ns)
        args = {"playlist_id": decoded_id, "with_users": True}
        playlist_tracks = get_playlist_tracks(args)
        if not playlist_tracks:
            abort_not_found(playlist_id, ns)
        tracks = list(map(extend_track, playlist_tracks))
        return success_response(tracks)

playlist_search_result = make_response("playlist_search_result", ns, fields.List(fields.Nested(playlist_model)))

@ns.route("/search")
class PlaylistSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Playlists""",
        params={'query': 'Search Query'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(playlist_search_result)
    @ns.expect(search_parser)
    @cache(ttl_sec=5)
    def get(self):
        """Search for a playlist."""
        args = search_parser.parse_args()
        query = args["query"]
        if not query:
            abort_bad_request_param('query', ns)
        search_args = {
            "query": query,
            "kind": SearchKind.playlists.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True,
            "limit": 10,
            "offset": 0
        }
        response = search(search_args)
        playlists = list(map(extend_playlist, response["playlists"]))
        return success_response(playlists)

top_parser = reqparse.RequestParser()
top_parser.add_argument('type', required=True)
top_parser.add_argument('limit', required=False, type=int)
top_parser.add_argument('offset', required=False, type=int)

@ns.route("/top", doc=False)
class Top(Resource):
    @record_metrics
    @ns.doc(
        id="""Top Playlists""",
        params={
            'type': 'album or playlist',
            'limit': 'limit',
            'offset': 'offset'
        }
    )
    @ns.marshal_with(playlists_response)
    @cache(ttl_sec=30 * 60)
    def get(self):
        """Gets top playlists."""
        args = top_parser.parse_args()
        if args.get('limit') is None:
            args['limit'] = 100
        else:
            args['limit'] = min(args.get('limit'), 100)
        if args.get('offset') is None:
            args['offset'] = 0
        if args.get('type') not in ['album', 'playlist']:
            abort_bad_request_param('type', ns)

        args['with_users'] = True

        logger.warning(args)
        response = get_top_playlists(args.type, args)

        playlists = list(map(extend_playlist, response))
        return success_response(playlists)

playlist_favorites_route_parser = reqparse.RequestParser()
playlist_favorites_route_parser.add_argument('user_id', required=False)
playlist_favorites_route_parser.add_argument('limit', required=False, type=int)
playlist_favorites_route_parser.add_argument('offset', required=False, type=int)
playlist_favorites_response = make_response("following_response", full_ns, fields.List(fields.Nested(user_model_full)))
@full_ns.route("/<string:playlist_id>/favorites")
class FullTrackFavorites(Resource):
    @full_ns.expect(playlist_favorites_route_parser)
    @full_ns.doc(
        id="""Get Users that Favorited a Playlist""",
        params={
            'user_id': 'A User ID',
            'limit': 'Limit',
            'offset': 'Offset'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @full_ns.marshal_with(playlist_favorites_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        args = playlist_favorites_route_parser.parse_args()
        decoded_id = decode_with_abort(playlist_id, full_ns)
        limit = get_default_max(args.get('limit'), 10, 100)
        offset = get_default_max(args.get('offset'), 0)
        
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args["user_id"])
        args = {
            'save_playlist_id': decoded_id,
            'current_user_id': current_user_id,
            'limit': limit,
            'offset': offset
        }
        users = get_savers_for_playlist(args)
        users = list(map(extend_user, users))

        return success_response(users)

playlist_reposts_route_parser = reqparse.RequestParser()
playlist_reposts_route_parser.add_argument('user_id', required=False)
playlist_reposts_route_parser.add_argument('limit', required=False, type=int)
playlist_reposts_route_parser.add_argument('offset', required=False, type=int)
playlist_reposts_response = make_response("following_response", full_ns, fields.List(fields.Nested(user_model_full)))
@full_ns.route("/<string:playlist_id>/reposts")
class FullTrackReposts(Resource):
    @full_ns.expect(playlist_reposts_route_parser)
    @full_ns.doc(
        id="""Get Users that Reposted a Playlist""",
        params={
            'user_id': 'A User ID',
            'limit': 'Limit',
            'offset': 'Offset'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @full_ns.marshal_with(playlist_reposts_response)
    @cache(ttl_sec=5)
    def get(self, playlist_id):
        args = playlist_reposts_route_parser.parse_args()
        decoded_id = decode_with_abort(playlist_id, full_ns)
        limit = get_default_max(args.get('limit'), 10, 100)
        offset = get_default_max(args.get('offset'), 0)
        
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args["user_id"])
        args = {
            'repost_playlist_id': decoded_id,
            'current_user_id': current_user_id,
            'limit': limit,
            'offset': offset
        }
        users = get_reposters_for_playlist(args)
        users = list(map(extend_user, users))
        return success_response(users)
