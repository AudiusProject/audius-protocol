import logging
from typing import Any, Dict, Optional

from src.api.v1.helpers import extend_playlist, extend_track, extend_user
from src.queries.get_feed_es import fetch_followed_saves_and_reposts, item_key
from src.queries.query_helpers import (
    _populate_gated_content_metadata,
    electronic_sub_genres,
)
from src.utils.db_session import get_db_read_replica
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_TRACKS,
    ES_USERS,
    get_esclient,
    pluck_hits,
    populate_track_or_playlist_metadata_es,
    populate_user_metadata_es,
)
from src.utils.hardcoded_data import genre_allowlist
from src.utils.hardcoded_data import moods as mood_allowlist

logger = logging.getLogger(__name__)

lowercase_to_capitalized_genre = {genre.lower(): genre for genre in genre_allowlist}


def get_capitalized_genre(genre):
    return lowercase_to_capitalized_genre.get(genre.lower())


def format_genres(g: list[str] | str | None):
    genres = g
    if isinstance(g, str):
        genres = [g]
    if not genres:
        return None

    capitalized_genres = [get_capitalized_genre(genre) for genre in genres]

    if "Electronic" in capitalized_genres:
        capitalized_genres += electronic_sub_genres

    return list(set(capitalized_genres))


lowercase_to_capitalized_mood = {mood.lower(): mood for mood in mood_allowlist}


def get_capitalized_mood(mood):
    return lowercase_to_capitalized_mood.get(mood.lower())


def format_moods(m: list[str] | str | None):
    moods = m
    if isinstance(m, str):
        moods = [m]
    if not moods:
        return None

    capitalized_moods = [get_capitalized_mood(mood) for mood in moods]

    return list(set(capitalized_moods))


def sharp_to_flat(key):
    sharp_to_flat_mapping = {
        "C sharp": "D flat",
        "D sharp": "E flat",
        "F sharp": "G flat",
        "G sharp": "A flat",
        "A sharp": "B flat",
    }

    # Split the key into root and type (major/minor)
    key_parts = key.split()

    if len(key_parts) == 2:
        key_root = key_parts[0]
        key_type = key_parts[1]
    if len(key_parts) == 3:
        key_root = key_parts[0] + " " + key_parts[1]
        key_type = key_parts[2]

    # Convert sharp keys to flat keys
    if key_root in sharp_to_flat_mapping:
        key_root = sharp_to_flat_mapping[key_root]

    return key_root + " " + key_type


