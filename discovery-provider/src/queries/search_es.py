import logging
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
    offset = args.get("offset")
    search_type = args.get("kind", "all")
    do_tracks = search_type == "all" or search_type == "tracks"
    do_users = search_type == "all" or search_type == "users"
    do_playlists = search_type == "all" or search_type == "playlists"
    do_albums = search_type == "all" or search_type == "albums"

    mdsl: Any = []

    should_saved_or_reposted = []
    if current_user_id:
        should_saved_or_reposted = [
            {"term": {"saved_by": {"value": current_user_id}}},
            {"term": {"reposted_by": {"value": current_user_id}}},
        ]

    # tracks
    if do_tracks:
        track_search_query: List = [
            {"index": ES_TRACKS},
            {
                "size": limit,
                "from": offset,
                "query": {
                    "function_score": {
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "multi_match": {
                                            "query": search_str,
                                            "fields": [
                                                "title^2",
                                                "user.name",
                                                "user.handle",
                                            ],
                                            "type": "cross_fields",
                                        }
                                    },
                                    {"term": {"is_unlisted": {"value": False}}},
                                ],
                                "should": [
                                    *should_saved_or_reposted,
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
            },
        ]
        mdsl.extend(track_search_query)
        if current_user_id:
            saved_tracks_query = track_search_query[:]
            saved_tracks_query[1]["query"]["function_score"]["query"]["bool"][
                "must"
            ].extend(should_saved_or_reposted)

            mdsl.extend(saved_tracks_query)

    if do_users:
        mdsl.extend(
            [
                {"index": ES_USERS},
                {
                    "size": limit,
                    "from": offset,
                    "query": {
                        "function_score": {
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "multi_match": {
                                                "query": search_str,
                                                "fields": [
                                                    "name",
                                                    "handle",
                                                ],
                                                "type": "cross_fields",
                                            }
                                        },
                                        {"term": {"is_deactivated": {"value": False}}},
                                    ],
                                    "should": [
                                        {"term": {"is_verified": {"value": True}}},
                                        # promote users that current user follows
                                        # TODO: need to index user_id for this to work :(
                                        # _id would work except that following_ids is numbers and _id is string
                                        # {
                                        #     "terms": {
                                        #         "user_id": {
                                        #             "index": ES_USERS,
                                        #             "id": current_user_id,
                                        #             "path": "following_ids",
                                        #         },
                                        #     }
                                        # },
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
                },
            ]
        )
    if do_playlists:
        playlist_search_query: List = [
            {"index": ES_PLAYLISTS},
            {
                "size": limit,
                "from": offset,
                "query": {
                    "function_score": {
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "multi_match": {
                                            "query": search_str,
                                            "fields": [
                                                "playlist_name",
                                                "description",
                                            ],
                                            "type": "cross_fields",
                                        }
                                    },
                                    {"term": {"is_private": {"value": False}}},
                                    {"term": {"is_album": {"value": False}}},
                                ],
                                "should": [
                                    *should_saved_or_reposted,
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
            },
        ]
        mdsl.extend(playlist_search_query)
        if current_user_id:
            saved_playlist_search_query = playlist_search_query[:]
            saved_playlist_search_query[1]["query"]["function_score"]["query"]["bool"][
                "must"
            ].extend(should_saved_or_reposted)
            mdsl.extend(saved_playlist_search_query)

    if do_albums:
        album_search_query: List = [
            {"index": ES_PLAYLISTS},
            {
                "size": limit,
                "from": offset,
                "query": {
                    "function_score": {
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "multi_match": {
                                            "query": search_str,
                                            "fields": [
                                                "playlist_name",
                                                "description",
                                            ],
                                            "type": "cross_fields",
                                        }
                                    },
                                    {"term": {"is_private": {"value": False}}},
                                    {"term": {"is_album": {"value": True}}},
                                ],
                                "should": [
                                    *should_saved_or_reposted,
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
            },
        ]
        mdsl.extend(album_search_query)
        if current_user_id:
            saved_album_search_query = album_search_query[:]
            saved_album_search_query[1]["query"]["function_score"]["query"]["bool"][
                "must"
            ].extend(should_saved_or_reposted)
            mdsl.extend(saved_album_search_query)
            
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
    users_mget = esclient.mget(index=ES_USERS, ids=list(user_ids))
    users_by_id = {d["_id"]: d["_source"] for d in users_mget["docs"] if d["found"]}
    current_user = None
    if current_user_id:
        current_user = users_by_id.pop(str(current_user_id))
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
        "followed_users": [],
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
