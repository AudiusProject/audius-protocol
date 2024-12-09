import asyncio
import logging
import re
from datetime import datetime
from typing import Dict, Union, cast

import requests
from flask_restx import inputs, reqparse

from src import api_helpers
from src.api.v1.models.common import full_response
from src.models.rewards.challenge import ChallengeType
from src.queries.get_challenges import ChallengeResponse
from src.queries.get_extended_purchase_gate import get_legacy_purchase_gate
from src.queries.get_notifications import (
    NotificationType,
    default_valid_notification_types,
)
from src.queries.get_support_for_user import SupportResponse
from src.queries.get_undisbursed_challenges import UndisbursedChallengeResponse
from src.queries.query_helpers import (
    CollectionLibrarySortMethod,
    LibraryFilterType,
    SearchSortMethod,
    SortDirection,
    SortMethod,
)
from src.queries.reactions import ReactionResponse
from src.utils.get_all_nodes import get_all_healthy_content_nodes_cached
from src.utils.helpers import decode_string_id, encode_int_id
from src.utils.redis_connection import get_redis
from src.utils.rendezvous import RendezvousHash
from src.utils.spl_audio import to_wei_string

redis = get_redis()
logger = logging.getLogger(__name__)


PROFILE_PICTURE_SIZES = ["150x150", "480x480", "1000x1000"]
PROFILE_COVER_PHOTO_SIZES = ["640x", "2000x"]
COVER_ART_SIZES = ["150x150", "480x480", "1000x1000"]


def camel_to_snake(name):
    """Convert CamelCase to snake_case"""
    name = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", name).lower()


def make_image(endpoint, cid, width="", height=""):
    return f"{endpoint}/content/{cid}/{width}x{height}.jpg"


def init_rendezvous(user, cid):
    if not cid:
        return ""
    healthy_nodes = get_all_healthy_content_nodes_cached(redis)
    if not healthy_nodes:
        logger.error(
            f"No healthy Content Nodes found for fetching cid for {user.user_id}: {cid}"
        )
        return ""

    return RendezvousHash(
        *[re.sub("/$", "", node["endpoint"].lower()) for node in healthy_nodes]
    )


def get_n_primary_endpoints(user, cid, n):
    rendezvous = init_rendezvous(user, cid)
    if not rendezvous:
        return ""
    return rendezvous.get_n(n, cid)


def get_playlist_added_timestamps(playlist):
    if "playlist_contents" not in playlist:
        return []
    added_timestamps = []
    for track in playlist["playlist_contents"]["track_ids"]:
        added_timestamps.append(
            {
                "track_id": encode_int_id(track["track"]),
                "timestamp": track["time"],
                "metadata_timestamp": track.get("metadata_time"),
            }
        )
    return added_timestamps


# Helpers


async def fetch_url(url):
    loop = asyncio.get_event_loop()
    future = loop.run_in_executor(None, requests.get, url)
    response = await future
    return response


def extend_search(resp):
    if "users" in resp:
        resp["users"] = list(map(extend_user, resp["users"]))
    if "followed_users" in resp:
        resp["followed_users"] = list(map(extend_user, resp["followed_users"]))
    if "tracks" in resp:
        resp["tracks"] = list(map(extend_track, resp["tracks"]))
    if "saved_tracks" in resp:
        resp["saved_tracks"] = list(map(extend_track, resp["saved_tracks"]))
    if "playlists" in resp:
        resp["playlists"] = list(map(extend_playlist, resp["playlists"]))
    if "saved_playlists" in resp:
        resp["saved_playlists"] = list(map(extend_playlist, resp["saved_playlists"]))
    if "albums" in resp:
        resp["albums"] = list(map(extend_playlist, resp["albums"]))
    if "saved_albums" in resp:
        resp["saved_albums"] = list(map(extend_playlist, resp["saved_albums"]))
    return resp


