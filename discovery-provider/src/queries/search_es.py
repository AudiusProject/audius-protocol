from typing import Any

from src.utils.elasticdsl import ES_PLAYLISTS, ES_TRACKS, ES_USERS, esclient, pluck_hits


def search_es_full(args: dict):
    if not esclient:
        raise Exception("esclient is None")

    # taken from search_queries.py
    search_str = args.get("query")
    current_user_id = args.get("current_user_id")
    limit = args.get("limit")
    offset = args.get("offset")

    mdsl: Any = []

    # tracks
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
                                    {"term": {"saved_by": {"value": current_user_id}}},
                                    {
                                        "term": {
                                            "reposted_by": {"value": current_user_id}
                                        }
                                    },
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

    # users
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
                                    {"term": {"saved_by": {"value": current_user_id}}},
                                    {
                                        "term": {
                                            "reposted_by": {"value": current_user_id}
                                        }
                                    },
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
    found_tracks = mfound["responses"].pop(0)
    found_users = mfound["responses"].pop(0)
    found_playlists = mfound["responses"].pop(0)

    return {
        "tracks": pluck_hits(found_tracks),
        "users": pluck_hits(found_users),
        "playlists": pluck_hits(found_playlists),
    }
