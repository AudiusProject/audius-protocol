import time

from src.api.v1.helpers import extend_playlist
from src.queries.query_helpers import get_current_user_id
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_USERS,
    esclient,
    populate_user_metadata_es,
)


def get_top_playlists_es(kind, args):
    current_user_id = get_current_user_id(required=False)
    limit = args.get("limit", 16)
    is_album = kind == "album"

    dsl = {
        "must": [
            {"term": {"is_private": {"value": False}}},
            {"term": {"is_delete": False}},
            {"term": {"is_album": {"value": is_album}}},
        ],
        "must_not": [],
        "should": [],
    }

    mood = args.get("mood")
    if mood:
        dsl["must"].append({"term": {"dominant_mood": mood}})

    if args.get("filter") == "followees":
        dsl["must"].append(
            {
                "terms": {
                    "playlist_owner_id": {
                        "index": ES_USERS,
                        "id": str(current_user_id),
                        "path": "following_ids",
                    },
                }
            }
        )

    # decay score
    # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html#decay-functions-date-fields
    dsl = {
        "query": {
            "script_score": {
                "query": {"bool": dsl},
                "script": {
                    "source": "_score * doc['repost_count'].value * decayDateGauss(params.origin, params.scale, params.offset, params.decay, doc['created_at'].value)",
                    "params": {
                        "origin": str(round(time.time() * 1000)),
                        "scale": "30d",
                        "offset": "0",
                        "decay": 0.5,
                    },
                },
            }
        }
    }

    found = esclient.search(
        index=ES_PLAYLISTS,
        query=dsl["query"],
        size=limit,
        # omit unused fields from result
        source_excludes=["saved_by", "reposted_by", "tracks"],
    )

    playlists = []
    for hit in found["hits"]["hits"]:
        p = hit["_source"]
        p["score"] = hit["_score"]
        playlists.append(p)

    # with users behavior
    user_id_set = set([str(p["playlist_owner_id"]) for p in playlists])
    user_list = esclient.mget(index=ES_USERS, ids=list(user_id_set))
    user_by_id = {d["_id"]: d["_source"] for d in user_list["docs"] if d["found"]}

    for p in playlists:
        u = user_by_id[str(p["playlist_owner_id"])]
        # omit current_user because top playlists are cached across users
        p["user"] = populate_user_metadata_es(u, None)
        extend_playlist(p)

    return playlists