def add_user_artwork(user):
    # Legacy CID-only references to images
    user["cover_photo_legacy"] = user.get("cover_photo")
    user["profile_picture_legacy"] = user.get("profile_picture")

    profile_cid = user.get("profile_picture_sizes")
    if profile_cid:
        profile_endpoints = get_n_primary_endpoints(user, profile_cid, 3)
        profile_endpoint = profile_endpoints[0]
        profile_mirrors = profile_endpoints[1:]
        user["profile_picture"] = {
            "150x150": make_image(profile_endpoint, profile_cid, 150, 150),
            "480x480": make_image(profile_endpoint, profile_cid, 480, 480),
            "1000x1000": make_image(profile_endpoint, profile_cid, 1000, 1000),
            "mirrors": profile_mirrors,
        }
    else:
        user["profile_picture"] = {
            "150x150": None,
            "480x480": None,
            "1000x1000": None,
            "mirrors": [],
        }
    cover_cid = user.get("cover_photo_sizes")
    if cover_cid:
        cover_endpoints = get_n_primary_endpoints(user, cover_cid, 3)
        cover_endpoint = cover_endpoints[0]
        cover_mirrors = cover_endpoints[1:]
        user["cover_photo"] = {
            "640x": make_image(cover_endpoint, cover_cid, 640),
            "2000x": make_image(cover_endpoint, cover_cid, 2000),
            "mirrors": cover_mirrors,
        }
    else:
        user["cover_photo"] = {
            "640x": None,
            "2000x": None,
            "mirrors": [],
        }
    return user


def extend_user(user, current_user_id=None):
    if not user.get("user_id"):
        return user
    user_id = encode_int_id(user["user_id"])
    user["id"] = user_id
    if user.get("artist_pick_track_id"):
        artist_pick_track_id = encode_int_id(user["artist_pick_track_id"])
        user["artist_pick_track_id"] = artist_pick_track_id
    user = add_user_artwork(user)
    # Do not surface playlist library in user response unless we are
    # that user specifically
    if "playlist_library" in user and (
        not current_user_id or current_user_id != user["user_id"]
    ):
        del user["playlist_library"]
    # Marshal wallets into clear names
    user["erc_wallet"] = user["wallet"]

    return user


def extend_account_playlist(playlist):
    playlist["id"] = encode_int_id(playlist["id"])
    if playlist.get("user"):
        playlist["user"]["id"] = encode_int_id(playlist["user"]["id"])
    return playlist


def extend_playlist_library_item(item):
    if item.get("contents"):
        item["contents"] = [
            extend_playlist_library_item(content) for content in item["contents"]
        ]
        return item
    elif item.get("playlist_id"):
        item["playlist_id"] = encode_int_id(item["playlist_id"])
        return item
    logger.error(f"Invalid playlist library item: {item}")
    return None


def extend_playlist_library(playlist_library):
    if playlist_library is None:
        return None
    extended_contents = [
        extend_playlist_library_item(item) for item in playlist_library["contents"]
    ]
    return {"contents": [item for item in extended_contents if item is not None]}


def extend_account(account):
    user = account["user"]
    # Extract before extend_user as it will delete this
    playlist_library = user.get("playlist_library", None)
    return {
        "user": extend_user(user),
        "playlist_library": extend_playlist_library(playlist_library),
        "playlists": [
            extend_account_playlist(playlist)
            for playlist in account.get("playlists", [])
        ],
        "track_save_count": user.get("track_save_count", 0),
    }


def extend_repost(repost):
    repost["user_id"] = encode_int_id(repost["user_id"])
    repost["repost_item_id"] = encode_int_id(repost["repost_item_id"])
    return repost


def extend_favorite(favorite):
    favorite["user_id"] = encode_int_id(favorite["user_id"])
    favorite["favorite_item_id"] = encode_int_id(favorite["save_item_id"])
    favorite["favorite_type"] = favorite["save_type"]
    return favorite


def extend_remix_of(remix_of):
    def extend_track_element(track):
        track_id = track["parent_track_id"]
        track["parent_track_id"] = encode_int_id(track_id)
        if "user" in track:
            track["user"] = extend_user(track["user"])
        return track

    if not remix_of or "tracks" not in remix_of or not remix_of["tracks"]:
        return remix_of

    remix_of["tracks"] = list(map(extend_track_element, remix_of["tracks"]))
    return remix_of


def extend_blob_info(blob_info):
    return {camel_to_snake(k): v for k, v in blob_info.items()}


def parse_bool_param(param):
    if not isinstance(param, str):
        return None
    param = param.lower()
    if param == "true":
        return True
    if param == "false":
        return False


