from flask_restx import fields
from .common import ns

profile_picture = ns.model("profile_picture", {
    "150x150": fields.String,
    "480x480": fields.String,
    "1000x1000": fields.String
})

cover_photo = ns.model("cover_photo", {
    "640x": fields.String,
    "2000x": fields.String
})

user_model = ns.model("user", {
    "album_count": fields.Integer(required=True),
    "bio": fields.String,
    "cover_photo": fields.Nested(cover_photo, allow_null=True),
    "followee_count": fields.Integer(required=True),
    "follower_count": fields.Integer(required=True),
    "handle": fields.String(required=True),
    "id": fields.String(required=True),
    "is_verified": fields.Boolean(required=True),
    "location": fields.String,
    "name": fields.String(required=True),
    "playlist_count": fields.Integer(required=True),
    "profile_picture": fields.Nested(profile_picture, allow_null=True),
    "repost_count": fields.Integer(required=True),
    "track_count": fields.Integer(required=True),
})

user_model_full = ns.clone("user_full", user_model, {
    "balance": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "wallet": fields.String(required=True),
    "created_at": fields.String(required=True),
    "creator_node_endpoint": fields.String,
    "current_user_followee_follow_count": fields.Integer(required=True),
    "does_current_user_follow": fields.Boolean(required=True),
    "handle_lc": fields.String(required=True),
    "is_creator": fields.Boolean(required=True),
    "updated_at": fields.String(required=True),
    "cover_photo_sizes": fields.String,
    "cover_photo_legacy": fields.String,
    "profile_picture_sizes": fields.String,
    "profile_picture_legacy": fields.String
})
