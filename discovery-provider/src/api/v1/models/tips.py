from flask_restx import fields

from .common import ns
from .users import user_model, user_model_full

tip_model = ns.model(
    "tip",
    {
        "amount": fields.String(required=True),
        "sender": fields.Nested(user_model),
        "receiver": fields.Nested(user_model),
        "created_at": fields.String(required=True),
    },
)

supporter_reference = ns.model(
    "supporter_reference", {"user_id": fields.String(required=True)}
)

tip_model_full = ns.clone(
    "full_tip",
    tip_model,
    {
        "sender": fields.Nested(user_model_full, required=True),
        "receiver": fields.Nested(user_model_full, required=True),
        "slot": fields.Integer(required=True),
        "followee_supporters": fields.List(
            fields.Nested(supporter_reference), required=True
        ),
        "tx_signature": fields.String(required=True),
    },
)
