from flask_restx import fields

from .common import ns

encrypted_email = ns.model(
    "encrypted_email",
    {
        "id": fields.Integer(required=True),
        "email_address_owner_user_id": fields.Integer(required=True),
        "primary_access_user_id": fields.Integer(required=True),
        "encrypted_email": fields.String(required=True, description="Base64 encoded encrypted email content"),
        "created_at": fields.DateTime(required=True),
        "updated_at": fields.DateTime(required=True),
    },
)

email_encryption_key = ns.model(
    "email_encryption_key",
    {
        "id": fields.Integer(required=True),
        "primary_access_user_id": fields.Integer(required=True),
        "encrypted_key": fields.String(required=True, description="Base64 encoded encryption key"),
        "created_at": fields.DateTime(required=True),
        "updated_at": fields.DateTime(required=True),
    },
)

email_access_key = ns.model(
    "email_access_key",
    {
        "id": fields.Integer(required=True),
        "primary_access_user_id": fields.Integer(required=True),
        "delegated_access_user_id": fields.Integer(required=True),
        "encrypted_key": fields.String(required=True, description="Base64 encoded encryption key"),
        "created_at": fields.DateTime(required=True),
        "updated_at": fields.DateTime(required=True),
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

email_access_keys_response = ns.model(
    "email_access_keys_response",
    {
        "data": fields.List(fields.Nested(email_access_key), required=True),
    },
)
