from flask_restx import fields

from src.api.v1.models.users import user_model

from .common import ns

dashboard_wallet_user = ns.model(
    "dashboard_wallet_user",
    {
        "wallet": fields.String(required=True),
        "user": fields.Nested(user_model, required=True),
    },
)
