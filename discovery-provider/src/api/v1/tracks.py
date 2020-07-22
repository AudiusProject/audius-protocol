import logging # pylint: disable=C0302
from src.queries.get_saves import get_saves
from src.queries.get_users import get_users
from flask_restx import Resource, Namespace, fields, reqparse, inputs
from src.queries.get_tracks import get_tracks
from src import api_helpers
from src.api.v1.helpers import abort_not_found, decode_with_abort, encode_int_id, extend_favorite, extend_track, extend_user, make_response, success_response
from .users import user_model

logger = logging.getLogger(__name__)

ns = Namespace('tracks', description='User related operations')

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
    "save_item_id":	fields.String(required=True),
    "save_type": fields.String(required=True),
    "user_id": fields.String(required=True)
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

track_response = make_response("track_respones", ns, track)

@ns.route('/<string:track_id>')
class Track(Resource):
    @ns.marshal_with(track_response)
    def get(self, track_id):
        """Fetch a track"""
        encoded_id = decode_with_abort(track_id, ns)
        args = {"id": encoded_id}
        tracks = get_tracks(args)
        if not tracks:
            abort_not_found(encoded_id, ns)
        single_track = extend_track(tracks[0])
        return success_response(single_track)