def parse_unix_epoch_param(time, default=0):
    if time is None:
        return datetime.utcfromtimestamp(default)
    return datetime.utcfromtimestamp(time)


def parse_unix_epoch_param_non_utc(time, default=0):
    if time is None:
        return datetime.fromtimestamp(default)
    return datetime.fromtimestamp(time)


def add_track_artwork(track):
    if "user" not in track:
        return track
    cid = track["cover_art_sizes"]
    if cid:
        endpoints = get_n_primary_endpoints(track["user"], cid, 3)
        endpoint = endpoints[0]
        mirrors = endpoints[1:]
        track["artwork"] = {
            "150x150": make_image(endpoint, cid, 150, 150),
            "480x480": make_image(endpoint, cid, 480, 480),
            "1000x1000": make_image(endpoint, cid, 1000, 1000),
            "mirrors": mirrors,
        }
    else:
        track["artwork"] = {
            "150x150": None,
            "480x480": None,
            "1000x1000": None,
            "mirrors": [],
        }
    return track


def extend_track(track, session=None):
    track_id = encode_int_id(track["track_id"])
    owner_id = encode_int_id(track["owner_id"])
    if "user" in track:
        if isinstance(track["user"], list):
            user = track["user"][0]
        else:
            user = track["user"]
        track["user"] = extend_user(user)
    track["id"] = track_id
    track["user_id"] = owner_id
    if "followee_saves" in track:
        track["followee_favorites"] = list(
            map(extend_favorite, track["followee_saves"])
        )
    if "followee_reposts" in track:
        track["followee_reposts"] = list(map(extend_repost, track["followee_reposts"]))
    if "remix_of" in track:
        track["remix_of"] = extend_remix_of(track["remix_of"])

    track = add_track_artwork(track)

    if "save_count" in track:
        track["favorite_count"] = track["save_count"]

    track["is_streamable"] = not track["is_delete"] and not track["user"].get(
        "is_deactivated"
    )

    # Transform new format of splits to legacy format for client compatibility
    if "stream_conditions" in track:
        track["stream_conditions"] = get_legacy_purchase_gate(
            track["stream_conditions"], session
        )
    if "download_conditions" in track:
        track["download_conditions"] = get_legacy_purchase_gate(
            track["download_conditions"], session
        )
    return track


def get_encoded_track_id(track):
    return {"id": encode_int_id(track["track_id"])}


def stem_from_track(track):
    track_id = encode_int_id(track["track_id"])
    parent_id = encode_int_id(track["stem_of"]["parent_track_id"])
    category = track["stem_of"]["category"]
    orig_filename = track["orig_filename"]
    return {
        "id": track_id,
        "parent_id": parent_id,
        "category": category,
        "cid": track["track_cid"],
        "user_id": encode_int_id(track["owner_id"]),
        "orig_filename": orig_filename,
        "blocknumber": track["blocknumber"],
    }


def add_playlist_artwork(playlist):
    if "user" not in playlist:
        return playlist

    cid = playlist["playlist_image_sizes_multihash"]
    if cid:
        endpoints = get_n_primary_endpoints(playlist["user"], cid, 3)
        endpoint = endpoints[0]
        mirrors = endpoints[1:]
        playlist["artwork"] = {
            "150x150": make_image(endpoint, cid, 150, 150),
            "480x480": make_image(endpoint, cid, 480, 480),
            "1000x1000": make_image(endpoint, cid, 1000, 1000),
            "mirrors": mirrors,
        }
    else:
        playlist["artwork"] = {
            "150x150": None,
            "480x480": None,
            "1000x1000": None,
            "mirrors": [],
        }
    return playlist


