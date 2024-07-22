from flask_restx import fields

from .common import ns
from .playlists import (
    full_playlist_model,
    full_playlist_without_tracks_model,
    playlist_model,
)
from .tracks import track, track_full

base_activity_model = ns.model(
    "activity",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "item": fields.Raw(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_activity_model = ns.inherit(
    "track_activity",
    base_activity_model,
    {
        "item": fields.Nested(track, required=True),
    },
)

collection_activity_model = ns.inherit(
    "collection_activity",
    base_activity_model,
    {
        "item": fields.Nested(playlist_model, required=True),
    },
)

base_activity_full_model = ns.model(
    "activity_full",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "item": fields.Raw(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_activity_full_model = ns.inherit(
    "track_activity_full",
    base_activity_full_model,
    {
        "item": fields.Nested(track_full, required=True),
    },
)

collection_activity_full_model = ns.inherit(
    "collection_activity_full",
    base_activity_full_model,
    {
        "item": fields.Nested(full_playlist_model, required=True),
    },
)

collection_activity_full_without_tracks_model = ns.model(
    "collection_activity_full_without_tracks",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["playlist"], required=True),
        "item": fields.Nested(full_playlist_without_tracks_model, required=True),
    },
)


class TrackActivity(object):
    def __init__(self, timestamp, item):
        self.timestamp = timestamp
        self.item = item
        self.item_type = "track"


class CollectionActivity(object):
    def __init__(self, timestamp, item):
        self.timestamp = timestamp
        self.item = item
        self.item_type = "collection"


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
