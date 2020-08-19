import logging
from src.api.v1.models.common import favorite
from src.api.v1.models.users import user_model
from src.queries.get_saves import get_saves
from src.queries.get_users import get_users
from src.queries.search_queries import SearchKind, search
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_favorite, extend_track, \
     extend_user, make_response, search_parser, success_response, abort_bad_request_param
from .models.tracks import track
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics


logger = logging.getLogger(__name__)

ns = Namespace('users', description='User related operations')

user_response = make_response("user_response", ns, fields.Nested(user_model))
@ns.route("/<string:user_id>")
class User(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User""",
        params={'user_id': 'A User ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(user_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a single user."""
        decoded_id = decode_with_abort(user_id, ns)
        args = {"id": [decoded_id]}
        users = get_users(args)
        if not users:
            abort_not_found(user_id, ns)
        user = extend_user(users[0])
        return success_response(user)

tracks_response = make_response("tracks_response", ns, fields.List(fields.Nested(track)))
@ns.route("/<string:user_id>/tracks")
class TrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Tracks""",
        params={'user_id': 'A User ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(tracks_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        args = {"user_id": decoded_id, "with_users": True, "filter_deleted": True}
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)

favorites_response = make_response("favorites_response", ns, fields.List(fields.Nested(favorite)))
@ns.route("/<string:user_id>/favorites")
class FavoritedTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Favorite Tracks""",
        params={'user_id': 'A User ID'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(favorites_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch favorited tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        favorites = get_saves("tracks", decoded_id)
        favorites = list(map(extend_favorite, favorites))
        return success_response(favorites)

user_search_result = make_response("user_search", ns, fields.List(fields.Nested(user_model)))

@ns.route("/search")
class UserSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Users""",
        params={'query': 'Search query'},
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(user_search_result)
    @ns.expect(search_parser)
    def get(self):
        """Seach for a user."""
        args = search_parser.parse_args()
        query = args["query"]
        if not query:
            abort_bad_request_param('query', ns)
        search_args = {
            "query": query,
            "kind": SearchKind.users.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True,
            "limit": 10,
            "offset": 0,
        }
        response = search(search_args)
        users = response["users"]
        users = list(map(extend_user, users))
        return success_response(users)
