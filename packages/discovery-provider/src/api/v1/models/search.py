from flask_restx import fields

from .common import ns
from .playlists import search_playlist_full
from .tracks import search_track_full
from .users import user_model_full

search_model = ns.model(
    "search_model",
    {
        "users": fields.List(fields.Nested(user_model_full), required=True),
        "followed_users": fields.List(fields.Nested(user_model_full), required=False),
        "tracks": fields.List(fields.Nested(search_track_full), required=True),
        "saved_tracks": fields.List(fields.Nested(search_track_full), required=False),
        "playlists": fields.List(fields.Nested(search_playlist_full), required=True),
        "saved_playlists": fields.List(
            fields.Nested(search_playlist_full), required=False
        ),
        "albums": fields.List(fields.Nested(search_playlist_full), required=True),
        "saved_albums": fields.List(
            fields.Nested(search_playlist_full), required=False
        ),
    },
)
