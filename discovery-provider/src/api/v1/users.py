import logging
from .tracks import favorite, track # pylint: disable=C0302
from src.queries.get_saves import get_saves
from src.queries.get_users import get_users
from flask_restx import Resource, Namespace, fields, reqparse, inputs
from src.queries.get_tracks import get_tracks
from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_favorite, extend_track, extend_user, make_response, success_response

logger = logging.getLogger(__name__)

ns = Namespace('users', description='User related operations')

user_model = ns.model('User', {
    "album_count": fields.Integer(required=True),
    "bio": fields.String,
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "cover_photo": fields.String,
    "cover_photo_sizes": fields.String,
    "created_at": fields.String(required=True),
    "creator_node_endpoint": fields.String,
    "current_user_followee_follow_count": fields.Integer(required=True),
    "does_current_user_follow": fields.Boolean(required=True),
    "followee_count": fields.Integer(required=True),
    "follower_count": fields.Integer(required=True),
    "handle": fields.String(required=True),
    "handle_lc": fields.String(required=True),
    "id": fields.String(required=True),
    "is_creator": fields.Boolean(required=True),
    "is_current": fields.Boolean(required=True),
    "is_verified": fields.Boolean(required=True),
    "location": fields.String,
    "metadata_multihash": fields.String(required=True),
    "name": fields.String(required=True),
    "playlist_count": fields.Integer(required=True),
    "profile_picture": fields.String,
    "profile_picture_sizes": fields.String,
    "repost_count": fields.Integer(required=True),
    "track_blocknumber": fields.Integer(required=True),
    "track_count": fields.Integer(required=True),
    "updated_at": fields.String(required=True),
    "wallet": fields.String(required=True)
})

user_response = make_response("user_response", ns, fields.Nested(user_model))

@ns.route("/<string:user_id>")
class User(Resource):
    @ns.marshal_with(user_response)
    def get(self, user_id):
        """Fetch a single user"""
        formatted_id = decode_with_abort(user_id, ns)
        args = {"id": [formatted_id]}
        users = get_users(args)
        if not users:
            abort_not_found(user_id, ns)
        user = extend_user(users[0])
        return success_response(user)

tracks_response = make_response("tracks_response", ns, fields.List(fields.Nested(track)))
@ns.route("/<string:user_id>/tracks")
class TrackList(Resource):
    @ns.marshal_with(tracks_response)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        user_id = decode_with_abort(user_id, ns)
        args = {"user_id": user_id, "with_users": True}
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        if not tracks:
            abort_not_found(user_id, ns)
        return success_response(tracks)

favorites_response = make_response("favorites_response", ns, fields.List(fields.Nested(favorite)))
@ns.route("/<string:user_id>/favorites")
class FavoritedTracks(Resource):
    @ns.marshal_with(favorites_response)
    def get(self, user_id):
        """Fetch favorited tracks for a user."""
        user_id = decode_with_abort(user_id, ns)
        favorites = get_saves("tracks", user_id)
        favorites = list(map(extend_favorite, favorites))
        return success_response(favorites)

search_parser = reqparse.RequestParser()
search_parser.add_argument('query', required=True)
@ns.route("/search")
class SearchResult(Resource):
    @ns.expect(search_parser)
    def get(self):
        args = search_parser.parse_args()
        query = args["query"]
        return query, 200
