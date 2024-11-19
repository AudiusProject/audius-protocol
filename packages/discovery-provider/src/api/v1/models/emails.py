from flask_restx import fields

from .common import ns

encrypted_email = ns.model(
    "encrypted_email",
    {
        "email_id": fields.Integer(required=True),
        "seller_user_id": fields.Integer(required=True),
        "encrypted_email": fields.String(required=True, description="Base64 encoded encrypted email content"),
    },
)

email_encryption_key = ns.model(
    "email_encryption_key",
    {
        "key_id": fields.Integer(required=True),
        "seller_user_id": fields.Integer(required=True),
        "owner_key": fields.String(required=True, description="Base64 encoded encryption key owned by the seller"),
    },
)

email_grantee_key = ns.model(
    "email_grantee_key",
    {
        "grantee_key_id": fields.Integer(required=True),
        "seller_user_id": fields.Integer(required=True),
        "grantee_user_id": fields.Integer(required=True),
        "encrypted_key": fields.String(required=True, description="Base64 encoded encryption key encrypted for the grantee"),
    },
)

# Response models for list endpoints
encrypted_emails_response = ns.model(
    "encrypted_emails_response",
    {
        "data": fields.List(fields.Nested(encrypted_email), required=True),
    },
)

email_encryption_keys_response = ns.model(
    "email_encryption_keys_response",
    {
        "data": fields.List(fields.Nested(email_encryption_key), required=True),
    },
)

email_grantee_keys_response = ns.model(
    "email_grantee_keys_response",
    {
        "data": fields.List(fields.Nested(email_grantee_key), required=True),
    },
)
