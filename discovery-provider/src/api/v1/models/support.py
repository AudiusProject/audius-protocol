from flask_restx import fields

from .common import ns
from .users import user_model

supporter_response = ns.model(
    "supporter",
    {
        "rank": fields.Integer(required=True),
        "amount": fields.String(required=True),
        "sender": fields.Nested(user_model, required=True),
    },
)


supporting_response = ns.model(
    "supporting",
    {
        "rank": fields.Integer(required=True),
        "amount": fields.String(required=True),
        "receiver": fields.Nested(user_model, required=True),
    },
)
