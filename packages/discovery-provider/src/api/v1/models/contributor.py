from flask_restx import fields

from .common import ns

contributor = ns.model(
    "contributor",
    {"user_id": fields.String(required=True), "amount": fields.Integer(required=True)},
)
