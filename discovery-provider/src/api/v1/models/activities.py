from flask_restx import Namespace, fields
from flask_restx.fields import MarshallingError
from flask_restx.marshalling import marshal
from .common import ns
from .tracks import track, track_full
from .playlists import playlist_model, full_playlist_model

class Item(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track)
            if value.get("playlist_id"):
                return marshal(value, playlist_model)
        except:
            raise MarshallingError("Unable to marshal as activity item")


class FullItem(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track_full)
            if value.get("playlist_id"):
                return marshal(value, full_playlist_model)
        except:
            raise MarshallingError("Unable to marshal as activity item")


activity_model = ns.model("activity", {
    "timestamp": fields.String(allow_null=True),
    "item": Item
})

activity_model_full = ns.model("activity", {
    "timestamp": fields.String(allow_null=True),
    "item": FullItem
})
