from flask_restx import Namespace, fields

# Make a common namespace for all the models
ns = Namespace("Models")

repost = ns.model(
    "repost",
    {
        "repost_item_id": fields.String(required=True),
        "repost_type": fields.String(required=True),
        "user_id": fields.String(required=True),
    },
)

favorite = ns.model(
    "favorite",
    {
        "favorite_item_id": fields.String(required=True),
        "favorite_type": fields.String(required=True),
        "user_id": fields.String(required=True),
        "created_at": fields.String(required=True),
    },
)

version_metadata = ns.model(
    "version_metadata",
    {"service": fields.String(required=True), "version": fields.String(required=True)},
)

full_response = ns.model(
    "full_response",
    {
        "latest_chain_block": fields.Integer(required=True),
        "latest_indexed_block": fields.Integer(required=True),
        "latest_chain_slot_plays": fields.Integer(required=True),
        "latest_indexed_slot_plays": fields.Integer(required=True),
        "signature": fields.String(required=True),
        "timestamp": fields.String(required=True),
        "version": fields.Nested(version_metadata, required=True),
    },
)


# This mapper ensures that we output a lowercase version of the _member name_ of
# a Enum. The default `fields.String` marshaller wraps enums with str(),
# which will cause it to output Enum.member ('PurchaseType.track' instead of
# just 'track').
class StringEnumToLower(fields.String):
    def format(self, value: str):
        return value.lower()