def extend_playlist(playlist):
    playlist_id = encode_int_id(playlist["playlist_id"])
    owner_id = encode_int_id(playlist["playlist_owner_id"])
    playlist["id"] = playlist_id
    playlist["user_id"] = owner_id
    playlist = add_playlist_artwork(playlist)
    if "user" in playlist:
        if isinstance(playlist["user"], list):
            playlist["user"] = extend_user(playlist["user"][0])
        else:
            playlist["user"] = extend_user(playlist["user"])
    if "followee_saves" in playlist:
        playlist["followee_favorites"] = list(
            map(extend_favorite, playlist["followee_saves"])
        )
    if "followee_reposts" in playlist:
        playlist["followee_reposts"] = list(
            map(extend_repost, playlist["followee_reposts"])
        )
    if "save_count" in playlist:
        playlist["favorite_count"] = playlist["save_count"]

    playlist["added_timestamps"] = get_playlist_added_timestamps(playlist)
    playlist["cover_art"] = playlist["playlist_image_multihash"]
    playlist["cover_art_sizes"] = playlist["playlist_image_sizes_multihash"]
    # If a trending playlist, we have 'track_count'
    # already to preserve the original, non-abbreviated track count
    playlist["track_count"] = (
        playlist["track_count"]
        if "track_count" in playlist
        else len(playlist["playlist_contents"]["track_ids"])
    )
    playlist["stream_conditions"] = get_legacy_purchase_gate(
        playlist.get("stream_conditions", None)
    )
    # Wee hack to make sure this marshals correctly. The marshaller for
    # playlist_model expects these two values to be the same type.
    # TODO: https://linear.app/audius/issue/PAY-3398/fix-playlist-contents-serialization
    playlist["playlist_contents"] = playlist["added_timestamps"]
    return playlist


# Filter out hidden tracks if a non-owner is requesting a public playlist
# See also: queries/query_helpers.py::filter_hidden_tracks
def filter_hidden_tracks(playlist, current_user_id):
    is_owner = (
        current_user_id and playlist.get("playlist_owner_id", None) == current_user_id
    )

    if not playlist.get("is_private", False) and not is_owner:
        tracks_map = {
            encode_int_id(track.get("track_id")): track
            for track in playlist.get("tracks", [])
        }
        playlist_contents_list = playlist.get("playlist_contents", [])
        playlist["playlist_contents"] = [
            track
            for track in playlist_contents_list
            if (track_id := track.get("track_id")) in tracks_map
            and not tracks_map.get(track_id, {}).get("is_unlisted", False)
        ]
        added_timestamps_list = playlist.get("added_timestamps", [])
        playlist["added_timestamps"] = [
            track
            for track in added_timestamps_list
            if (track_id := track.get("track_id")) in tracks_map
            and not tracks_map.get(track_id, {}).get("is_unlisted", False)
        ]


def extend_activity(item):
    if item.get("track_id"):
        return {
            "item_type": "track",
            "timestamp": item["activity_timestamp"],
            "item": extend_track(item),
        }
    if item.get("playlist_id"):
        extended_playlist = extend_playlist(item)
        return {
            "item_type": "playlist",
            "timestamp": item["activity_timestamp"],
            "item": extended_playlist,
        }
    return None


challenge_type_map: Dict[str, str] = {
    ChallengeType.boolean: "boolean",
    ChallengeType.numeric: "numeric",
    ChallengeType.aggregate: "aggregate",
    ChallengeType.trending: "trending",
}


def extend_challenge_response(challenge: ChallengeResponse):
    user_id = encode_int_id(challenge["user_id"])
    new_challenge = challenge.copy()
    new_challenge["user_id"] = user_id
    new_challenge["challenge_type"] = challenge_type_map[challenge["challenge_type"]]
    return new_challenge


def extend_undisbursed_challenge(undisbursed_challenge: UndisbursedChallengeResponse):
    new_undisbursed_challenge = undisbursed_challenge.copy()
    new_undisbursed_challenge["user_id"] = encode_int_id(
        new_undisbursed_challenge["user_id"]
    )
    return new_undisbursed_challenge


def extend_supporter(support: SupportResponse):
    return {
        "rank": support["rank"],
        "amount": to_wei_string(support["amount"]),
        "sender": extend_user(support["user"]),
    }


def extend_supporting(support: SupportResponse):
    return {
        "rank": support["rank"],
        "amount": to_wei_string(support["amount"]),
        "receiver": extend_user(support["user"]),
    }


def extend_reaction(reaction: ReactionResponse):
    new_reaction = reaction.copy()
    new_reaction["sender_user_id"] = encode_int_id(reaction["sender_user_id"])
    return new_reaction


def extend_tip(tip):
    new_tip = tip.copy()
    new_tip["amount"] = to_wei_string(tip["amount"])
    new_tip["sender"] = extend_user(tip["sender"])
    new_tip["receiver"] = extend_user(tip["receiver"])
    new_tip["followee_supporters"] = [
        {"user_id": encode_int_id(id)} for id in new_tip["followee_supporters"]
    ]
    return new_tip


