from src.api.v1.helpers import make_response
from flask_restx import fields
from .common import ns

user_model = ns.model("user", {
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
