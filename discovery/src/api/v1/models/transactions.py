from flask_restx import fields

from .common import StringEnumToLower, ns

transaction_details = ns.model(
    "transaction_details",
    {
        "transaction_date": fields.String(required=True),
        "transaction_type": StringEnumToLower(required=True, discriminator=True),
        "method": StringEnumToLower(required=True),
        "signature": fields.String(required=True),
        "user_bank": fields.String(required=True),
        "change": fields.String(required=True),
        "balance": fields.String(required=True),
        "metadata": fields.Raw(required=True),
    },
)