def extend_transaction_details(transaction_details):
    new_transaction_details = transaction_details.copy()
    new_transaction_details["change"] = str(transaction_details["change"])
    new_transaction_details["balance"] = str(transaction_details["balance"])
    new_transaction_details["transaction_date"] = transaction_details[
        "transaction_created_at"
    ]
    if "tx_metadata" in transaction_details:
        new_transaction_details["metadata"] = str(transaction_details["tx_metadata"])
    return new_transaction_details


def extend_purchase(purchase):
    new_purchase = purchase.copy()
    new_purchase["buyer_user_id"] = encode_int_id(purchase["buyer_user_id"])
    new_purchase["seller_user_id"] = encode_int_id(purchase["seller_user_id"])
    new_purchase["content_id"] = encode_int_id(purchase["content_id"])
    new_purchase["access"] = purchase["access"]
    return new_purchase


def extend_feed_item(item):
    if item.get("track_id"):
        return {
            "type": "track",
            "item": extend_track(item),
        }
    if item.get("playlist_id"):
        extended_playlist = extend_playlist(item)
        return {
            "type": "playlist",
            "item": extended_playlist,
        }
    return None


def abort_bad_path_param(param, namespace):
    namespace.abort(400, f"Oh no! Bad path parameter {param}.")


def abort_bad_request_param(param, namespace):
    namespace.abort(400, f"Oh no! Bad request parameter {param}.")


def abort_not_found(identifier, namespace):
    namespace.abort(404, f"Oh no! Resource for ID {identifier} not found.")


def abort_forbidden(namespace):
    namespace.abort(403, "Oh no! User is not allowed to access this resource.")


def abort_unauthorized(namespace):
    namespace.abort(401, "Oh no! User is not authorized.")


def decode_with_abort(identifier: str, namespace) -> int:
    decoded = decode_string_id(identifier)
    if decoded is None:
        namespace.abort(404, f"Invalid ID: '{identifier}'.")
    return cast(int, decoded)


def make_response(name, namespace, modelType):
    return namespace.model(
        name,
        {
            "data": modelType,
        },
    )


def make_full_response(name, namespace, modelType):
    return namespace.clone(name, full_response, {"data": modelType})


def to_dict(multi_dict):
    """Converts a multi dict into a dict where only list entries are not flat"""
    return {
        k: v if len(v) > 1 else v[0]
        for (k, v) in multi_dict.to_dict(flat=False).items()
    }


def get_current_user_id(args):
    """Gets current_user_id from args featuring a "user_id" key"""
    if args.get("user_id"):
        return decode_string_id(args["user_id"])
    return None


def decode_ids_array(ids_array):
    """Takes string ids and decodes them"""
    return list(map(lambda id: decode_string_id(id), ids_array))


class DescriptiveArgument(reqparse.Argument):
    """
    A version of reqparse.Argument that takes an additional "description" param.
    The "description" is used in the Swagger JSON generation and takes priority over "help".
    Unlike the "help" param, it does not affect error messages, allowing "help" to be specific to errors.
    """

    def __init__(
        self,
        name,
        default=None,
        dest=None,
        required=False,
        ignore=False,
        type=reqparse.text_type,
        location=(
            "json",
            "values",
        ),
        choices=(),
        action="store",
        help=None,
        operators=("=",),
        case_sensitive=True,
        store_missing=True,
        trim=False,
        nullable=True,
        description=None,
        doc=True,
    ):
        super().__init__(
            name,
            default,
            dest,
            required,
            ignore,
            type,
            location,
            choices,
            action,
            help,
            operators,
            case_sensitive,
            store_missing,
            trim,
            nullable,
        )
        self.description = description
        self.doc = doc

    @property
    def __schema__(self):
        if self.doc is False:
            return None
        param = super().__schema__
        param["description"] = self.description

        # Allow for a list of enum values to be represented properly in an
        # argument's schema. By default, the enum field is mistakenly added to
        # the root "enum" field rather than the items "enum" field.
        # See: https://stackoverflow.com/questions/36888626/defining-enum-for-array-in-swagger-2-0
        if "enum" in param and "items" in param:
            param["items"]["enum"] = param["enum"]
            del param["enum"]
        return param


