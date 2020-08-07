from flask_restx import fields
from .common import ns

route_metric = ns.model('route_metric', {
    "route": fields.String,
    "timestamp": fields.String,
    "count": fields.Integer
})

app_name_metric = ns.model('app_name_metric', {
    "timestamp": fields.String,
    "count": fields.Integer
})

app_name = ns.model('app_name', {
    "name": fields.String
})
