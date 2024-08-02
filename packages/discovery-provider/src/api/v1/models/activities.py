from flask_restx import fields
from flask_restx.fields import MarshallingError, marshal

from .common import ns
from .playlists import (
    full_playlist_model,
    full_playlist_without_tracks_model,
    playlist_model,
)
from .tracks import track, track_full


class ActivityItem(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track)
            if value.get("playlist_id"):
                return marshal(value, playlist_model)
        except Exception as e:
            raise MarshallingError("Unable to marshal as activity item") from e


class ActivityItemFull(fields.Raw):
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
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "item": ActivityItem(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_activity_model = ns.inherit(
    "track_activity",
    activity_model,
    {
        "item_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track, required=True),
    },
)

collection_activity_model = ns.inherit(
    "collection_activity",
    activity_model,
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.String(enum=["playlist"], required=True),
        "item": fields.Nested(playlist_model, required=True),
    },
)

activity_full_model = ns.model(
    "activity_full",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "item": ActivityItemFull(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_activity_full_model = ns.inherit(
    "track_activity_full",
    activity_full_model,
    {
        "item_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track_full, required=True),
    },
)

collection_activity_full_model = ns.inherit(
    "collection_activity_full",
    activity_full_model,
    {
        "item_type": fields.String(enum=["playlist"], required=True),
        "item": fields.Nested(full_playlist_model, required=True),
    },
)

collection_activity_full_without_tracks_model = ns.inherit(
    "collection_activity_full_without_tracks",
    activity_full_model,
    {
        "item_type": fields.String(enum=["playlist"], required=True),
        "item": fields.Nested(full_playlist_without_tracks_model, required=True),
    },
)


class TrackActivity(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class CollectionActivity(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


activity_model = fields.Polymorph(
    {
        TrackActivity: track_activity_model,
        CollectionActivity: collection_activity_model,
    },
)

activity_full_model = fields.Polymorph(
    {
        TrackActivity: track_activity_full_model,
        CollectionActivity: collection_activity_full_model,
    },
)


# Only to be used with `Polymorph` to map the returned classes to marshalling models
def make_polymorph_activity(activity: dict):
    if activity.get("item_type") == "track":
        return TrackActivity(activity)
    if activity.get("item_type") == "playlist":
        return CollectionActivity(activity)
    return None
