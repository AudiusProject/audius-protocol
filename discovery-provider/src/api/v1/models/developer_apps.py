from flask_restx import fields

from .common import ns

developer_app = ns.model(
    "developer_app",
    {
        "address": fields.String(required=True),
        "user_id": fields.String(required=True),
        "name": fields.String(required=True),
        "description": fields.String(required=False),
    },
)

# Describes a grant made from user to developer app
authorized_app = ns.model(
    "authorized_app",
    {
        "address": fields.String(required=True),
        "name": fields.String(required=True),
        "description": fields.String(required=False),
        "grantor_user_id": fields.String(required=True),
        "grant_created_at": fields.String(required=True),
        "grant_updated_at": fields.String(required=True),
    },
)
