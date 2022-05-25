import logging
from typing import Any, Dict

from src.api.v1.helpers import (
    extend_favorite,
    extend_playlist,
    extend_repost,
    extend_track,
    extend_user,
)
from src.queries.get_feed_es import fetch_followed_saves_and_reposts, item_key
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_TRACKS,
    ES_USERS,
    esclient,
    pluck_hits,
    popuate_user_metadata_es,
    populate_track_or_playlist_metadata_es,
)

logger = logging.getLogger(__name__)


def search_es_full(args: dict):
    if not esclient:
        raise Exception("esclient is None")

    search_str = args.get("query")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset", 0)
    search_type = args.get("kind", "all")
    only_downloadable = args.get("only_downloadable")
    do_tracks = search_type == "all" or search_type == "tracks"
    do_users = search_type == "all" or search_type == "users"
    do_playlists = search_type == "all" or search_type == "playlists"
    do_albums = search_type == "all" or search_type == "albums"

    mdsl: Any = []

    # Scoring Summary
    # Query score * Function score multiplier
    # Query score = boosted on text similarity, verified artists, personalization (current user saved or reposted or followed)
    # Function score multiplier = popularity (repost count)

    # tracks
    if do_tracks:
        mdsl.extend(
            [
                {"index": ES_TRACKS},
                track_dsl(
                    search_str,
                    current_user_id,
                    must_saved=False,
                    only_downloadable=only_downloadable,
                ),
            ]
        )

        # saved tracks
        if current_user_id:
            mdsl.extend(
                [
                    {"index": ES_TRACKS},
                    track_dsl(
                        search_str,
                        current_user_id,
                        must_saved=True,
                        only_downloadable=only_downloadable,
                    ),
                ]
            )

    # users
    if do_users:
        mdsl.extend(
            [
                {"index": ES_USERS},
                user_dsl(search_str, current_user_id),
            ]
        )
        if current_user_id:
            mdsl.extend(
                [
                    {"index": ES_USERS},
                    user_dsl(search_str, current_user_id, True),
                ]
            )

    # playlists
    if do_playlists:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                playlist_dsl(search_str, current_user_id),
            ]
        )

        # saved playlists
        if current_user_id:
            mdsl.extend(
                [
                    {"index": ES_PLAYLISTS},
                    playlist_dsl(search_str, current_user_id, True),
                ]
            )

    # albums
    if do_albums:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                album_dsl(search_str, current_user_id),
            ]
        )
        # saved albums
        if current_user_id:
            mdsl.extend(
                [
                    {"index": ES_PLAYLISTS},
                    album_dsl(search_str, current_user_id, True),
                ]
            )

    for dsl in mdsl:
        if "query" in dsl:
            dsl["size"] = limit
            dsl["from"] = offset

    mfound = esclient.msearch(searches=mdsl)

    response: Dict = {
        "tracks": [],
        "saved_tracks": [],
        "users": [],
        "followed_users": [],
        "playlists": [],
        "saved_playlists": [],
        "albums": [],
        "saved_albums": [],
    }

    if do_tracks:
        response["tracks"] = pluck_hits(mfound["responses"].pop(0))
        if current_user_id:
            response["saved_tracks"] = pluck_hits(mfound["responses"].pop(0))

    if do_users:
        response["users"] = pluck_hits(mfound["responses"].pop(0))
        if current_user_id:
            response["followed_users"] = pluck_hits(mfound["responses"].pop(0))

    if do_playlists:
        response["playlists"] = pluck_hits(mfound["responses"].pop(0))
        if current_user_id:
            response["saved_playlists"] = pluck_hits(mfound["responses"].pop(0))

    if do_albums:
        response["albums"] = pluck_hits(mfound["responses"].pop(0))
        if current_user_id:
            response["saved_albums"] = pluck_hits(mfound["responses"].pop(0))

    # hydrate users, saves, reposts
    item_keys = []
    user_ids = set()
    if current_user_id:
        user_ids.add(current_user_id)

    # collect keys for fetching
    for k in [
        "tracks",
        "saved_tracks",
        "playlists",
        "saved_playlists",
        "albums",
        "saved_albums",
    ]:
        for item in response[k]:
            item_keys.append(item_key(item))
            user_ids.add(item.get("owner_id", item.get("playlist_owner_id")))

    # fetch users
    users_by_id = {}
    current_user = None

    if user_ids:
        users_mget = esclient.mget(index=ES_USERS, ids=list(user_ids))
        users_by_id = {d["_id"]: d["_source"] for d in users_mget["docs"] if d["found"]}
        if current_user_id:
            current_user = users_by_id.get(str(current_user_id))
        for id, user in users_by_id.items():
            users_by_id[id] = popuate_user_metadata_es(user, current_user)

    # fetch followed saves + reposts
    # TODO: instead of limit param (20) should do an agg to get 3 saves / reposts per item_key
    (follow_saves, follow_reposts) = fetch_followed_saves_and_reposts(
        current_user_id, item_keys, 20
    )

    # tracks: finalize
    for k in ["tracks", "saved_tracks"]:
        tracks = response[k]
        hydrate_user(tracks, users_by_id)
        hydrate_saves_reposts(tracks, follow_saves, follow_reposts)
        response[k] = transform_tracks(tracks, users_by_id, current_user)

    # users: finalize
    for k in ["users", "followed_users"]:
        users = drop_copycats(response[k])
        response[k] = [
            extend_user(popuate_user_metadata_es(user, current_user)) for user in users
        ]

    # playlists: finalize
    for k in ["playlists", "saved_playlists"]:
        playlists = response[k]
        hydrate_saves_reposts(playlists, follow_saves, follow_reposts)
        hydrate_user(playlists, users_by_id)
        response[k] = [
            extend_playlist(populate_track_or_playlist_metadata_es(item, current_user))
            for item in playlists
        ]

    return response


