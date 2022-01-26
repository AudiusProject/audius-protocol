from flask_restx import fields

from .common import favorite, ns
from .playlists import playlist_model
from .tracks import track

favorite_track = ns.inherit(
    "favorite_track", favorite, {"favorite_item": fields.Nested(track)}
)
favorite_playlist = ns.inherit(
    "favorite_playlist",
    favorite,
    {"favorite_item": fields.Nested(playlist_model)},
)
