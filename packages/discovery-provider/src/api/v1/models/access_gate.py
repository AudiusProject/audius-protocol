from flask_restx import fields

from .common import ns
from .extensions.models import WildcardModel

tip_gate = ns.model(
    "tip_gate",
    {
        "tip_user_id": fields.Integer(
            required=True,
            description="Must tip the given user ID to unlock",
        )
    },
)
follow_gate = ns.model(
    "follow_gate",
    {
        "follow_user_id": fields.Integer(
            required=True,
            description="Must follow the given user ID to unlock",
        )
    },
)
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
    "nft_gate",
    {
        "nft_collection": fields.Nested(
            nft_collection,
            required=True,
            description="Must hold an NFT of the given collection to unlock",
        )
    },
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
    "purchase_gate",
    {
        "usdc_purchase": fields.Nested(
            usdc_gate,
            required=True,
            description="Must pay the total price and split to the given addresses to unlock",
        )
    },
)

access_gate = ns.model(
    "access_gate",
    {
        "usdc_purchase": fields.Nested(
            usdc_gate,
            required=False,
            description="Must pay the total price and split to the given addresses to unlock",
        ),
        "follow_user_id": fields.Integer(
            required=False,
            description="Must follow the given user ID to unlock",
        ),
        "tip_user_id": fields.Integer(
            required=False,
            description="Must tip the given user ID to unlock",
        ),
        "nft_collection": fields.Nested(
            nft_collection,
            required=False,
            description="Must hold an NFT of the given collection to unlock",
        ),
    },
)
