from .common import ns
from flask_restx import fields

attestation = ns.model(
    "attestation",
    {
        "owner_wallet": fields.String(required=True),
        "attestation": fields.String(required=True),
    },
)
