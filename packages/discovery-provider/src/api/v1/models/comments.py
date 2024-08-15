from flask_restx import fields

from .common import ns

# TODO: Model Replies
reply_comment_model = ns.model(
    "reply_comment",
    {
        "id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "message": fields.String(required=True),
        "track_timestamp_s": fields.Integer(required=False),
        "react_count": fields.Integer(required=True),
        "is_pinned": fields.Boolean(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=False),
    },
)
base_comment_model = ns.model(
    "comment",
    {
        "id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "message": fields.String(required=True),
        "track_timestamp_s": fields.Integer(required=False),
        "react_count": fields.Integer(required=True),
        "is_pinned": fields.Boolean(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=False),
        "replies": fields.List(fields.Nested(reply_comment_model), require=True),
    },
)
