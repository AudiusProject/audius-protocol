from .common import ns
from flask_restx import fields

attestation = ns.model(
    "attestation",
    {
        "owner_wallet": fields.String(required=True),
        "attestation": fields.String(required=True),
    },
)

undisbursed_challenge = ns.model(
    "undisbursed_challenge",
    {
        "challenge_id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "specifier": fields.String(),
        "amount": fields.String(required=True),
        "completed_blocknumber": fields.Integer(required=True),
    },
)