current_user_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
current_user_parser.add_argument(
    "user_id", required=False, description="The user ID of the user making the request"
)


pagination_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
pagination_parser.add_argument(
    "offset",
    required=False,
    type=int,
    description="The number of items to skip. Useful for pagination (page number * limit)",
)
pagination_parser.add_argument(
    "limit", required=False, type=int, description="The number of items to fetch"
)
pagination_with_current_user_parser = pagination_parser.copy()
pagination_with_current_user_parser.add_argument(
    "user_id", required=False, description="The user ID of the user making the request"
)

search_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
search_parser.add_argument("query", required=False, description="The search query")
search_parser.add_argument(
    "genre",
    action="append",
    required=False,
    type=str,
    description="The genres to filter by",
)
search_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=SearchSortMethod._member_names_,
)

user_search_parser = search_parser.copy()
user_search_parser.add_argument(
    "is_verified",
    required=False,
    type=str,
    description="Only include verified users in the user results",
)

playlist_search_parser = search_parser.copy()
playlist_search_parser.add_argument(
    "mood",
    action="append",
    required=False,
    type=str,
    description="The moods to filter by",
)
playlist_search_parser.add_argument(
    "includePurchaseable",
    required=False,
    type=str,
    description="Whether or not to include purchaseable content",
)
playlist_search_parser.add_argument(
    "has_downloads",
    required=False,
    type=str,
    description="Only include tracks that have downloads in the track results",
)

track_search_parser = search_parser.copy()
track_search_parser.add_argument(
    "mood",
    action="append",
    required=False,
    type=str,
    description="The moods to filter by",
)
track_search_parser.add_argument(
    "only_downloadable",
    required=False,
    default=False,
    description="Return only downloadable tracks",
)
track_search_parser.add_argument(
    "includePurchaseable",
    required=False,
    type=str,
    description="Whether or not to include purchaseable content",
)
track_search_parser.add_argument(
    "is_purchaseable",
    required=False,
    type=str,
    description="Only include purchaseable tracks and albums in the track and album results",
)
track_search_parser.add_argument(
    "has_downloads",
    required=False,
    type=str,
    description="Only include tracks that have downloads in the track results",
)
track_search_parser.add_argument(
    "key",
    action="append",
    required=False,
    type=str,
    description="Only include tracks that match the musical key",
)
track_search_parser.add_argument(
    "bpm_min",
    required=False,
    type=str,
    description="Only include tracks that have a bpm greater than or equal to",
)
track_search_parser.add_argument(
    "bpm_max",
    required=False,
    type=str,
    description="Only include tracks that have a bpm less than or equal to",
)


track_history_parser = pagination_parser.copy()
track_history_parser.add_argument(
    "query", required=False, description="The filter query"
)
track_history_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=SortMethod._member_names_,
)
track_history_parser.add_argument(
    "sort_direction",
    required=False,
    description="The sort direction",
    type=str,
    choices=SortDirection._member_names_,
)

user_favorited_tracks_parser = pagination_with_current_user_parser.copy()
user_favorited_tracks_parser.add_argument(
    "query", required=False, description="The filter query"
)
user_favorited_tracks_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=SortMethod._member_names_,
)
user_favorited_tracks_parser.add_argument(
    "sort_direction",
    required=False,
    description="The sort direction",
    type=str,
    choices=SortDirection._member_names_,
)

user_tracks_library_parser = user_favorited_tracks_parser.copy()
user_tracks_library_parser.remove_argument("current_user")
user_tracks_library_parser.add_argument(
    "type",
    required=False,
    description="The type of entity to return: favorited, reposted, purchased, or all. Defaults to favorite",
    type=str,
    choices=LibraryFilterType._member_names_,
    default=LibraryFilterType.favorite,
)

user_collections_library_parser = user_tracks_library_parser.copy()
# Replace just the sort method args with the CollectionLibrarySortMethod version
user_collections_library_parser.replace_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=CollectionLibrarySortMethod._member_names_,
)
user_track_listen_count_route_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
user_track_listen_count_route_parser.add_argument(
    "start_time",
    required=True,
    description="Start time from which to start results for user listen count data (inclusive).",
)
user_track_listen_count_route_parser.add_argument(
    "end_time",
    required=True,
    description="End time until which to cut off results of listen count data (not inclusive).",
)

