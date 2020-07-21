import logging # pylint: disable=C0302
from flask import Flask, Blueprint
from src.queries.get_users import get_users
# from src.queries.get_users import get_users
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src import api_helpers
from src.api.v1.helpers import abort_not_found, decode_with_abort, extend_track, extend_user, make_response

logger = logging.getLogger(__name__)

ns = Namespace('users', description='User related operations')

# TODO:
# - Move these models into the models folder. There's some import issue preventing that right now.
# - Add user to track model once we've created the user model

track_segment = ns.model('track_segment', {
    "duration": fields.Float(required=True),
    "multihash": fields.String(required=True)
})

repost = ns.model('repost', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "repost_item_id": fields.Integer(required=True),
    "repost_type": fields.String(required=True),
    "user_id": fields.Integer(required=True)
})

favorite = ns.model('favorite', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "save_item_id":	fields.Integer(required=True),
    "save_type": fields.String(required=True),
    "user_id": fields.Integer(required=True)
})

track_element = ns.model('track_element', {
    "parent_track_id": fields.Integer(required=True)
})

remix_parent = ns.model('remix_parent', {
    "tracks": fields.List(fields.Nested(track_element))
})

stem_parent = ns.model('stem_parent', {
    "category": fields.String(required=True),
    "parent_track_id": fields.Integer(required=True)
})

download = ns.model('download_metadata', {
    "cid": fields.String,
    "is_downloadable": fields.Boolean(required=True),
    "required_follow": fields.Boolean(required=True),
})

field_visibility = ns.model('field_visibility', {
    "mood": fields.Boolean,
    "tags": fields.Boolean,
    "genre": fields.Boolean,
    "share": fields.Boolean,
    "play_count": fields.Boolean,
    "remixes": fields.Boolean
})

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

track = ns.model('Track', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "cover_art": fields.String,
    "cover_art_sizes": fields.String,
    "create_date": fields.String,
    "created_at": fields.String,
    "credits_splits": fields.String,
    "description": fields.String,
    "download": fields.Nested(download),
    "field_visibility": fields.Nested(field_visibility),
    "file_type": fields.String,
    "followee_reposts": fields.List(fields.Nested(repost), required=True),
    "followee_saves": fields.List(fields.Nested(favorite), required=True),
    "genre": fields.String,
    "has_current_user_reposted": fields.Boolean(required=True),
    "has_current_user_saved": fields.Boolean(required=True),
    "id": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "is_unlisted": fields.Boolean(required=True),
    "isrc": fields.String,
    "iswc": fields.String,
    "length": fields.Integer,
    "license": fields.String,
    "metadata_multihash": fields.String(required=True),
    "mood": fields.String,
    "release_date": fields.String,
    "remix_of": fields.Nested(remix_parent),
    "repost_count": fields.Integer(required=True),
    "route_id": fields.String(required=True),
    "save_count": fields.Integer(required=True),
    "stem_of": fields.Nested(stem_parent),
    "tags": fields.String,
    "title": fields.String(required=True),
    "track_segments": fields.List(fields.Nested(track_segment)),
    "updated_at": fields.String,
    "user": fields.Nested(user_model, required=True),
    "user_id": fields.String(required=True)
})

tracks_response = make_response("tracks_response", ns, fields.List(fields.Nested(track)))

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
        response = api_helpers.success_response(user, 200, False)
        return response

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
        response = api_helpers.success_response(tracks, 200, False)
        return response
