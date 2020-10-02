import logging
from flask_restx import Resource, Namespace, fields, reqparse
from src.api.v1.models.common import favorite
from src.api.v1.models.users import user_model, user_model_full

from src.queries.get_saves import get_saves
from src.queries.get_users import get_users
from src.queries.search_queries import SearchKind, search
from src.queries.get_tracks import get_tracks
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_followers_for_user import get_followers_for_user

from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_favorite, extend_track, \
    extend_user, format_limit, format_offset, make_response, search_parser, success_response, abort_bad_request_param, \
    get_default_max, decode_string_id
from .models.tracks import track, track_full
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics


logger = logging.getLogger(__name__)

ns = Namespace('users', description='User related operations')
full_ns = Namespace('users', description='Full user operations')

user_response = make_response("user_response", ns, fields.Nested(user_model))
full_user_response = make_response(
    "full_user_response", full_ns, fields.List(fields.Nested(user_model_full)))

def get_single_user(user_id, current_user_id):
    args = {
        "id": [user_id],
        "current_user_id": current_user_id
    }
    users = get_users(args)
    if not users:
        abort_not_found(user_id, ns)
    user = extend_user(users[0])
    return success_response(user)


USER_ROUTE = "/<string:user_id>"
@ns.route(USER_ROUTE)
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
        user_id = decode_with_abort(user_id, ns)
        return get_single_user(user_id, None)

full_user_parser = reqparse.RequestParser()
full_user_parser.add_argument('user_id', required=False)
@full_ns.route(USER_ROUTE)
class FullUser(Resource):
    @record_metrics
    @full_ns.marshal_with(full_user_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        user_id = decode_with_abort(user_id, ns)
        args = full_user_parser.parse_args()
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args.get("user_id"))

        return get_single_user(user_id, current_user_id)

full_user_handle_parser = reqparse.RequestParser()
full_user_handle_parser.add_argument('user_id', required=False)
@full_ns.route("/handle/<string:handle>")
class FullUserHandle(Resource):
    @record_metrics
    @full_ns.marshal_with(full_user_response)
    @cache(ttl_sec=5)
    def get(self, handle):
        args = full_user_handle_parser.parse_args()
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args.get("user_id"))

        args = {
            "handle": handle,
            "current_user_id": current_user_id
        }
        users = get_users(args)
        if not users:
            abort_not_found(handle, ns)
        user = extend_user(users[0])
        return success_response(user)

USER_TRACKS_ROUTE = "/<string:user_id>/tracks"
user_tracks_route_parser = reqparse.RequestParser()
user_tracks_route_parser.add_argument('user_id', required=False)
user_tracks_route_parser.add_argument('limit', required=False, type=int)
user_tracks_route_parser.add_argument('offset', required=False, type=int)
user_tracks_route_parser.add_argument(
    'sort', required=False, type=str, default='date', choices=('date', 'plays'))

tracks_response = make_response("tracks_response", ns, fields.List(fields.Nested(track)))
@ns.route(USER_TRACKS_ROUTE)
class TrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Tracks""",
        params={
            'user_id': 'A User ID',
            'limit': 'Limit',
            'offset': 'Offset',
            'sort': 'Sort mode'
        },
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
        args = user_tracks_route_parser.parse_args()

        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args.get("user_id"))

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset
        }
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)

full_tracks_response = make_response("full_tracks", full_ns, fields.List(fields.Nested(track_full)))
@full_ns.route(USER_TRACKS_ROUTE)
class FullTrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Tracks""",
        params={
            'user_id': 'A User ID',
            'limit': 'Limit',
            'offset': 'Offset',
            'sort': 'Sort mode'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(full_tracks_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        args = user_tracks_route_parser.parse_args()

        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args.get("user_id"))

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset
        }
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return tracks


@full_ns.route("/handle/<string:handle>/tracks")
class HandleFullTrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Tracks""",
        params={
            'user_id': 'A User ID',
            'limit': 'Limit',
            'offset': 'Offset',
            'sort': 'Sort mode'
        },
        responses={
            200: 'Success',
            400: 'Bad request',
            500: 'Server error'
        }
    )
    @ns.marshal_with(full_tracks_response)
    @cache(ttl_sec=5)
    def get(self, handle):
        """Fetch a list of tracks for a user."""
        args = user_tracks_route_parser.parse_args()

        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args.get("user_id"))

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "handle": handle,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset
        }
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


followers_route_parser = reqparse.RequestParser()
followers_route_parser.add_argument('user_id', required=False)
followers_route_parser.add_argument('limit', required=False, type=int)
followers_route_parser.add_argument('offset', required=False, type=int)

followers_response = make_response("followers_response", full_ns, fields.List(fields.Nested(user_model_full)))
@full_ns.route("/<string:user_id>/followers")
class FollowerUsers(Resource):
    @record_metrics
    @ns.expect(followers_route_parser)
    @ns.doc(
        id="""All users that follow the provided user""",
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
    @full_ns.marshal_with(followers_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        args = followers_route_parser.parse_args()
        limit = get_default_max(args.get('limit'), 10, 100)
        offset = get_default_max(args.get('offset'), 0)
        
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args["user_id"])
        args = {
            'followee_user_id': decoded_id,
            'current_user_id': current_user_id,
            'limit': limit,
            'offset': offset
        }
        users = get_followers_for_user(args)
        users = list(map(extend_user, users))
        return success_response(users)


following_route_parser = reqparse.RequestParser()
following_route_parser.add_argument('user_id', required=False)
following_route_parser.add_argument('limit', required=False, type=int)
following_route_parser.add_argument('offset', required=False, type=int)
following_response = make_response("following_response", full_ns, fields.List(fields.Nested(user_model_full)))
@full_ns.route("/<string:user_id>/following")
class FollowingUsers(Resource):
    @record_metrics
    @full_ns.expect(following_route_parser)
    @full_ns.doc(
        id="""All users that the provided user follows""",
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
    @full_ns.marshal_with(following_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        args = following_route_parser.parse_args()
        limit = get_default_max(args.get('limit'), 10, 100)
        offset = get_default_max(args.get('offset'), 0)
        
        current_user_id = None
        if args.get("user_id"):
            current_user_id = decode_string_id(args["user_id"])
        args = {
            'follower_user_id': decoded_id,
            'current_user_id': current_user_id,
            'limit': limit,
            'offset': offset
        }
        users = get_followees_for_user(args)
        users = list(map(extend_user, users))
        return success_response(users)
