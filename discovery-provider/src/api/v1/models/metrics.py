from flask_restx import fields
from .common import ns

route_metric = ns.model(
    "route_metric",
    {
        "timestamp": fields.String,
        "count": fields.Integer,
        "unique_count": fields.Integer,
    },
)

route_trailing_metric = ns.model(
    "route_trailing_metric", {"count": fields.Integer, "unique_count": fields.Integer}
)

app_name_metric = ns.model(
    "app_name_metric",
    {
        "timestamp": fields.String,
        "count": fields.Integer,
        "unique_count": fields.Integer,
    },
)

app_name_trailing_metric = ns.model(
    "app_name_trailing_metric", {"count": fields.Integer, "name": fields.String}
)

app_name = ns.model(
    "app_name",
    {
        "name": fields.String,
        "count": fields.Integer,
        "unique_count": fields.Integer,
    },
)

plays_metric = ns.model(
    "plays_metric",
    {
        "timestamp": fields.String,
        "count": fields.Integer,
    },
)

genre_metric = ns.model("genre", {"name": fields.String, "count": fields.Integer})