user_tracks_route_parser = pagination_with_current_user_parser.copy()
user_tracks_route_parser.add_argument(
    "sort",
    required=False,
    type=str,
    default="date",
    choices=("date", "plays"),
    description="[Deprecated] Field to sort by",
)
user_tracks_route_parser.add_argument(
    "query", required=False, description="The filter query"
)
user_tracks_route_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=SortMethod._member_names_,
)
user_tracks_route_parser.add_argument(
    "sort_direction",
    required=False,
    description="The sort direction",
    type=str,
    choices=SortDirection._member_names_,
)
user_tracks_route_parser.add_argument(
    "filter_tracks",
    required=False,
    description="Filter by unlisted or public tracks",
    type=str,
    default="all",
    choices=("all", "public", "unlisted"),
)

user_playlists_route_parser = pagination_with_current_user_parser.copy()
user_albums_route_parser = pagination_with_current_user_parser.copy()

full_search_parser = pagination_with_current_user_parser.copy()
full_search_parser.add_argument("query", required=False, description="The search query")
full_search_parser.add_argument(
    "kind",
    required=False,
    type=str,
    default="all",
    choices=("all", "users", "tracks", "playlists", "albums"),
    description="The type of response, one of: all, users, tracks, playlists, or albums",
)
full_search_parser.add_argument(
    "includePurchaseable",
    required=False,
    type=inputs.boolean,
    description="Whether or not to include purchaseable content",
)
full_search_parser.add_argument(
    "genre",
    action="append",
    required=False,
    type=str,
    description="The genres to filter by",
)
full_search_parser.add_argument(
    "mood",
    action="append",
    required=False,
    type=str,
    description="The moods to filter by",
)
full_search_parser.add_argument(
    "is_verified",
    required=False,
    type=inputs.boolean,
    description="Only include verified users in the user results",
)
full_search_parser.add_argument(
    "has_downloads",
    required=False,
    type=inputs.boolean,
    description="Only include tracks that have downloads in the track results",
)
full_search_parser.add_argument(
    "is_purchaseable",
    required=False,
    type=inputs.boolean,
    description="Only include purchaseable tracks and albums in the track and album results",
)
full_search_parser.add_argument(
    "key",
    action="append",
    required=False,
    type=str,
    description="Only include tracks that match the musical key",
)
full_search_parser.add_argument(
    "bpm_min",
    required=False,
    type=float,
    description="Only include tracks that have a bpm greater than or equal to",
)
full_search_parser.add_argument(
    "bpm_max",
    required=False,
    type=float,
    description="Only include tracks that have a bpm less than or equal to",
)
full_search_parser.add_argument(
    "sort_method",
    required=False,
    description="The sort method",
    type=str,
    choices=SearchSortMethod._member_names_,
)

verify_token_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
verify_token_parser.add_argument("token", required=True, description="JWT to verify")

full_trending_parser = pagination_parser.copy()
full_trending_parser.add_argument(
    "user_id", required=False, description="The user ID of the user making the request"
)
full_trending_parser.add_argument(
    "genre",
    required=False,
    description="Filter trending to a specified genre",
)
full_trending_parser.add_argument(
    "time",
    required=False,
    description="Calculate trending over a specified time range",
    type=str,
    choices=("week", "month", "year", "allTime"),
)

trending_parser_paginated = full_trending_parser.copy()
trending_parser_paginated.remove_argument("user_id")

trending_parser = trending_parser_paginated.copy()
trending_parser.remove_argument("limit")
trending_parser.remove_argument("offset")


notifications_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
notifications_parser.add_argument(
    "timestamp",
    type=int,
    required=False,
    description="The timestamp from which to paginate",
)
notifications_parser.add_argument(
    "group_id", required=False, description="The group_id form which to paginate"
)
notifications_parser.add_argument(
    "limit",
    required=False,
    type=int,
    description="The number of notifications to return",
)
notifications_parser.add_argument(
    "valid_types",
    required=False,
    type=str,
    action="append",
    description="Additional valid notification types to return",
    choices=[n.value for n in NotificationType],
    default=default_valid_notification_types,
)


