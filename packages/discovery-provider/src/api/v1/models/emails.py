from flask_restx import fields

from .common import ns

email = ns.model(
    "email",
    {
        "encrypted_email": fields.String(required=True),
        "user_id": fields.Integer(required=True),
        "decryptor_user_id": fields.Integer(required=True),
    },
)

emails_response = ns.model(
    "emails_response",
    {
        "data": fields.List(fields.Nested(email), required=True),
    },
)
