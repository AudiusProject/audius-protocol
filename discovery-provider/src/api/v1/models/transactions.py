from flask_restx import fields

from .common import ns


class TransactionType(fields.String):
    def format(self, value: str):
        return value.lower()


class TransactionMethod(fields.String):
    def format(self, value: str):
        return value.lower()


transaction_details = ns.model(
    "transaction_details",
    {
        "transaction_date": fields.String(required=True),
        "transaction_type": TransactionType(required=True, discriminator=True),
        "method": TransactionMethod(required=True),
        "signature": fields.String(required=True),
        "user_bank": fields.String(required=True),
        "change": fields.String(required=True),
        "balance": fields.String(required=True),
        "metadata": fields.Raw(required=True),
    },
)
