from flask_restx import fields

from .common import ns
from .extensions.models import OneOfModel, WildcardModel

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

payment_split = ns.model(
    "payment_split",
    {
        "user_id": fields.Integer(required=True),
        "percentage": fields.Float(required=True),
    },
)

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


crowdfund = ns.model(
    "crowdfund",
    {"campaign": fields.String(required=True), "escrow": fields.String(required=True)},
)
crowdfund_gate = ns.model(
    "crowdfund_gate",
    {"crowdfund": fields.Nested(crowdfund, required=True)},
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
            fields.Nested(crowdfund_gate),
        ],
    ),
)


extended_payment_split = ns.clone(
    "extended_payment_split",
    payment_split,
    {
        "eth_wallet": fields.String(required=True),
        "payout_wallet": fields.String(required=True),
        "amount": fields.Integer(required=True),
    },
)


extended_usdc_gate = ns.model(
    "extended_usdc_gate",
    {
        "price": fields.Integer(required=True),
        "splits": fields.List(fields.Nested(extended_payment_split), required=True),
    },
)

extended_purchase_gate = ns.model(
    "extended_purchase_gate",
    {
        "usdc_purchase": fields.Nested(
            extended_usdc_gate,
            required=True,
            description="Must pay the total price and split to the given addresses to unlock",
        )
    },
)

extended_access_gate = ns.add_model(
    "extended_access_gate",
    OneOfModel(
        "extended_access_gate",
        [
            fields.Nested(tip_gate),
            fields.Nested(follow_gate),
            fields.Nested(extended_purchase_gate),
            fields.Nested(nft_gate),
        ],
    ),
)