def search_es_full(args: dict):
    esclient = get_esclient()
    if not esclient:
        raise Exception("esclient is None")

    search_str = (args.get("query", "") or "").strip()
    current_user_id = args.get("current_user_id")
    limit = args.get("limit", 10)
    offset = args.get("offset", 0)
    search_type = args.get("kind", "all")
    sort_method = args.get("sort_method", "relevant")

    genres = format_genres(args.get("genres", []))
    moods = format_moods(args.get("moods", []))
    bpm_min = args.get("bpm_min")
    bpm_max = args.get("bpm_max")
    keys = args.get("keys", [])

    only_downloadable = args.get("only_downloadable", False)
    include_purchaseable = args.get("include_purchaseable", False)
    only_verified = args.get("only_verified", False)
    only_with_downloads = args.get("only_with_downloads", False)
    only_purchaseable = args.get("only_purchaseable", False)

    do_tracks = search_type == "all" or search_type == "tracks"
    do_users = search_type == "all" or search_type == "users"
    do_playlists = search_type == "all" or search_type == "playlists"
    do_albums = search_type == "all" or search_type == "albums"

    is_auto_complete = args.get("is_auto_complete")

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
                    search_str=search_str,
                    tag_search="",
                    current_user_id=current_user_id,
                    must_saved=False,
                    only_downloadable=only_downloadable,
                    only_purchaseable=only_purchaseable,
                    include_purchaseable=include_purchaseable,
                    genres=genres,
                    moods=moods,
                    bpm_min=bpm_min,
                    bpm_max=bpm_max,
                    keys=keys,
                    only_with_downloads=only_with_downloads,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    # users
    if do_users:
        mdsl.extend(
            [
                {"index": ES_USERS},
                user_dsl(
                    search_str=search_str,
                    tag_search="",
                    current_user_id=current_user_id,
                    must_saved=False,
                    only_verified=only_verified,
                    genres=genres,
                    sort_method=sort_method,
                ),
            ]
        )

    # playlists
    if do_playlists:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                playlist_dsl(
                    search_str=search_str,
                    tag_search="",
                    current_user_id=current_user_id,
                    genres=genres,
                    moods=moods,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    # albums
    if do_albums:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                album_dsl(
                    search_str=search_str,
                    tag_search="",
                    current_user_id=current_user_id,
                    genres=genres,
                    moods=moods,
                    only_with_downloads=only_with_downloads,
                    only_purchaseable=only_purchaseable,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    mdsl_limit_offset(mdsl, limit, offset)
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

    if do_users:
        response["users"] = pluck_hits(mfound["responses"].pop(0))

    if do_playlists:
        response["playlists"] = pluck_hits(mfound["responses"].pop(0))

    if do_albums:
        response["albums"] = pluck_hits(mfound["responses"].pop(0))
    finalize_response(
        response, limit, current_user_id, is_auto_complete=is_auto_complete
    )
    return response


def format_keys(k: list[str] | str | None):
    if not k:
        return None
    elif isinstance(k, str):
        return [k]
    else:
        return k


def search_tags_es(args: dict):
    esclient = get_esclient()
    if not esclient:
        raise Exception("esclient is None")

    tag_search = args.get("query", "").strip()

    current_user_id = args.get("current_user_id")
    limit = args.get("limit", 10)
    offset = args.get("offset", 0)
    search_type = args.get("kind", "all")
    sort_method = args.get("sort_method", "relevant")

    genres = format_genres(args.get("genres", []))
    moods = format_moods(args.get("moods", []))
    bpm_min = args.get("bpm_min")
    bpm_max = args.get("bpm_max")
    keys = args.get("keys", [])

    only_downloadable = args.get("only_downloadable", False)
    include_purchaseable = args.get("include_purchaseable", False)
    only_verified = args.get("only_verified", False)
    only_with_downloads = args.get("only_with_downloads", False)
    only_purchaseable = args.get("only_purchaseable", False)

    do_tracks = search_type == "all" or search_type == "tracks"
    do_users = search_type == "all" or search_type == "users"
    do_playlists = search_type == "all" or search_type == "playlists"
    do_albums = search_type == "all" or search_type == "albums"

    do_tracks = search_type == "all" or search_type == "tracks"
    do_users = search_type == "all" or search_type == "users"
    do_playlists = search_type == "all" or search_type == "playlists"
    do_albums = search_type == "all" or search_type == "albums"

    mdsl: Any = []

    if do_tracks:
        mdsl.extend(
            [
                {"index": ES_TRACKS},
                track_dsl(
                    search_str="",
                    tag_search=tag_search,
                    current_user_id=current_user_id,
                    genres=genres,
                    moods=moods,
                    bpm_min=bpm_min,
                    bpm_max=bpm_max,
                    keys=keys,
                    must_saved=False,
                    only_downloadable=only_downloadable,
                    only_with_downloads=only_with_downloads,
                    only_purchaseable=only_purchaseable,
                    include_purchaseable=include_purchaseable,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    if do_users:
        mdsl.extend(
            [
                {"index": ES_USERS},
                user_dsl(
                    search_str="",
                    tag_search=tag_search,
                    current_user_id=current_user_id,
                    must_saved=False,
                    genres=genres,
                    only_verified=only_verified,
                    sort_method=sort_method,
                ),
            ]
        )

    # playlists
    if do_playlists:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                playlist_dsl(
                    search_str="",
                    tag_search=tag_search,
                    current_user_id=current_user_id,
                    genres=genres,
                    moods=moods,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    # albums
    if do_albums:
        mdsl.extend(
            [
                {"index": ES_PLAYLISTS},
                album_dsl(
                    search_str="",
                    tag_search=tag_search,
                    current_user_id=current_user_id,
                    genres=genres,
                    moods=moods,
                    only_with_downloads=only_with_downloads,
                    only_purchaseable=only_purchaseable,
                    sort_method=sort_method,
                    only_verified=only_verified,
                ),
            ]
        )

    mdsl_limit_offset(mdsl, limit, offset)
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

    if do_users:
        response["users"] = pluck_hits(mfound["responses"].pop(0))

    if do_playlists:
        response["playlists"] = pluck_hits(mfound["responses"].pop(0))

    if do_albums:
        response["albums"] = pluck_hits(mfound["responses"].pop(0))

    finalize_response(response, limit, current_user_id)
    return response


def mdsl_limit_offset(mdsl, limit, offset):
    # add size and limit with some over-fetching
    # for sake of reorder_users
    index_name = ""
    for dsl in mdsl:
        if "index" in dsl:
            index_name = dsl["index"]
            continue
        dsl["size"] = limit
        dsl["from"] = offset
        if index_name == ES_USERS:
            dsl["size"] = limit + 5


def finalize_response(
    response: Dict,
    limit: int,
    current_user_id: Optional[int],
    is_auto_complete=False,
):
    """Hydrates users and contextualizes results for current user (if applicable).
    Also removes extra indexed fields so as to match the fieldset from postgres.
    """
    esclient = get_esclient()
    if not esclient:
        raise Exception("esclient is None")

    # hydrate users, saves, reposts
    items = []
    user_ids = set()
    if current_user_id:
        user_ids.add(current_user_id)

    # collect keys for fetching
    for docs in response.values():
        for item in docs:
            items.append(item)
            user_ids.add(item.get("owner_id", item.get("playlist_owner_id")))

    # fetch users
    users_by_id = {}
    current_user = None

    if user_ids:
        ids = [str(id) for id in user_ids]
        users_mget = esclient.mget(index=ES_USERS, ids=ids)
        users_by_id = {d["_id"]: d["_source"] for d in users_mget["docs"] if d["found"]}
        if current_user_id:
            current_user = users_by_id.get(str(current_user_id))
        for id, user in users_by_id.items():
            users_by_id[id] = populate_user_metadata_es(user, current_user)

    # fetch followed saves + reposts
    if not is_auto_complete:
        (follow_saves, follow_reposts) = fetch_followed_saves_and_reposts(
            current_user, items
        )

    # tracks: finalize
    for k in ["tracks", "saved_tracks"]:
        if k not in response:
            continue
        tracks = response[k]
        hydrate_user(tracks, users_by_id)
        if not is_auto_complete:
            hydrate_saves_reposts(tracks, follow_saves, follow_reposts)
        response[k] = [map_track(track, current_user) for track in tracks]

        # batch populate gated track metadata
        db = get_db_read_replica()
        with db.scoped_session() as session:
            _populate_gated_content_metadata(session, response[k], current_user_id)

    # users: finalize
    for k in ["users", "followed_users"]:
        if k not in response:
            continue
        users = reorder_users(response[k])
        users = users[:limit]
        response[k] = [map_user(user, current_user) for user in users]

    # playlists: finalize
    for k in ["playlists", "saved_playlists", "albums", "saved_albums"]:
        if k not in response:
            continue
        playlists = response[k]
        if not is_auto_complete:
            hydrate_saves_reposts(playlists, follow_saves, follow_reposts)
        hydrate_user(playlists, users_by_id)
        response[k] = [map_playlist(playlist, current_user) for playlist in playlists]

        # batch populate gated playlist metadata
        db = get_db_read_replica()
        with db.scoped_session() as session:
            _populate_gated_content_metadata(session, response[k], current_user_id)

    return response


def base_match(search_str: str, operator="or", extra_fields=[], boost=1):
    return [
        {
            "multi_match": {
                "query": search_str,
                "fields": [
                    "suggest",
                    "suggest._2gram",
                    "suggest._3gram",
                    *extra_fields,
                ],
                "operator": operator,
                "type": "bool_prefix",
                "fuzziness": "AUTO",
                "boost": boost,
            }
        }
    ]


def be_saved(current_user_id):
    return {"term": {"saved_by": {"value": current_user_id, "boost": 4}}}


def be_reposted(current_user_id):
    return {"term": {"reposted_by": {"value": current_user_id, "boost": 4}}}


def be_followed(current_user_id):
    return {
        "terms": {
            "_id": {
                "index": ES_USERS,
                "id": str(current_user_id),
                "path": "following_ids",
            },
            "boost": 500,
        }
    }


def personalize_dsl(dsl, current_user_id, must_saved):
    if current_user_id and must_saved:
        dsl["must"].append(be_saved(current_user_id))

    if current_user_id:
        dsl["should"].append(be_saved(current_user_id))
        dsl["should"].append(be_reposted(current_user_id))


def default_function_score(dsl, ranking_field, factor=0.1):
    return {
        "query": {
            "function_score": {
                "query": {"bool": dsl},
                "field_value_factor": {
                    "field": ranking_field,
                    "factor": factor,
                    "modifier": "ln2p",
                },
                "boost_mode": "multiply",
            }
        }
    }


def track_dsl(
    search_str,
    tag_search,
    current_user_id,
    must_saved=False,
    genres=[],
    moods=[],
    bpm_min=None,
    bpm_max=None,
    keys=[],
    sort_method="relevant",
    only_downloadable=False,
    only_with_downloads=False,
    only_purchaseable=False,
    include_purchaseable=False,
    only_verified=False,
):
    dsl = {
        "must": [
            {"term": {"is_unlisted": {"value": False}}},
            {"term": {"is_delete": False}},
            {
                "bool": {
                    "should": [
                        *base_match(search_str),
                        {
                            "wildcard": {
                                "title": {
                                    "value": "*" + search_str + "*",
                                    "boost": 0.01,
                                    "case_insensitive": True,
                                }
                            }
                        },
                        {
                            "multi_match": {
                                "query": search_str,
                                "fields": ["title.searchable", "user.name.searchable"],
                                "type": "cross_fields",
                                "operator": "and",
                                "boost": len(search_str) * 0.5,
                            }
                        },
                        {
                            "term": {
                                "title": {
                                    "value": search_str.replace(" ", ""),
                                    "boost": len(search_str) * 0.5,
                                }
                            }
                        },
                        *[
                            {
                                "match": {
                                    "genre": {
                                        "query": search_str.title(),
                                        "boost": 20,
                                    }
                                }
                            }
                        ],
                        {
                            "match": {
                                "tag_list": {
                                    "query": search_str.replace(" ", ""),
                                    "boost": 0.1,
                                }
                            }
                        },
                        *[
                            {
                                "match": {
                                    "mood": {
                                        "query": search_str.title(),
                                        "boost": 0.5,
                                    }
                                }
                            }
                        ],
                    ],
                    "minimum_should_match": 1,
                }
            },
        ],
        "must_not": [
            {"exists": {"field": "stem_of"}},
            {"term": {"user.is_deactivated": {"value": True}}},
        ],
        "should": [
            *base_match(search_str, operator="and", boost=len(search_str)),
            {"term": {"user.is_verified": {"value": True}}},
        ],
        "filter": [],
    }

    if tag_search:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "tag_list": {
                                    "query": tag_search,
                                }
                            }
                        },
                    ],
                }
            }
        )

    if genres:
        dsl["filter"].append({"terms": {"genre": genres}})

    if moods:
        dsl["filter"].append({"terms": {"mood": moods}})

    if bpm_min:
        dsl["filter"].append({"range": {"bpm": {"gte": bpm_min}}})

    if bpm_max:
        dsl["filter"].append({"range": {"bpm": {"lte": bpm_max}}})

    if keys:
        mapped_keys = list(
            filter(None, [sharp_to_flat(key) for key in keys if key is not None])
        )

        if mapped_keys:
            dsl["filter"].append({"terms": {"musical_key": mapped_keys}})

    # Only include the track if it is downloadable
    if only_downloadable:
        dsl["must"].append({"term": {"downloadable": {"value": True}}})

    # Only include the track if it is downloadable OR has stems
    if only_with_downloads:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {"term": {"downloadable": {"value": True}}},
                        {"term": {"has_stems": {"value": True}}},
                    ]
                }
            }
        )

    if only_verified:
        dsl["must"].append({"term": {"user.is_verified": {"value": True}}})

    # Only include the track if it is purchaseable or has purchaseable stems/download
    if only_purchaseable:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {"term": {"purchaseable": {"value": True}}},
                        {
                            "bool": {
                                "must": [
                                    {
                                        "term": {
                                            "purchaseable_download": {"value": True}
                                        }
                                    },
                                    {
                                        "bool": {
                                            "should": [
                                                {
                                                    "term": {
                                                        "has_stems": {"value": True}
                                                    }
                                                },
                                                {
                                                    "term": {
                                                        "downloadable": {"value": True}
                                                    }
                                                },
                                            ]
                                        }
                                    },
                                ]
                            }
                        },
                    ]
                }
            }
        )

    if not include_purchaseable:
        dsl["must_not"].append({"term": {"purchaseable": {"value": True}}})

    personalize_dsl(dsl, current_user_id, must_saved)

    query = default_function_score(dsl, "repost_count")

    if sort_method == "recent":
        query["sort"] = [{"created_at": {"order": "desc"}}]
    elif sort_method == "popular":
        query["sort"] = [
            {
                "_script": {
                    "type": "number",
                    "script": {
                        "lang": "painless",
                        "source": """
                            double playCount = doc['play_count'].value;
                            double repostCount = doc['repost_count'].value;
                            double saveCount = doc['save_count'].value;
                            double followerCount = doc['user.follower_count'].value;
                            double socialScore = followerCount;
                            // Get the current time and updated_at time in milliseconds
                            long currentTime = new Date().getTime();
                            long createdAt = doc['created_at'].value.toInstant().toEpochMilli();

                            // Define time thresholds in milliseconds
                            long oneWeek = 7L * 24L * 60L * 60L * 1000L;
                            long oneMonth = 30L * 24L * 60L * 60L * 1000L;

                            // Calculate recency factor based on time thresholds
                            double recencyFactor;
                            long timeDiff = currentTime - createdAt;

                            if (timeDiff <= oneWeek) {
                                recencyFactor = 3.0;  // Most recent (week)
                            } else if (timeDiff <= oneMonth) {
                                recencyFactor = 2.0;  // Recent (month)
                            } else {
                                recencyFactor = 1.0;  // Older
                            }

                            // Calculate the trending score
                            return ((playCount * 0.4) + (repostCount * 0.3) + (saveCount * 0.2) + (socialScore * 0.1)) * recencyFactor;
                        """,
                    },
                    "order": "desc",
                }
            }
        ]

    return query


