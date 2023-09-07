import copy
import os

from elasticsearch import Elasticsearch, logger, logging

from src import api_helpers
from src.utils.spl_audio import to_wei

logger.setLevel(logging.WARNING)
es_url = os.getenv("audius_elasticsearch_url")
esclient = None
if es_url and not esclient:
    esclient = Elasticsearch(es_url, request_timeout=60)

# uses aliases
ES_PLAYLISTS = "playlists"
ES_REPOSTS = "reposts"
ES_SAVES = "saves"
ES_TRACKS = "tracks"
ES_USERS = "users"

ES_INDEXES = [ES_PLAYLISTS, ES_REPOSTS, ES_SAVES, ES_TRACKS, ES_USERS]

STALE_THRESHOLD_SECONDS = 4 * 60 * 60  # 4 hours


def listify(things):
    if isinstance(things, list):
        return [str(t) for t in things]
    return [str(things)]


def pluck_hits(found):
    if "error" in found:
        raise Exception(found["error"])

    res = [h["_source"] for h in found["hits"]["hits"]]

    # add score for search_quality.py script
    for i in range(len(found["hits"]["hits"])):
        res[i]["_score"] = found["hits"]["hits"][i]["_score"]
    return res


def populate_user_metadata_es(user, current_user):
    user["total_balance"] = str(
        int(user.get("balance", "0") or "0")
        + int(user.get("associated_wallets_balance", "0") or "0")
        + to_wei(user.get("associated_sol_wallets_balance", "0") or 0)
        + to_wei(user.get("waudio", "0") or 0)
    )

    # Convert image cid to cids for each image size variant
    profile_cid = user.get("profile_picture_sizes")
    if profile_cid:
        profile_cids = api_helpers.get_image_cids(
            user, profile_cid, api_helpers.PROFILE_PICTURE_SIZES
        )
        user["profile_picture_cids"] = profile_cids
    cover_cid = user.get("cover_photo_sizes")
    if cover_cid:
        cover_cids = api_helpers.get_image_cids(
            user, cover_cid, api_helpers.PROFILE_COVER_PHOTO_SIZES
        )
        user["cover_photo_cids"] = cover_cids

    # Mutual box on profile page will fetch the data to compute this number
    # using the /v1/full/users/xyz/related?user_id=abc endpoint
    # Avoid extra round trips by not computing it here
    user["current_user_followee_follow_count"] = None

    if current_user:
        user_following = user.get("following_ids", [])
        current_user_following = current_user.get("following_ids", [])
        user["does_current_user_follow"] = user["user_id"] in current_user_following
        user["does_follow_current_user"] = current_user["user_id"] in user_following

        current_user_subscribed = current_user.get("subscribed_ids", [])
        user["does_current_user_subscribe"] = user["user_id"] in current_user_subscribed
    else:
        user["does_current_user_follow"] = False
        user["does_follow_current_user"] = False
    return omit_indexed_fields(user)


def populate_track_or_playlist_metadata_es(item, current_user):
    # Convert cover art cid to cids for each image size variant
    cover_cid = item.get("cover_art_sizes") or item.get(
        "playlist_image_sizes_multihash"
    )
    if cover_cid:
        cover_cids = api_helpers.get_image_cids(
            item["user"], cover_cid, api_helpers.COVER_ART_SIZES
        )
        item["cover_art_cids"] = cover_cids

    if current_user:
        my_id = current_user["user_id"]
        item["has_current_user_reposted"] = my_id in item["reposted_by"]
        item["has_current_user_saved"] = my_id in item["saved_by"]
    else:
        item["has_current_user_reposted"] = False
        item["has_current_user_saved"] = False
    return omit_indexed_fields(item)


omit_keys = [
    # user index
    "following_ids",
    "follower_ids",
    "subscribed_ids",
    "tracks",
    # track index
    "reposted_by",
    "saved_by",
    # saves + reposts
    "item_key",
]


def omit_indexed_fields(doc):
    doc = copy.copy(doc)

    # track
    if "tags" in doc and isinstance(doc["tags"], list):
        doc["tags"] = ",".join(doc["tags"])

    if "following_count" in doc:
        doc["followee_count"] = doc["following_count"]

    for key in omit_keys:
        if key in doc:
            del doc[key]

    return doc
