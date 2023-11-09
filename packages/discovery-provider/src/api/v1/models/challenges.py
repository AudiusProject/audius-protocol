from flask_restx import fields

from .common import ns

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
        "specifier": fields.String(required=True),
        "amount": fields.String(required=True),
        "completed_blocknumber": fields.Integer(required=True),
        "handle": fields.String(required=True),
        "wallet": fields.String(required=True),
        "created_at": fields.String(required=True),
        "cooldown_days": fields.Integer(required=False),
    },
)

create_sender_attestation = ns.model(
    "create_sender_attestation",
    {
        "owner_wallet": fields.String(required=True),
        "attestation": fields.String(required=True),
    },
)

challenge_info = ns.model(
    "challenge_info",
    {
        "challenge_id": fields.String(required=True),
        "type": fields.String(required=True),
        "amount": fields.String(required=True),
        "active": fields.Boolean(required=True),
        "step_count": fields.Integer(required=True),
        "starting_block": fields.Integer(required=False),
        "weekly_pool": fields.String(required=False),
        "weekly_pool_remaining": fields.String(required=False),
        "cooldown_days": fields.Integer(required=False),
    },
)
