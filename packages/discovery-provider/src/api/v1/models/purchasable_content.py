from flask_restx import fields
from flask_restx.fields import MarshallingError, marshal

from .common import ns
from .playlists import (
    full_playlist_model,
    full_playlist_without_tracks_model,
    playlist_model,
)
from .tracks import track, track_full


class PurchasableContentItem(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track)
            if value.get("playlist_id"):
                return marshal(value, playlist_model)
        except Exception as e:
            raise MarshallingError(
                "Unable to marshal as purchasable_content item"
            ) from e


class PurchasableContentItemFull(fields.Raw):
    def format(self, value):
        try:
            if value.get("track_id"):
                return marshal(value, track_full)
            if value.get("playlist_id"):
                return marshal(value, full_playlist_model)
        except Exception as e:
            raise MarshallingError(
                "Unable to marshal as purchasable_content item"
            ) from e


purchasable_content_model = ns.model(
    "purchasable_content",
    {
        "content_type": fields.String(enum=["track", "album"], required=True),
        "item": PurchasableContentItem(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_purchasable_content_model = ns.inherit(
    "track_purchasable_content",
    purchasable_content_model,
    {
        "content_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track, required=True),
    },
)

collection_purchasable_content_model = ns.inherit(
    "collection_purchasable_content",
    purchasable_content_model,
    {
        "content_type": fields.String(enum=["album"], required=True),
        "item": fields.Nested(playlist_model, required=True),
    },
)

purchasable_content_full_model = ns.model(
    "purchasable_content_full",
    {
        "content_type": fields.String(enum=["track", "album"], required=True),
        "item": PurchasableContentItemFull(required=True),
        "class": fields.String(required=True, discriminator=True),
    },
)

track_purchasable_content_full_model = ns.inherit(
    "track_purchasable_content_full",
    purchasable_content_full_model,
    {
        "content_type": fields.String(enum=["track"], required=True),
        "item": fields.Nested(track_full, required=True),
    },
)

collection_purchasable_content_full_model = ns.inherit(
    "collection_purchasable_content_full",
    purchasable_content_full_model,
    {
        "content_type": fields.String(enum=["album"], required=True),
        "item": fields.Nested(full_playlist_model, required=True),
    },
)

collection_purchasable_content_full_without_tracks_model = ns.inherit(
    "collection_purchasable_content_full_without_tracks",
    purchasable_content_full_model,
    {
        "content_type": fields.String(enum=["album"], required=True),
        "item": fields.Nested(full_playlist_without_tracks_model, required=True),
    },
)


class TrackPurchasableContent(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class CollectionPurchasableContent(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


purchasable_content_model = fields.Polymorph(
    {
        TrackPurchasableContent: track_purchasable_content_model,
        CollectionPurchasableContent: collection_purchasable_content_model,
    },
)

purchasable_content_full_model = fields.Polymorph(
    {
        TrackPurchasableContent: track_purchasable_content_full_model,
        CollectionPurchasableContent: collection_purchasable_content_full_model,
    },
)


# Only to be used with `Polymorph` to map the returned classes to marshalling models
def make_polymorph_purchasable_content(purchasable_content: dict):
    if purchasable_content.get("content_type") == "track":
        return TrackPurchasableContent(purchasable_content)
    if purchasable_content.get("content_type") == "album":
        return CollectionPurchasableContent(purchasable_content)
    return None
