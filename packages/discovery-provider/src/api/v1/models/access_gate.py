from flask_restx import fields

from .common import ns
from .extensions.models import OneOfModel, WildcardModel

tip_gate = ns.model("tip_gate", {"tip_user_id": fields.Integer(required=True)})
follow_gate = ns.model("follow_gate", {"follow_user_id": fields.Integer(required=True)})
nft_collection = ns.model(
    "nft_collection",
    {
        "chain": fields.String(enum=["eth", "sol"], required=True),
        "address": fields.String(required=True),
        "name": fields.String(required=True),
        "imageUrl": fields.String(),
        "externalLink": fields.String(),
    },
)
nft_gate = ns.model(
    "nft_gate", {"nft_collection": fields.Nested(nft_collection, required=True)}
)

wild_card_split = WildcardModel(
    "wild_card_split", {"*": fields.Wildcard(fields.Integer)}
)
ns.add_model("wild_card_split", wild_card_split)

usdc_gate = ns.model(
    "usdc_gate",
    {
        "splits": fields.Nested(wild_card_split, required=True),
        "price": fields.Integer(required=True),
    },
)
purchase_gate = ns.model(
    "purchase_gate", {"usdc_purchase": fields.Nested(usdc_gate, required=True)}
)

access_gate = ns.add_model(
    "access_gate",
    OneOfModel(
        "access_gate",
        [
            fields.Nested(tip_gate),
            fields.Nested(follow_gate),
            fields.Nested(purchase_gate),
            fields.Nested(nft_gate),
        ],
    ),
)