def user_dsl(
    search_str,
    tag_search,
    current_user_id,
    only_verified,
    must_saved=False,
    genres=[],
    sort_method="relevant",
):
    # must_search_str = search_str + " " + search_str.replace(" ", "")
    dsl = {
        "must": [
            {"term": {"is_deactivated": {"value": False}}},
            {
                "bool": {
                    "should": [
                        *base_match(
                            search_str,
                            extra_fields=["handle.searchable", "name.searchable"],
                            boost=len(search_str) * 0.1,
                        ),
                        {
                            "wildcard": {
                                "name": {
                                    "value": "*" + search_str + "*",
                                    "boost": 0.01,
                                    "case_insensitive": True,
                                }
                            }
                        },
                        {
                            "match": {
                                "name.searchable": {
                                    "query": search_str,
                                    "fuzziness": "AUTO",
                                    "boost": len(search_str) * 0.01,
                                }
                            }
                        },
                        (
                            {
                                "term": {
                                    "name": {
                                        "value": search_str.replace(" ", ""),
                                        "boost": len(search_str) * 0.5,
                                    }
                                }
                            }
                        ),
                        {
                            "term": (
                                {
                                    "handle": {
                                        "value": search_str.replace(" ", ""),
                                        "boost": len(search_str) * 0.5,
                                    }
                                }
                            )
                        },
                        {
                            "match": {
                                "tracks.genre": {
                                    "query": search_str.title(),
                                    "boost": 12,
                                }
                            }
                        },
                        {
                            "match": {
                                "tracks.tags": {
                                    "query": search_str.replace(" ", ""),
                                    "boost": 0.1,
                                }
                            }
                        },
                        {
                            "match": {
                                "tracks.mood": {
                                    "query": search_str.title(),
                                    "boost": 12,
                                }
                            }
                        },
                    ],
                    "minimum_should_match": 1,
                }
            },
        ],
        "must_not": [],
        "should": [
            *base_match(
                search_str,
                operator="and",
                extra_fields=["name"],
                boost=len(search_str) * 12,
            ),
            (
                {
                    "term": {
                        "name": {
                            "value": search_str,
                            "boost": (len(search_str) * 0.1) ** 2,
                        }
                    }
                }
            ),
            {"term": {"is_verified": {"value": True, "boost": 5}}},
        ],
    }

    if tag_search:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "tracks.tags": {
                                    "query": tag_search,
                                }
                            }
                        },
                    ],
                }
            }
        )

    if current_user_id and must_saved:
        dsl["must"].append(be_followed(current_user_id))

    if only_verified:
        dsl["must"].append({"term": {"is_verified": {"value": True}}})

    if current_user_id:
        dsl["should"].append(be_followed(current_user_id))

    query = {
        "query": {
            "function_score": {
                "functions": [
                    {
                        "filter": {"term": {"is_verified": True}},
                        "field_value_factor": {
                            "field": "follower_count",
                            "factor": 10,
                            "modifier": "ln2p",
                        },
                    },
                    {
                        "filter": {"term": {"is_verified": False}},
                        "field_value_factor": {
                            "field": "follower_count",
                            "factor": 0.1,
                            "modifier": "ln2p",
                        },
                    },
                ],
                "boost_mode": "multiply",
            }
        }
    }

    if genres:
        # At least one track genre must match
        dsl["must"].append({"terms": {"tracks.genre": genres}})
        # Logarithmically boost profiles with multiple tracks matching genre
        query["query"]["function_score"]["functions"].append(
            {
                "script_score": {
                    "script": {
                        "source": """
                            double matchedTracks = 0;
                            for (track in params['_source'].tracks) {
                                if (params.genres.contains(track.genre)) {
                                    matchedTracks++;
                                }
                            }
                            return Math.log(1 + matchedTracks) * params.boost;
                        """,
                        "params": {
                            "genres": genres,
                            "boost": 2,
                        },
                    }
                },
            }
        )

    # Set the dsl on the query object
    query["query"]["function_score"]["query"] = {"bool": dsl}

    if sort_method == "recent":
        query["sort"] = [{"created_at": {"order": "desc"}}]
    elif sort_method == "popular":
        query["sort"] = [
            {
                "_script": {
                    "type": "number",
                    "script": {
                        "lang": "painless",
                        "source": """
                            boolean isVerified = doc['is_verified'].value;
                            double followerCount = doc['follower_count'].value;
                            double verifiedMultiplier = isVerified ? 2 : 1;

                            // Calculate the popularity score
                            return verifiedMultiplier * (followerCount * 0.1);
                        """,
                    },
                    "order": "desc",
                }
            }
        ]

    return query


