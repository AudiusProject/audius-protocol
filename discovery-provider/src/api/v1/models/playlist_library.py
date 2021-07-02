from flask_restx import fields
from flask_restx.fields import MarshallingError
from flask_restx.marshalling import marshal
from .common import ns

playlist_identifier = ns.model(
    "playlist_identifier",
    {
        "type": fields.FormattedString("playlist"),
        "playlist_id": fields.Integer(required=True),
    },
)

explore_playlist_identifier = ns.model(
    "explore_playlist_identifier",
    {
        "type": fields.FormattedString("explore_playlist"),
        "playlist_id": fields.String(required=True),
    },
)


class PlaylistLibraryIdentifier(fields.Raw):
    def format(self, value):
        try:
            if value.get("type") == "playlist":
                return marshal(value, playlist_identifier)
            if value.get("type") == "explore_playlist":
                return marshal(value, explore_playlist_identifier)
            if value.get("type") == "folder":
                return marshal(value, playlist_library_folder)
        except Exception as e:
            raise MarshallingError(
                f"Unable to marshal as playlist library identifier: {e}"
            )

    def output(self, key, obj, **kwargs):
        return self.format(obj)


playlist_library_folder = ns.model(
    "playlist_library_folder",
    {
        "type": "folder",
        "name": fields.String(required=True),
        "contents": fields.List(PlaylistLibraryIdentifier),
    },
)

playlist_library = ns.model(
    "playlist_library", {"contents": fields.List(PlaylistLibraryIdentifier)}
)
