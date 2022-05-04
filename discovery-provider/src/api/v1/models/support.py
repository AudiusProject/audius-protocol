from flask_restx import fields

from .common import ns
from .users import user_model

support = ns.model(
    "support",
    {
        "rank": fields.Integer(required=True),
        "user": fields.Nested(user_model, required=True),
        "amount": fields.String(required=True),
    },
)