def base_playlist_dsl(
    search_str,
    tag_search,
    is_album,
    genres,
    moods,
    only_with_downloads,
    only_purchaseable,
    current_user_id,
    must_saved=False,
    sort_method="relevant",
    only_verified=False,
):
    dsl = {
        "must": [
            {
                "bool": {
                    "should": [
                        *base_match(search_str, boost=len(search_str)),
                        {
                            "wildcard": {
                                "playlist_name": {
                                    "value": "*" + search_str + "*",
                                    "boost": 0.01,
                                    "case_insensitive": True,
                                }
                            }
                        },
                        {
                            "multi_match": {
                                "query": search_str,
                                "fields": [
                                    "playlist_name.searchable",
                                    "user.name.searchable",
                                ],
                                "type": "cross_fields",
                                "operator": "or",
                                "boost": len(search_str) * 0.5,
                            }
                        },
                        {
                            "match": {
                                "tracks.tags": {
                                    "query": search_str.replace(" ", ""),
                                    "boost": 0.01,
                                }
                            }
                        },
                        {
                            "match": {
                                "tracks.genre": {
                                    "query": search_str.title(),
                                    "boost": 20,
                                }
                            }
                        },
                        {
                            "match": {
                                "tracks.mood": {
                                    "query": search_str.title(),
                                }
                            }
                        },
                    ],
                    "minimum_should_match": 1,
                }
            },
            {"term": {"is_private": {"value": False}}},
            {"term": {"is_delete": False}},
            {"term": {"is_album": {"value": is_album}}},
        ],
        "must_not": [
            {"term": {"user.is_deactivated": {"value": True}}},
        ],
        "should": [
            *base_match(search_str, operator="and", boost=len(search_str) * 10),
            {"term": {"user.is_verified": {"value": True, "boost": 3}}},
        ],
    }

    query = {
        "query": {
            "function_score": {
                "functions": [
                    {
                        "field_value_factor": {
                            "field": "repost_count",
                            "factor": 1000,
                            "modifier": "ln2p",
                        },
                    }
                ],
                "boost_mode": "multiply",
            }
        }
    }

    if tag_search:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "tracks.tags": {
                                    "query": tag_search.replace(" ", ""),
                                }
                            }
                        },
                    ],
                }
            }
        )

    if genres:
        # At least one track genre must match
        dsl["must"].append({"terms": {"tracks.genre": genres}})
        # Logarithmically boost profiles with multiple tracks matching genre
        query["query"]["function_score"]["functions"].append(
            {
                "script_score": {
                    "script": {
                        "source": """
                            double matchedTracks = 0;
                            for (track in params['_source'].tracks) {
                                if (params.genres.contains(track.genre)) {
                                    matchedTracks++;
                                }
                            }
                            return Math.log(1 + matchedTracks) * params.boost;
                        """,
                        "params": {
                            "genres": genres,
                            "boost": 2,
                        },
                    }
                },
            }
        )

    if only_with_downloads:
        dsl["must"].append(
            {
                "bool": {
                    "should": [
                        {"term": {"tracks.downloadable": {"value": True}}},
                        {"term": {"tracks.has_stems": {"value": True}}},
                    ]
                }
            }
        )

    if only_purchaseable:
        dsl["must"].append({"term": {"purchaseable": {"value": True}}})

    if only_verified:
        dsl["must"].append({"term": {"user.is_verified": {"value": True}}})

    if moods:
        capitalized_moods = list(
            filter(
                None,
                [get_capitalized_mood(mood) for mood in moods if mood is not None],
            )
        )
        if capitalized_moods:
            # At least one track moods must match
            dsl["must"].append({"terms": {"tracks.mood": capitalized_moods}})
            # Logarithmically boost profiles with multiple tracks matching mood
            query["query"]["function_score"]["functions"].append(
                {
                    "script_score": {
                        "script": {
                            "source": """
                                double matchedTracks = 0;
                                for (track in params['_source'].tracks) {
                                    if (params.moods.contains(track.mood)) {
                                        matchedTracks++;
                                    }
                                }
                                return Math.log(1 + matchedTracks) * params.boost;
                            """,
                            "params": {
                                "moods": capitalized_moods,
                                "boost": 2,
                            },
                        }
                    },
                }
            )

    personalize_dsl(dsl, current_user_id, must_saved)

    # Set the dsl on the query object
    query["query"]["function_score"]["query"] = {"bool": dsl}

    if sort_method == "recent":
        query["sort"] = [{"updated_at": {"order": "desc"}}]
    elif sort_method == "popular":
        query["sort"] = [
            {
                "_script": {
                    "type": "number",
                    "script": {
                        "lang": "painless",
                        "source": """
                            double repostCount = doc['repost_count'].value;
                            double saveCount = doc['save_count'].value;
                            double followerCount = doc['user.follower_count'].value;
                            double socialScore = followerCount;
                            // Get the current time and updated_at time in milliseconds
                            long currentTime = new Date().getTime();
                            long updatedAt = doc['updated_at'].value.toInstant().toEpochMilli();

                            // Define time thresholds in milliseconds
                            long oneWeek = 7L * 24L * 60L * 60L * 1000L;
                            long oneMonth = 30L * 24L * 60L * 60L * 1000L;

                            // Calculate recency factor based on time thresholds
                            double recencyFactor;
                            long timeDiff = currentTime - updatedAt;

                            if (timeDiff <= oneWeek) {
                                recencyFactor = 3.0;  // Most recent (week)
                            } else if (timeDiff <= oneMonth) {
                                recencyFactor = 2.0;  // Recent (month)
                            } else {
                                recencyFactor = 1.0;  // Older
                            }

                            // Calculate the trending score
                            return ((repostCount * 0.3) + (saveCount * 0.2) + (socialScore * 0.1)) * recencyFactor;
                        """,
                    },
                    "order": "desc",
                }
            }
        ]

    return query


