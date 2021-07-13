from flask_restx import fields
from .common import ns
from .tracks import track_full
from .users import user_model_full
from .playlists import full_playlist_model

search_model = ns.model(
    "search_model",
    {
        "users": fields.List(fields.Nested(user_model_full), required=True),
        "followed_users": fields.List(fields.Nested(user_model_full), required=False),
        "tracks": fields.List(fields.Nested(track_full), required=True),
        "saved_tracks": fields.List(fields.Nested(track_full), required=False),
        "playlists": fields.List(fields.Nested(full_playlist_model), required=True),
        "saved_playlists": fields.List(
            fields.Nested(full_playlist_model), required=False
        ),
        "albums": fields.List(fields.Nested(full_playlist_model), required=True),
        "saved_albums": fields.List(fields.Nested(full_playlist_model), required=False),
    },
)
