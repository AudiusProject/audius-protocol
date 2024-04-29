from flask_restx import fields

from .common import ns
from .users import user_model_full

# Describes a grant made from user to another user
grant = ns.model(
    "grant",
    {
        "grantee_address": fields.String(required=True),
        "user_id": fields.String(required=True),
        "is_revoked": fields.Boolean(required=True),
        "is_approved": fields.Boolean(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=True),
    },
)

managed_user = ns.model(
    "managed_user",
    {
        "user": fields.Nested(user_model_full, required=True),
        "grant": fields.Nested(grant, required=True),
    },
)
