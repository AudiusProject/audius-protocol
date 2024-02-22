from flask_restx import fields
from flask_restx.fields import MarshallingError
from flask_restx.marshalling import marshal

from .common import ns
from .playlists import (
    full_playlist_model,
    full_playlist_without_tracks_model,
    playlist_model,
)
from .tracks import track, track_full


class ItemType(fields.Raw):
    def format(self, value):
        if value == "track":
            return "track"
        if value == "playlist":
            return "playlist"
        raise MarshallingError("Unable to marshal as activity type")


class ActivityItem(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track)
            if value.get("playlist_id"):
                return marshal(value, playlist_model)
        except Exception as e:
            raise MarshallingError("Unable to marshal as activity item") from e


class FullActivityItem(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track_full)
            if value.get("playlist_id"):
                return marshal(value, full_playlist_model)
        except Exception as e:
            raise MarshallingError("Unable to marshal as activity item") from e


activity_model = ns.model(
    "activity",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": ItemType,
        "item": ActivityItem,
    },
)

activity_model_full = ns.model(
    "activity_full",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": ItemType,
        "item": FullActivityItem,
    },
)

history_track_activity_model = ns.model(
    "activity",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.FormattedString("track"),
        "item": fields.Nested(track),
    },
)

history_track_activity_model_full = ns.model(
    "activity_full",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.FormattedString("track"),
        "item": fields.Nested(track_full),
    },
)

library_track_activity_model_full = ns.model(
    "track_activity_full",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.FormattedString("track"),
        "item": fields.Nested(track_full),
    },
)

library_collection_activity_model_full = ns.model(
    "collection_activity_full",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.FormattedString("playlist"),
        "item": fields.Nested(full_playlist_without_tracks_model),
    },
)
