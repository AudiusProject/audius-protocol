import json
import logging
from copy import deepcopy
from typing import Any, Dict, List

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

    # taken from search_queries.py
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
    # is_auto_complete = args.get("is_auto_complete")

    mdsl: Any = []

    # should_saved_or_reposted = []
    only_downloadable_term = {"term": {"downloadable": {"value": True}}}

    if current_user_id:
        saved_term = {"term": {"saved_by": {"value": current_user_id}}}
        # should_saved_or_reposted = [
        #     saved_term,
        #     {"term": {"reposted_by": {"value": current_user_id}}},
        # ]

    match_query = {
        "multi_match": {
            "query": search_str,
            "fields": [
                "suggest",
                "suggest._2gram",
                "suggest._3gram",
                # "suggest._index_prefix",
            ],
            "type": "bool_prefix",
        }
    }
    should_match_query = {
        "multi_match": {
            "query": search_str,
            "fields": [
                "suggest",
                "suggest._2gram",
                "suggest._3gram",
            ],
            "operator": "and",
            "type": "bool_prefix",
        }
    }

    # USE same query for both search + autocomplete for now
    # if is_auto_complete:
    #     match_query = {
    #         "multi_match": {
    #             "query": search_str,
    #             "fields": ["suggest", "suggest._2gram", "suggest._3gram"],
    #             "operator": "and",
    #             "type": "bool_prefix",
    #         }
    #     }

    base_tracks_query: Dict = {
        "size": limit,
        "from": offset,
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "must": [
                            match_query,
                            {"term": {"is_unlisted": {"value": False}}},
                            {"term": {"is_delete": False}},
                        ],
                        "must_not": [{"exists": {"field": "stem_of"}}],
                        "should": [
                            should_match_query,
                            # {"term": {"user.is_verified": {"value": True}}},
                        ],
                    }
                },
                "functions": [
                    {
                        "field_value_factor": {
                            "field": "repost_count",
                            "factor": 1.2,
                            "modifier": "log1p",
                        }
                    },
                    {
                        "field_value_factor": {
                            "field": "user.follower_count",
                            "factor": 1.2,
                            "modifier": "log1p",
                        }
                    },
                ],
            }
        },
    }

    print(json.dumps(base_tracks_query))

    base_users_query: Dict = {
        "size": limit,
        "from": offset,
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "must": [
                            match_query,
                            {"term": {"is_deactivated": {"value": False}}},
                        ],
                        "should": [
                            should_match_query,
                            {"term": {"is_verified": {"value": True}}},
                        ],
                    }
                },
                "field_value_factor": {
                    "field": "follower_count",
                    "factor": 1.2,
                    "modifier": "log1p",
                },
            }
        },
    }

    base_playlists_query: Dict = {
        "size": limit,
        "from": offset,
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "must": [
                            match_query,
                            {"term": {"is_private": {"value": False}}},
                            {"term": {"is_delete": False}},
                            {"term": {"is_album": {"value": False}}},
                        ],
                        "should": [
                            should_match_query,
                        ],
                    }
                },
                "field_value_factor": {
                    "field": "repost_count",
                    "factor": 1.2,
                    "modifier": "log1p",
                },
            }
        },
    }

    base_album_query: Dict = {
        "size": limit,
        "from": offset,
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "must": [
                            match_query,
                            {"term": {"is_private": {"value": False}}},
                            {"term": {"is_delete": False}},
                            {"term": {"is_album": {"value": True}}},
                        ],
                        "should": [
                            should_match_query,
                        ],
                    }
                },
                "field_value_factor": {
                    "field": "repost_count",
                    "factor": 1.2,
                    "modifier": "log1p",
                },
            }
        },
    }

    # tracks
    if do_tracks:
        if only_downloadable:
            base_tracks_query["query"]["function_score"]["query"]["bool"][
                "must"
            ].append(only_downloadable_term)

        track_search_query: List = [{"index": ES_TRACKS}, base_tracks_query]

        mdsl.extend(track_search_query)

        # saved tracks
        if current_user_id:
            saved_tracks_query = deepcopy(base_tracks_query)
            saved_tracks_query["query"]["function_score"]["query"]["bool"][
                "must"
            ].append(saved_term)

            mdsl.extend([{"index": ES_TRACKS}, saved_tracks_query])
    # users
    if do_users:
        mdsl.extend([{"index": ES_USERS}, base_users_query])
        if current_user_id:
            followed_users_query = deepcopy(base_users_query)
            followed_users_query["query"]["function_score"]["query"]["bool"][
                "must"
            ].extend(
                [
                    {
                        "terms": {
                            "_id": {
                                "index": ES_USERS,
                                "id": str(current_user_id),
                                "path": "following_ids",
                            },
                        }
                    }
                ]
            )

            mdsl.extend([{"index": ES_USERS}, followed_users_query])

    # playlists
    if do_playlists:
        playlist_search_query: List = [{"index": ES_PLAYLISTS}, base_playlists_query]
        mdsl.extend(playlist_search_query)

        # saved playlists
        if current_user_id:
            saved_playlist_search_query = deepcopy(base_playlists_query)
            saved_playlist_search_query["query"]["function_score"]["query"]["bool"][
                "must"
            ].append(saved_term)
            mdsl.extend([{"index": ES_PLAYLISTS}, saved_playlist_search_query])

    # albums
    if do_albums:
        album_search_query: List = [{"index": ES_PLAYLISTS}, base_album_query]
        mdsl.extend(album_search_query)

        # saved albums
        if current_user_id:
            saved_album_search_query = deepcopy(base_album_query)
            saved_album_search_query["query"]["function_score"]["query"]["bool"][
                "must"
            ].append(saved_term)
            mdsl.extend([{"index": ES_PLAYLISTS}, saved_album_search_query])

    mfound = esclient.msearch(searches=mdsl)

    tracks_response = []
    saved_tracks_response = []
    users_response = []
    followed_users_response = []
    playlists_response = []
    saved_playlists_response = []
    albums_response = []
    saved_albums_response = []

    item_keys = []
    user_ids = set()
    if current_user_id:
        user_ids.add(current_user_id)

    if do_tracks:
        tracks_response = pluck_hits(mfound["responses"].pop(0))
        for track in tracks_response:
            item_keys.append(item_key(track))
            user_ids.add(track["owner_id"])
        if current_user_id:
            saved_tracks_response = pluck_hits(mfound["responses"].pop(0))

    if do_users:
        users_response = pluck_hits(mfound["responses"].pop(0))
        for user in users_response:
            item_keys.append(item_key(user))
            user_ids.add(user["user_id"])
        if current_user_id:
            followed_users_response = pluck_hits(mfound["responses"].pop(0))

    if do_playlists:
        playlists_response = pluck_hits(mfound["responses"].pop(0))
        for playlist in playlists_response:
            item_keys.append(item_key(playlist))
            user_ids.add(playlist["playlist_owner_id"])
        if current_user_id:
            saved_playlists_response = pluck_hits(mfound["responses"].pop(0))

    if do_albums:
        albums_response = pluck_hits(mfound["responses"].pop(0))
        for album in albums_response:
            item_keys.append(item_key(album))
            user_ids.add(album["playlist_owner_id"])
        if current_user_id:
            saved_albums_response = pluck_hits(mfound["responses"].pop(0))

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
    hydrate_user(tracks_response, users_by_id)
    tracks_response = transform_tracks(tracks_response, users_by_id, current_user)
    hydrate_saves_reposts(tracks_response, follow_saves, follow_reposts)

    # users: finalize
    users_response = [
        extend_user(popuate_user_metadata_es(user, current_user))
        for user in users_response
    ]

    # playlists: finalize
    hydrate_saves_reposts(playlists_response, follow_saves, follow_reposts)
    hydrate_user(playlists_response, users_by_id)
    playlists_response = [
        extend_playlist(populate_track_or_playlist_metadata_es(item, current_user))
        for item in playlists_response
    ]
    return {
        "tracks": tracks_response,
        "saved_tracks": saved_tracks_response,
        "users": users_response,
        "followed_users": followed_users_response,
        "playlists": playlists_response,
        "saved_playlists": saved_playlists_response,
        "albums": albums_response,
        "saved_albums": saved_albums_response,
        # "elasticsearch_took": mfound["took"],
    }


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


