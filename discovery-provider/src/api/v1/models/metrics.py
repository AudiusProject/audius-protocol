from flask_restx import fields

from .common import ns

plays_metric = ns.model(
    "plays_metric",
    {
        "timestamp": fields.String,
        "count": fields.Integer,
    },
)

genre_metric = ns.model("genre", {"name": fields.String, "count": fields.Integer})