def success_response(entity):
    return api_helpers.success_response(entity, status=200, to_json=False)


def error_response(error):
    # This is not really a success, but we care about getting the error data back in the same shape
    return api_helpers.success_response(error, status=500, to_json=False)


DEFAULT_LIMIT = 100
MIN_LIMIT = 1
MAX_LIMIT = 500
DEFAULT_OFFSET = 0
MIN_OFFSET = 0


def format_limit(args, max_limit=MAX_LIMIT, default_limit=DEFAULT_LIMIT):
    lim = args.get("limit", default_limit)
    if lim is None:
        return default_limit

    return max(min(int(lim), max_limit), MIN_LIMIT)


def format_offset(args, max_offset=MAX_LIMIT):
    offset = args.get("offset", DEFAULT_OFFSET)
    if offset is None:
        return DEFAULT_OFFSET
    return max(min(int(offset), max_offset), MIN_OFFSET)


def format_query(args) -> Union[str, None]:
    return args.get("query", None)


def format_sort_method(args) -> Union[SortMethod, None]:
    return args.get("sort_method", None)


def format_sort_direction(args) -> Union[SortDirection, None]:
    return args.get("sort_direction", None)


def format_library_filter(args) -> LibraryFilterType:
    return args.get("type", LibraryFilterType.favorite)


def get_default_max(value, default, max=None):
    if not isinstance(value, int):
        return default
    if max is None:
        return value
    return min(value, max)


def format_aggregate_monthly_plays_for_user(aggregate_monthly_plays_for_user=[]):
    formatted_response_data = {}
    for aggregate_monthly_play in aggregate_monthly_plays_for_user:
        month = aggregate_monthly_play["timestamp"].strftime("%Y-%m-%dT%H:%M:%SZ")
        if month not in formatted_response_data:
            formatted_response_data[month] = {}
            formatted_response_by_month = formatted_response_data[month]
            formatted_response_by_month["totalListens"] = 0
            formatted_response_by_month["trackIds"] = []
            formatted_response_by_month["listenCounts"] = []

        formatted_response_by_month = formatted_response_data[month]
        formatted_response_by_month["listenCounts"].append(
            {
                "trackId": aggregate_monthly_play["play_item_id"],
                "date": month,
                "listens": aggregate_monthly_play["count"],
            }
        )
        formatted_response_by_month["trackIds"].append(
            aggregate_monthly_play["play_item_id"]
        )
        formatted_response_by_month["totalListens"] += aggregate_monthly_play["count"]

    return formatted_response_data


def format_developer_app(developer_app):
    return {
        "address": developer_app["address"],
        "user_id": encode_int_id(developer_app["user_id"]),
        "name": developer_app["name"],
        "description": developer_app.get("description", None),
        "image_url": developer_app.get("image_url", None),
    }


def format_authorized_app(authorized_app):
    return {
        "address": authorized_app["address"],
        "name": authorized_app["name"],
        "description": authorized_app.get("description", None),
        "image_url": authorized_app.get("image_url", None),
        "grantor_user_id": encode_int_id(authorized_app["grantor_user_id"]),
        "grant_created_at": authorized_app["grant_created_at"],
        "grant_updated_at": authorized_app["grant_updated_at"],
    }


def format_grant(grant):
    return {
        "grantee_address": grant["grantee_address"],
        "user_id": encode_int_id(grant["user_id"]),
        "is_approved": grant["is_approved"],
        "is_revoked": grant["is_revoked"],
        "created_at": grant["created_at"],
        "updated_at": grant["updated_at"],
    }


def format_managed_user(managed_user):
    return {
        "user": extend_user(managed_user["user"]),
        "grant": format_grant(managed_user["grant"]),
    }


def format_user_manager(user_manager):
    return {
        "manager": extend_user(user_manager["manager"]),
        "grant": format_grant(user_manager["grant"]),
    }


def format_dashboard_wallet_user(dashboard_wallet_user):
    return {
        "wallet": dashboard_wallet_user["wallet"],
        "user": extend_user(dashboard_wallet_user["user"]),
    }


def get_prefixed_eth_address(address: str):
    if not address.startswith("0x"):
        return "0x" + address
    return address


def get_non_prefixed_eth_address(address: str):
    if address.startswith("0x"):
        return address[2:]
    return address
