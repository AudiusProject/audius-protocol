from flask_restx import fields

from .common import ns

reaction = ns.model(
    "reaction",
    {
        "reaction_value": fields.String(required=True),
        "reaction_type": fields.String(required=True),
        "sender_user_id": fields.String(required=True),
        "reacted_to": fields.String(required=True),
    },
)
