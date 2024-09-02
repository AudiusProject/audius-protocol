from flask_restx import fields

from .common import ns
from .extensions.models import OneOfModel
from .playlists import full_playlist_without_tracks_model
from .tracks import track_full

track_feed_item = ns.model(
    "track_feed_item",
    {
        "type": fields.String(required=True),
        "item": fields.Nested(track_full, required=True),
    },
)

playlist_feed_item = ns.model(
    "playlist_feed_item",
    {
        "type": fields.String(required=True),
        "item": fields.Nested(full_playlist_without_tracks_model, required=True),
    },
)

user_feed_item = ns.add_model(
    "user_feed_item",
    OneOfModel(
        "user_feed_item",
        {"track": track_feed_item, "playlist": playlist_feed_item},
        discriminator="type",
    ),
)
