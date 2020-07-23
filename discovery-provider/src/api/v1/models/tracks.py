from src.api.v1.helpers import make_response
from flask_restx import fields
from .users import user_model
from .common import favorite, ns, repost

track_segment = ns.model('track_segment', {
    "duration": fields.Float(required=True),
    "multihash": fields.String(required=True)
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

