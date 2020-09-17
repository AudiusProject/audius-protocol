from src.api.v1.helpers import make_response
from flask_restx import fields
from .users import user_model, user_model_full
from .common import favorite, ns, repost

track_artwork = ns.model('track_artwork', {
    "150x150": fields.String,
    "480x480": fields.String,
    "1000x1000": fields.String,
})

track_segment = ns.model('track_segment', {
    "duration": fields.Float(required=True),
    "multihash": fields.String(required=True)
})

track_element = ns.model('track_element', {
    "parent_track_id": fields.String(required=True)
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
    "artwork": fields.Nested(track_artwork, allow_null=True),
    "description": fields.String,
    "genre": fields.String,
    "id": fields.String(required=True),
    "mood": fields.String,
    "release_date": fields.String,
    "remix_of": fields.Nested(remix_parent),
    "repost_count": fields.Integer(required=True),
    "favorite_count": fields.Integer(required=True),
    "tags": fields.String,
    "title": fields.String(required=True),
    "user": fields.Nested(user_model, required=True),
    # Total track duration, rounded to the nearest second
    "duration": fields.Integer(required=True),
    # Whether or not the track is downloadable, see `download`
    # on `track_full` for more details
    "downloadable": fields.Boolean
})

track_full = ns.clone('track_full', track, {
    "create_date": fields.String,
    "created_at": fields.String,
    "credits_splits": fields.String,
    "download": fields.Nested(download),
    "isrc": fields.String,
    "license": fields.String,
    "iswc": fields.String,
    "field_visibility": fields.Nested(field_visibility),
    "followee_reposts": fields.List(fields.Nested(repost), required=True),
    "has_current_user_reposted": fields.Boolean(required=True),
    "is_unlisted": fields.Boolean(required=True),
    "has_current_user_saved": fields.Boolean(required=True),
    "followee_favorites": fields.List(fields.Nested(favorite), required=True),
    "route_id": fields.String(required=True),
    "stem_of": fields.Nested(stem_parent),
    "track_segments": fields.List(fields.Nested(track_segment)),
    "updated_at": fields.String,
    "user_id": fields.String(required=True),
    "user": fields.Nested(user_model_full, required=True)
})
