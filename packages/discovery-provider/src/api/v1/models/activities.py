from flask_restx import fields

from .common import ns
from .playlists import (
    full_playlist_model,
    full_playlist_without_tracks_model,
    playlist_model,
)
from .tracks import track, track_full

# Generic activity models used with favorites / library
track_activity_model = ns.model(
    "track_activity",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track, required=True),
    },
)

track_activity_full_model = ns.model(
    "track_activity_full",
    {
        "timestamp": fields.String(allow_null=True),
        "item_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track_full, required=True),
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


# Repost-specific models, used when the item can be either type
base_repost_activity_model = ns.model(
    "repost_activity",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_repost_activity_model = ns.inherit(
    "track_repost_activity",
    base_repost_activity_model,
    {
        "item": fields.Nested(track, required=True),
    },
)

collection_repost_activity_model = ns.inherit(
    "collection_repost_activity",
    base_repost_activity_model,
    {
        "item": fields.Nested(playlist_model, required=True),
    },
)

base_repost_activity_full_model = ns.model(
    "repost_activity_full",
    {
        "timestamp": fields.String(required=True),
        "item_type": fields.String(enum=["track", "playlist"], required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_repost_activity_full_model = ns.inherit(
    "track_repost_activity_full",
    base_repost_activity_full_model,
    {
        "item": fields.Nested(track_full, required=True),
    },
)

collection_repost_activity_full_model = ns.inherit(
    "collection_repost_activity_full",
    base_repost_activity_full_model,
    {
        "item": fields.Nested(full_playlist_model, required=True),
    },
)


class TrackRepostActivity(dict):
    def __init__(self, timestamp, item):
        dict.__init__(self, timestamp=timestamp, item=item, item_type="track")


class CollectionRepostActivity(dict):
    def __init__(self, timestamp, item):
        dict.__init__(self, timestamp=timestamp, item=item, item_type="playlist")


repost_activity_model = fields.Polymorph(
    {
        TrackRepostActivity: track_repost_activity_model,
        CollectionRepostActivity: collection_repost_activity_model,
    },
)

repost_activity_full_model = fields.Polymorph(
    {
        TrackRepostActivity: track_repost_activity_full_model,
        CollectionRepostActivity: collection_repost_activity_full_model,
    },
)
