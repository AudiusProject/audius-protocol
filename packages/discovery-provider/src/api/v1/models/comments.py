from flask_restx import fields

from .common import ns

# Replies have a slightly different comment model, similar to base comments
reply_comment_model = ns.model(
    "reply_comment",
    {
        "id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "message": fields.String(required=True),
        "track_timestamp_s": fields.Integer(required=False),
        "react_count": fields.Integer(required=True),
        "is_edited": fields.Boolean(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=False),
    },
)


# A top level comment, including an array of replies
base_comment_model = ns.model(
    "comment",
    {
        "id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "message": fields.String(required=True),
        "track_timestamp_s": fields.Integer(required=False),
        "react_count": fields.Integer(required=True),
        "reply_count": fields.Integer(required=True),
        "is_pinned": fields.Boolean(required=True),
        "is_edited": fields.Boolean(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=False),
        "replies": fields.List(fields.Nested(reply_comment_model), require=True),
    },
)