def base_match(search_str: str, operator="or"):
    return [
        {
            "multi_match": {
                "query": search_str,
                "fields": [
                    "suggest",
                    "suggest._2gram",
                    "suggest._3gram",
                ],
                "operator": operator,
                "type": "bool_prefix",
            }
        }
    ]


def be_saved(current_user_id):
    return {"term": {"saved_by": {"value": current_user_id, "boost": 1.2}}}


def be_reposted(current_user_id):
    return {"term": {"reposted_by": {"value": current_user_id, "boost": 1.2}}}


def be_followed(current_user_id):
    return {
        "terms": {
            "_id": {
                "index": ES_USERS,
                "id": str(current_user_id),
                "path": "following_ids",
            },
        }
    }


def personalize_dsl(dsl, current_user_id, must_saved):
    if current_user_id and must_saved:
        dsl["must"].append(be_saved(current_user_id))

    if current_user_id:
        dsl["should"].append(be_saved(current_user_id))
        dsl["should"].append(be_reposted(current_user_id))


def default_function_score(dsl, ranking_field):
    return {
        "query": {
            "function_score": {
                "query": {"bool": dsl},
                "functions": [
                    {
                        "field_value_factor": {
                            "field": ranking_field,
                            "modifier": "ln2p",
                        }
                    },
                ],
            }
        },
    }


def track_dsl(search_str, current_user_id, must_saved=False, only_downloadable=False):
    dsl = {
        "must": [
            *base_match(search_str),
            {"term": {"is_unlisted": {"value": False}}},
            {"term": {"is_delete": False}},
        ],
        "must_not": [
            {"exists": {"field": "stem_of"}},
        ],
        "should": [
            *base_match(search_str, operator="and"),
        ],
    }

    if only_downloadable:
        dsl["must"].append({"term": {"downloadable": {"value": True}}})

    personalize_dsl(dsl, current_user_id, must_saved)
    return default_function_score(dsl, "repost_count")


def user_dsl(search_str, current_user_id, must_saved=False):
    dsl = {
        "must": [
            *base_match(search_str),
            {"term": {"is_deactivated": {"value": False}}},
        ],
        "must_not": [],
        "should": [
            *base_match(search_str, operator="and"),
            {"term": {"is_verified": {"value": True}}},
        ],
    }

    if current_user_id and must_saved:
        dsl["must"].append(be_followed(current_user_id))

    if current_user_id:
        dsl["should"].append(be_followed(current_user_id))

    return default_function_score(dsl, "follower_count")


def base_playlist_dsl(search_str, is_album):
    return {
        "must": [
            *base_match(search_str),
            {"term": {"is_private": {"value": False}}},
            {"term": {"is_delete": False}},
            {"term": {"is_album": {"value": is_album}}},
        ],
        "should": [
            *base_match(search_str, operator="and"),
            {"term": {"is_verified": {"value": True}}},
        ],
    }


def playlist_dsl(search_str, current_user_id, must_saved=False):
    dsl = base_playlist_dsl(search_str, False)
    personalize_dsl(dsl, current_user_id, must_saved)
    return default_function_score(dsl, "repost_count")


def album_dsl(search_str, current_user_id, must_saved=False):
    dsl = base_playlist_dsl(search_str, True)
    personalize_dsl(dsl, current_user_id, must_saved)
    return default_function_score(dsl, "repost_count")


def drop_copycats(users):
    """Filters out users with copy cat names.
    e.g. if a verified deadmau5 is in the result set
    filter out all non-verified users with same name.
    """
    reserved = set()
    for user in users:
        if user["is_verified"]:
            reserved.add(lower_ascii_name(user["name"]))

    filtered = []
    for user in users:
        if not user["is_verified"] and lower_ascii_name(user["name"]) in reserved:
            continue
        filtered.append(user)
    return filtered


def lower_ascii_name(name):
    if not name:
        return ""
    n = name.lower()
    n = n.encode("ascii", "ignore")
    return n.decode()


def hydrate_user(items, users_by_id):
    for item in items:
        uid = str(item.get("owner_id", item.get("playlist_owner_id")))
        user = users_by_id.get(uid)
        if user:
            item["user"] = user


def hydrate_saves_reposts(items, follow_saves, follow_reposts):
    for item in items:
        ik = item_key(item)
        item["followee_reposts"] = [extend_repost(r) for r in follow_reposts[ik]]
        item["followee_favorites"] = [extend_favorite(x) for x in follow_saves[ik]]


def transform_tracks(tracks, users_by_id, current_user):
    tracks_out = []
    for track in tracks:
        track = populate_track_or_playlist_metadata_es(track, current_user)
        track = extend_track(track)
        tracks_out.append(track)

    return tracks_out
