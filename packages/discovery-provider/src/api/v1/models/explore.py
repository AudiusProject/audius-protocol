from flask_restx import fields

from .common import ns

best_selling_item_model = ns.model(
    "best_selling_item",
    {
        "content_id": fields.String(required=True),
        "content_type": fields.String(enum=["track", "album"]),
        "title": fields.String(required=True),
        "owner_id": fields.String(required=True),
    },
)
