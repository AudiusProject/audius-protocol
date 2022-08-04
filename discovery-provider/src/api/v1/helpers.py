import logging
from datetime import datetime
from typing import Dict, cast

from flask_restx import reqparse
from src import api_helpers
from src.models.rewards.challenge import ChallengeType
from src.queries.get_challenges import ChallengeResponse
from src.queries.get_support_for_user import SupportResponse
from src.queries.get_undisbursed_challenges import UndisbursedChallengeResponse
from src.queries.reactions import ReactionResponse
from src.utils.config import shared_config
from src.utils.helpers import decode_string_id, encode_int_id
from src.utils.spl_audio import to_wei_string

from .models.common import full_response

logger = logging.getLogger(__name__)


def make_image(endpoint, cid, width="", height=""):
    return f"{endpoint}/ipfs/{cid}/{width}x{height}.jpg"


def get_primary_endpoint(user):
    raw_endpoint = user["creator_node_endpoint"]
    if not raw_endpoint:
        return shared_config["discprov"]["user_metadata_service_url"]
    return raw_endpoint.split(",")[0]


def add_track_artwork(track):
    if "user" not in track:
        return track
    endpoint = get_primary_endpoint(track["user"])
    cid = track["cover_art_sizes"]
    if not endpoint or not cid:
        return track
    artwork = {
        "150x150": make_image(endpoint, cid, 150, 150),
        "480x480": make_image(endpoint, cid, 480, 480),
        "1000x1000": make_image(endpoint, cid, 1000, 1000),
    }
    track["artwork"] = artwork
    return track


def add_playlist_artwork(playlist):
    if "user" not in playlist:
        return playlist
    endpoint = get_primary_endpoint(playlist["user"])
    cid = playlist["playlist_image_sizes_multihash"]
    if not endpoint or not cid:
        return playlist
    artwork = {
        "150x150": make_image(endpoint, cid, 150, 150),
        "480x480": make_image(endpoint, cid, 480, 480),
        "1000x1000": make_image(endpoint, cid, 1000, 1000),
    }
    playlist["artwork"] = artwork
    return playlist


def add_playlist_added_timestamps(playlist):
    if "playlist_contents" not in playlist:
        return playlist
    added_timestamps = []
    for track in playlist["playlist_contents"]["track_ids"]:
        added_timestamps.append(
            {
                "track_id": encode_int_id(track["track"]),
                "timestamp": track["time"],
                "metadata_timestamp": track.get("metadata_time", track["time"]),
            }
        )
    return added_timestamps


def add_user_artwork(user):
    # Legacy CID-only references to images
    user["cover_photo_legacy"] = user["cover_photo"]
    user["profile_picture_legacy"] = user["profile_picture"]

    endpoint = get_primary_endpoint(user)
    if not endpoint:
        return user
    cover_cid = user["cover_photo_sizes"]
    profile_cid = user["profile_picture_sizes"]
    if profile_cid:
        profile = {
            "150x150": make_image(endpoint, profile_cid, 150, 150),
            "480x480": make_image(endpoint, profile_cid, 480, 480),
            "1000x1000": make_image(endpoint, profile_cid, 1000, 1000),
        }
        user["profile_picture"] = profile
    if cover_cid:
        cover = {
            "640x": make_image(endpoint, cover_cid, 640),
            "2000x": make_image(endpoint, cover_cid, 2000),
        }
        user["cover_photo"] = cover
    return user


# Helpers
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


def extend_user(user, current_user_id=None):
    user_id = encode_int_id(user["user_id"])
    user["id"] = user_id
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


def extend_track(track):
    track_id = encode_int_id(track["track_id"])
    owner_id = encode_int_id(track["owner_id"])
    if "user" in track:
        track["user"] = extend_user(track["user"])
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

    duration = 0.0
    for segment in track["track_segments"]:
        # NOTE: Legacy track segments store the duration as a string
        duration += float(segment["duration"])
    track["duration"] = round(duration)

    downloadable = (
        "download" in track
        and track["download"]
        and track["download"]["is_downloadable"]
    )
    track["downloadable"] = bool(downloadable)

    return track


def get_encoded_track_id(track):
    return {"id": encode_int_id(track["track_id"])}


def stem_from_track(track):
    track_id = encode_int_id(track["track_id"])
    parent_id = encode_int_id(track["stem_of"]["parent_track_id"])
    category = track["stem_of"]["category"]
    return {
        "id": track_id,
        "parent_id": parent_id,
        "category": category,
        "cid": track["download"]["cid"],
        "user_id": encode_int_id(track["owner_id"]),
        "blocknumber": track["blocknumber"],
    }


def extend_playlist(playlist):
    playlist_id = encode_int_id(playlist["playlist_id"])
    owner_id = encode_int_id(playlist["playlist_owner_id"])
    playlist["id"] = playlist_id
    playlist["user_id"] = owner_id
    playlist = add_playlist_artwork(playlist)
    if "user" in playlist:
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

    playlist["added_timestamps"] = add_playlist_added_timestamps(playlist)
    playlist["cover_art"] = playlist["playlist_image_multihash"]
    playlist["cover_art_sizes"] = playlist["playlist_image_sizes_multihash"]
    # If a trending playlist, we have 'track_count'
    # already to preserve the original, non-abbreviated track count
    playlist["track_count"] = (
        playlist["track_count"]
        if "track_count" in playlist
        else len(playlist["playlist_contents"]["track_ids"])
    )
    return playlist


def extend_activity(item):
    if item.get("track_id"):
        return {
            "item_type": "track",
            "timestamp": item["activity_timestamp"],
            "item": extend_track(item),
        }
    if item.get("playlist_id"):
        return {
            "item_type": "playlist",
            "timestamp": item["activity_timestamp"],
            "item": extend_playlist(item),
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


def abort_bad_path_param(param, namespace):
    namespace.abort(400, f"Oh no! Bad path parameter {param}.")


def abort_bad_request_param(param, namespace):
    namespace.abort(400, f"Oh no! Bad request parameter {param}.")


def abort_not_found(identifier, namespace):
    namespace.abort(404, f"Oh no! Resource for ID {identifier} not found.")


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


def get_authed_user_id(args):
    """Gets authed_user_id from args featuring a "authed_user_id" key"""
    if args.get("authed_user_id"):
        return decode_string_id(args["authed_user_id"])
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
        if self.doc == False:
            return None
        param = super().__schema__
        param["description"] = self.description
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
search_parser.add_argument("query", required=True, description="The search query")

full_search_parser = pagination_with_current_user_parser.copy()
full_search_parser.add_argument("query", required=True, description="The search query")
full_search_parser.add_argument(
    "kind",
    required=False,
    type=str,
    default="all",
    choices=("all", "users", "tracks", "playlists", "albums"),
    description="The type of response, one of: all, users, tracks, playlists, or albums",
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


def success_response(entity):
    return api_helpers.success_response(entity, 200, False)


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


def get_default_max(value, default, max=None):
    if not isinstance(value, int):
        return default
    if max is None:
        return value
    return min(value, max)
