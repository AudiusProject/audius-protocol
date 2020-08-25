import logging # pylint: disable=C0302
from src.api.v1.models.playlists import playlist_model
from src.queries.get_playlists import get_playlists
from flask_restx import Resource, Namespace, fields
from src.queries.get_playlist_tracks import get_playlist_tracks
from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_playlist, extend_track,\
    make_response, success_response, search_parser, abort_bad_request_param
from .models.tracks import track
from src.queries.search_queries import SearchKind, search
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

ns = Namespace('playlists', description='Playlist related operations')

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
