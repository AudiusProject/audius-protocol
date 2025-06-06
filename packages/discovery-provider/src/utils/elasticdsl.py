import copy
import os

from elasticsearch import Elasticsearch, logging

from src.queries import response_name_constants
from src.queries.query_helpers import get_track_remix_metadata
from src.utils import db_session
from src.utils.spl_audio import to_wei

logging.getLogger("elasticsearch").setLevel(logging.WARNING)
logging.getLogger("elastic_transport.transport").setLevel(logging.WARNING)
_esclient = None

# uses aliases
ES_PLAYLISTS = "playlists"
ES_REPOSTS = "reposts"
ES_SAVES = "saves"
ES_TRACKS = "tracks"
ES_USERS = "users"

ES_INDEXES = [ES_PLAYLISTS, ES_REPOSTS, ES_SAVES, ES_TRACKS, ES_USERS]

STALE_THRESHOLD_SECONDS = 4 * 60 * 60  # 4 hours


def get_esclient():
    global _esclient
    es_url = os.getenv("audius_elasticsearch_url")
    if es_url and not _esclient:
        _esclient = Elasticsearch(es_url, request_timeout=60)
    return _esclient


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

    # Mutual box on profile page will fetch the data to compute this number
    # using the /v1/full/users/xyz/related?user_id=abc endpoint
    # Avoid extra round trips by not computing it here
    user["current_user_followee_follow_count"] = None

    if current_user:
        current_user_following = current_user.get("following_ids", [])
        user["does_current_user_follow"] = user["user_id"] in current_user_following

        current_user_subscribed = current_user.get("subscribed_ids", [])
        user["does_current_user_subscribe"] = user["user_id"] in current_user_subscribed
    else:
        user["does_current_user_follow"] = False
    return omit_indexed_fields(user)


def populate_track_or_playlist_metadata_es(
    item, current_user, include_playlist_tracks=False
):
    if current_user:
        my_id = current_user["user_id"]
        item["has_current_user_reposted"] = my_id in item.get("reposted_by", [])
        item["has_current_user_saved"] = my_id in item.get("saved_by", [])
    else:
        item["has_current_user_reposted"] = False
        item["has_current_user_saved"] = False

    item["followee_reposts"] = item.get("followee_reposts", [])
    item["followee_saves"] = item.get("followee_saves", [])

    if "playlist_id" in item and "tracks" in item and include_playlist_tracks:
        item["tracks"] = [
            populate_track_or_playlist_metadata_es(track, current_user)
            for track in item["tracks"]
        ]

    # Populate remix_of tracks w/ the parent track's user and if that user saved/reposted the child
    # Necessary to show cosign on feed / search
    db = db_session.get_db_read_replica()
    with db.scoped_session() as session:
        remixes = get_track_remix_metadata(
            session, [item], current_user.get("user_id") if current_user else None
        )
        if (
            response_name_constants.remix_of in item
            and isinstance(item[response_name_constants.remix_of], dict)
            and item["track_id"] in remixes
        ):
            remix_tracks = item[response_name_constants.remix_of].get("tracks")
            if remix_tracks and isinstance(remix_tracks, list):
                for remix_track in remix_tracks:
                    parent_track_id = remix_track.get("parent_track_id")
                    if parent_track_id in remixes[item["track_id"]]:
                        remix_track.update(remixes[item["track_id"]][parent_track_id])
        else:
            item[response_name_constants.remix_of] = None
    return omit_indexed_fields(item, include_playlist_tracks)


omit_keys = [
    # user index
    "following_ids",
    "follower_ids",
    "subscribed_ids",
    # track index
    "reposted_by",
    "saved_by",
    # saves + reposts
    "item_key",
]


def omit_indexed_fields(doc, include_playlist_tracks=False):
    doc = copy.copy(doc)

    # track
    if "tags" in doc and isinstance(doc["tags"], list):
        doc["tags"] = ",".join(doc["tags"])

    if "following_count" in doc:
        doc["followee_count"] = doc["following_count"]

    for key in omit_keys:
        if key in doc:
            del doc[key]

    if not include_playlist_tracks and "tracks" in doc:
        del doc["tracks"]

    return doc
