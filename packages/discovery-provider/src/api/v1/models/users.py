from flask_restx import fields

from .common import StringEnumToLower, ns
from .playlist_library import playlist_library

# DEPRECATED
# See connected_wallets
associated_wallets = ns.model(
    "associated_wallets",
    {
        "wallets": fields.List(fields.String, required=True),
        "sol_wallets": fields.List(fields.String, required=True),
    },
)

encoded_user_id = ns.model(
    "encoded_user_id", {"user_id": fields.String(allow_null=True)}
)

profile_picture = ns.model(
    "profile_picture",
    {"150x150": fields.String, "480x480": fields.String, "1000x1000": fields.String},
)

cover_photo = ns.model("cover_photo", {"640x": fields.String, "2000x": fields.String})

user_model = ns.model(
    "user",
    {
        "album_count": fields.Integer(required=True),
        "artist_pick_track_id": fields.String(allow_null=True),
        "bio": fields.String,
        "cover_photo": fields.Nested(cover_photo, allow_null=True),
        "followee_count": fields.Integer(required=True),
        "follower_count": fields.Integer(required=True),
        "handle": fields.String(required=True),
        "id": fields.String(required=True),
        "is_verified": fields.Boolean(required=True),
        "location": fields.String,
        "name": fields.String(required=True),
        "playlist_count": fields.Integer(required=True),
        "profile_picture": fields.Nested(profile_picture, allow_null=True),
        "repost_count": fields.Integer(required=True),
        "track_count": fields.Integer(required=True),
        "is_deactivated": fields.Boolean(required=True),
        "is_available": fields.Boolean(required=True),
        "erc_wallet": fields.String(required=True),
        "spl_wallet": fields.String(required=True),
        "supporter_count": fields.Integer(required=True),
        "supporting_count": fields.Integer(required=True),
        "total_audio_balance": fields.Integer(required=True),
    },
)

user_model_full = ns.clone(
    "user_full",
    user_model,
    {
        "balance": fields.String(required=True),
        "associated_wallets_balance": fields.String(required=True),
        "total_balance": fields.String(required=True),
        "waudio_balance": fields.String(required=True),
        "associated_sol_wallets_balance": fields.String(required=True),
        "blocknumber": fields.Integer(required=True),
        "wallet": fields.String(required=True),
        "created_at": fields.String(required=True),
        "is_storage_v2": fields.Boolean(required=True),
        "creator_node_endpoint": fields.String,
        "current_user_followee_follow_count": fields.Integer(required=True),
        "does_current_user_follow": fields.Boolean(required=True),
        "does_current_user_subscribe": fields.Boolean(required=True),
        "handle_lc": fields.String(required=True),
        "updated_at": fields.String(required=True),
        "cover_photo_sizes": fields.String,
        "cover_photo_cids": fields.Nested(cover_photo, allow_null=True),
        "cover_photo_legacy": fields.String,
        "profile_picture_sizes": fields.String,
        "profile_picture_cids": fields.Nested(profile_picture, allow_null=True),
        "profile_picture_legacy": fields.String,
        "metadata_multihash": fields.String,
        "has_collectibles": fields.Boolean(required=True),
        "playlist_library": fields.Nested(playlist_library, allow_null=True),
        "allow_ai_attribution": fields.Boolean(required=True),
    },
)

connected_wallets = ns.model(
    "connected_wallets",
    {
        "erc_wallets": fields.List(fields.String, required=True),
        "spl_wallets": fields.List(fields.String, required=True),
    },
)

user_replica_set = ns.model(
    "user_replica_set",
    {
        "user_id": fields.Integer(required=True),
        "wallet": fields.String(required=True),
        "primary": fields.String(required=False),
        "secondary1": fields.String(required=False),
        "secondary2": fields.String(required=False),
        "primarySpID": fields.Integer(required=False),
        "secondary1SpID": fields.Integer(required=False),
        "secondary2SpID": fields.Integer(required=False),
    },
)

challenge_response = ns.model(
    "challenge_response",
    {
        "challenge_id": fields.String(required=True),
        "user_id": fields.String(required=True),
        "specifier": fields.String(),  # Not required for aggregates
        "is_complete": fields.Boolean(required=True),
        "is_active": fields.Boolean(required=True),
        "is_disbursed": fields.Boolean(required=True),
        "current_step_count": fields.Integer(),
        "max_steps": fields.Integer(),
        "challenge_type": fields.String(required=True),
        "amount": fields.String(required=True),
        "disbursed_amount": fields.Integer(required=True),
        "metadata": fields.Raw(required=True),
    },
)

user_token_profile_picture = ns.model(
    "profilePicture",
    {
        "150x150": fields.String(required=False),
        "480x480": fields.String(required=False),
        "1000x1000": fields.String(required=False),
    },
)

tx_signature = ns.model(
    "tx_signature",
    {
        "message": fields.String(required=True),
        "signature": fields.String(required=True),
    },
)

decoded_user_token = ns.model(
    "decoded_user_token",
    {
        "userId": fields.String(required=True),
        "email": fields.String(required=True),
        "name": fields.String(required=True),
        "handle": fields.String(required=True),
        "verified": fields.Boolean(required=True),
        "profilePicture": fields.Nested(
            user_token_profile_picture, allow_null=True, skip_none=True
        ),
        "sub": fields.String(required=True),
        "iat": fields.String(required=True),
        "txSignature": fields.Nested(
            tx_signature, required=False, allow_null=True, skip_none=True
        ),
    },
)

user_subscribers = ns.model(
    "user_subscribers",
    {
        "user_id": fields.String(required=True),
        "subscriber_ids": fields.List(fields.String),
    },
)

purchase = ns.model(
    "purchase",
    {
        "slot": fields.Integer(required=True),
        "signature": fields.String(required=True),
        "seller_user_id": fields.String(required=True),
        "buyer_user_id": fields.String(required=True),
        "amount": fields.String(required=True),
        "extra_amount": fields.String(required=True),
        "content_type": StringEnumToLower(required=True, discriminator=True),
        "content_id": fields.String(required=True),
        "created_at": fields.String(required=True),
        "updated_at": fields.String(required=True),
    },
)
