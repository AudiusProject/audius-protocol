import logging
from typing import Any

from src.utils.elasticdsl import ES_PLAYLISTS, ES_TRACKS, ES_USERS, esclient, pluck_hits
from src.utils.helpers import encode_int_id
from src.utils.spl_audio import to_wei

logger = logging.getLogger(__name__)


def search_es_full(args: dict):
    if not esclient:
        raise Exception("esclient is None")

    # taken from search_queries.py
    search_str = args.get("query")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")
    search_type = args.get("kind")

    mdsl: Any = []

    should_saved_or_reposted = []
    if current_user_id:
        should_saved_or_reposted = [
            {"term": {"saved_by": {"value": current_user_id}}},
            {"term": {"reposted_by": {"value": current_user_id}}},
        ]

    # tracks
    if search_type == "all" or search_type == "tracks":
        mdsl.extend(
            [
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
                                                    "artist.name",
                                                    "artist.handle",
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
        )
    if search_type == "users":
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
    if search_type == "playlists":
        mdsl.extend(
            [
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
        )

    mfound = esclient.msearch(searches=mdsl)
    plucked_tracks = pluck_hits(mfound["responses"].pop(0))
    tracks_response = transform_tracks(plucked_tracks)
    return {
        "tracks": tracks_response,
        "saved_tracks": [],
        # "users": pluck_hits(found_users),
        # "playlists": pluck_hits(found_playlists),
    }


def transform_tracks(tracks):
    for track in tracks:
        track["id"] = encode_int_id(track.pop("track_id"))
        track["user"]["id"] = encode_int_id(track["user"].pop("user_id"))
        track["user"]["total_balance"] = str(
            int(track["user"]["balance"])
            + int(track["user"]["associated_wallets_balance"])
            + to_wei(track["user"]["associated_sol_wallets_balance"])
            + to_wei(track["user"]["waudio_balance"])
        )

        track["user"][
            "does_follow_current_user"
        ] = False  # TODO get user following and set
        track["current_user_followee_follow_count"] = 0  # same
        track["does_current_user_follow"] = False

    return tracks