def playlist_dsl(
    search_str,
    tag_search,
    current_user_id,
    must_saved=False,
    genres=[],
    moods=[],
    sort_method="relevant",
    only_verified=False,
):
    return base_playlist_dsl(
        search_str,
        tag_search,
        False,
        genres,
        moods,
        False,
        False,
        current_user_id,
        must_saved,
        sort_method,
        only_verified,
    )


def album_dsl(
    search_str,
    tag_search,
    current_user_id,
    only_with_downloads,
    only_purchaseable,
    must_saved=False,
    genres=[],
    moods=[],
    sort_method="relevant",
    only_verified=False,
):
    return base_playlist_dsl(
        search_str,
        tag_search,
        True,
        genres,
        moods,
        only_with_downloads,
        only_purchaseable,
        current_user_id,
        must_saved,
        sort_method,
        only_verified,
    )


def reorder_users(users):
    """Filters out users with copy cat names.
    e.g. if a verified deadmau5 is in the result set
    filter out all non-verified users with same name.

    Moves users without profile pictures to the end.
    """
    reserved = set()
    for user in users:
        if user["is_verified"]:
            reserved.add(lower_ascii_name(user["name"]))

    filtered = []
    users_without_photos = []
    for user in users:
        if not user["is_verified"] and lower_ascii_name(user["name"]) in reserved:
            continue
        if user["profile_picture_sizes"] or user["profile_picture"]:
            filtered.append(user)
        else:
            users_without_photos.append(user)

    return filtered + users_without_photos


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
        item["followee_reposts"] = follow_reposts[ik]
        item["followee_saves"] = follow_saves[ik]


def map_user(user, current_user):
    user = populate_user_metadata_es(user, current_user)
    user = extend_user(user)
    return user


def map_track(track, current_user):
    track = populate_track_or_playlist_metadata_es(track, current_user)
    track = extend_track(track)
    return track


def map_playlist(playlist, current_user):
    playlist = populate_track_or_playlist_metadata_es(playlist, current_user)
    playlist = extend_playlist(playlist)
    return playlist
