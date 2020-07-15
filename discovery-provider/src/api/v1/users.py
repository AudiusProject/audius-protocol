import logging # pylint: disable=C0302
from flask import Flask, Blueprint
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src import api_helpers
from src.api.v1.helpers import decode_with_abort, extend_track

logger = logging.getLogger(__name__)

ns = Namespace('users', description='User related operations')

# TODO:
# - Move these models into the models folder. There's some import issue preventing that right now.
# - Add user to track model once we've created the user model

track_segment = ns.model('track_segment', {
    "duration": fields.Float(required=True),
    "multihash": fields.String(required=True)
})

track_repost = ns.model('track_repost', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "repost_item_id": fields.Integer(required=True),
    "repost_type": fields.String(required=True),
    "user_id": fields.Integer(required=True)
})

track_favorite = ns.model('track_favorite', {
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
    "followee_reposts": fields.List(fields.Nested(track_repost), required=True),
    "followee_saves": fields.List(fields.Nested(track_favorite), required=True),
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
    "owner_id": fields.String(required=True),
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
})

version_metadata = ns.model("version_metadata", {
    "service": fields.String(required=True),
    "version": fields.String(required=True)
})

tracks_response = ns.model("tracks_responsek", {
    "data": fields.List(fields.Nested(track), required=True),
    "latest_chain_block":	fields.Integer(required=True),
    "latest_indexed_block":	fields.Integer(required=True),
    "owner_wallet":	fields.Integer(required=True),
    "signature": fields.String(required=True),
    "success": fields.Boolean(required=True),
    "timestamp": fields.String(required=True)	,
    "version": fields.Nested(version_metadata, required=True),
})

@ns.route("/<string:user_id>/tracks")
class TrackList(Resource):
    @ns.marshal_with(tracks_response)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        user_id = decode_with_abort(user_id, ns)
        args = {"user_id": user_id}
        tracks = get_tracks(args)
        tracks = list(map(lambda t: extend_track(t), tracks))
        # Don't convert the success response to JSON
        response = api_helpers.success_response(tracks, 200, False)
        return response
