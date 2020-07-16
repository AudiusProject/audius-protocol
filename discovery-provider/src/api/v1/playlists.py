import logging # pylint: disable=C0302
from flask import Flask, Blueprint
from flask_restx import Resource, Namespace, fields
from src.queries.get_tracks import get_tracks
from src import api_helpers
from src.api.v1.users import repost, favorite
from src.api.v1.helpers import decode_with_abort, extend_track

logger = logging.getLogger(__name__)

ns = Namespace('playlists', description='User related operations')


playlist_track = ns.model('playlist_track', {
    "time": fields.Integer(required=True),
    "track": fields.Integer(required=True)
})

playlist_contents = ns.model('playlist_contents', {
    "track_ids": fields.List(fields.Nested(playlist_track))
})

playlist = ns.model('playlist', {
    "blockhash":	fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at":	fields.String,
    "description":	fields.String,
    "followee_reposts": fields.List(fields.Nested(repost)),
    "followee_saves": fields.List(fields.Nested(favorite)),
    "has_current_user_reposted": fields.Boolean(required=True),
    "has_current_user_saved	true": fields.Boolean(required=True),
    "is_album": fields.Boolean(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "is_private": fields.Boolean(required=True),
    "playlist_contents": fields.Nested(playlist_contents, required=True),
    "playlist_id": fields.Integer(required=True),
    "playlist_image_multihash": fields.String,
    "playlist_image_sizes_multihash": fields.String,
    "playlist_name": fields.String(required=True),
    "playlist_owner_id": fields.Integer(required=True),
    "repost_count": fields.Integer(required=True),
    "save_count": fields.Integer(required=True),
    "upc": fields.String,
    "updated_at": fields.String
})

@ns.route("/<string:playlist_id>")
class Playlist(Resource):
    @ns.marshal_with(playlist)
    def get(self, playlist_id):
        """Fetch a playlist"""
        return playlist_id
