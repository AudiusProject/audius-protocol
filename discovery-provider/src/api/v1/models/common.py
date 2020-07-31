from flask_restx import Namespace, fields

# Make a common namespace for all the models
ns = Namespace("Models")

repost = ns.model('repost', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "repost_item_id": fields.String(required=True),
    "repost_type": fields.String(required=True),
    "user_id": fields.String(required=True)
})

favorite = ns.model('favorite', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "save_item_id":	fields.String(required=True),
    "save_type": fields.String(required=True),
    "user_id": fields.String(required=True)
})

version_metadata = ns.model("version_metadata", {
    "service": fields.String(required=True),
    "version": fields.String(required=True)
})

full_response = ns.model("full_response", {
    "latest_chain_block":	fields.Integer(required=True),
    "latest_indexed_block":	fields.Integer(required=True),
    "owner_wallet":	fields.Integer(required=True),
    "signature": fields.String(required=True),
    "success": fields.Boolean(required=True),
    "timestamp": fields.String(required=True)	,
    "version": fields.Nested(version_metadata, required=True),
})