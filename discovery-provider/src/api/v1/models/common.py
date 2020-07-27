from flask_restx import Namespace, fields

# Make a common namespace for all the models
ns = Namespace("Models")

repost = ns.model('repost', {
    "blockhash": fields.String(required=True),
    "blocknumber": fields.Integer(required=True),
    "created_at": fields.String(required=True),
    "is_current": fields.Boolean(required=True),
    "is_delete": fields.Boolean(required=True),
    "repost_item_id": fields.Integer(required=True),
    "repost_type": fields.String(required=True),
    "user_id": fields.Integer(required=True)
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
