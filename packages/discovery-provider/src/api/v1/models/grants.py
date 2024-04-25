from flask_restx import fields

from .common import ns

# Describes a grant made from user to another user
grant = ns.model(
    "grant",
    {
        "grantee_address": fields.String(required=True),
        "user_id": fields.String(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=True),
    },
)