# testing 1 2


def _print_test_search(args):
    print("\n\n==========", args)
    found = search_es_full(args)

    def print_tracks(title, tracks):
        print(f"\n[ {title} ]")
        for track in tracks:
            print(
                "   ",
                [
                    track["user"]["handle"],
                    track["user"]["name"],
                    track["title"],
                    track["repost_count"],
                    track["user"]["follower_count"],
                ],
            )

    def print_users(title, users):
        print(f"\n[ {title} ]")
        for x in users:
            print(
                "   ",
                [
                    x["handle"],
                    x["name"],
                    x["follower_count"],
                    x["is_verified"],
                ],
            )

    print_tracks("tracks", found["tracks"])
    print_tracks("saved tracks", found["saved_tracks"])
    print_users("users", found["users"])
    print_users("followed_users", found["followed_users"])


if __name__ == "__main__":
    # PYTHONPATH=. python3.9 src/queries/search_es.py

    _print_test_search(
        {
            "query": "isaac pho",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": True,
        }
    )
    _print_test_search(
        {
            "query": "isaac photo",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": False,
        }
    )
    _print_test_search(
        {
            "query": "RAC wat",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": True,
        }
    )
    _print_test_search(
        {
            "query": "RAC water",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": False,
        }
    )
    _print_test_search(
        {
            "query": "closer 2 u raymont",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": True,
        }
    )
    _print_test_search(
        {
            "query": "raymont",
            "limit": 4,
            "current_user_id": 1,
            "is_auto_complete": True,
        }
    )
