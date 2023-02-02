import time

from src.api.v1.helpers import extend_playlist
from src.queries.query_helpers import get_current_user_id
from src.utils.elasticdsl import (
    esclient,
    ES_PLAYLISTS,
    ES_USERS,
)


def get_top_playlists_es(kind, args):
    current_user_id = get_current_user_id(required=False)
    limit = args.get("limit", 16)
    is_album = kind == 'album'

    dsl = {
        "must": [
            {"term": {"is_private": {"value": False}}},
            {"term": {"is_delete": False}},
            {"term": {"is_album": {"value": is_album}}},
        ],
        "must_not": [],
        "should": []
    }

    mood = args.get('mood')
    if mood:
        dsl['must'].append({
            "term": {
                "tracks.mood": mood
            }
        })

    if args.get("filter") == 'followees':
        dsl['must'].append({
            "terms": {
                'playlist_owner_id': {
                    "index": ES_USERS,
                    "id": str(current_user_id),
                    "path": "following_ids",
                },
            }
        })

    # decay score
    # https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html#decay-functions-date-fields
    dsl = {
        "query": {
            "script_score": {
                "query": {"bool": dsl},
                "script": {
                    "source": "_score * doc['repost_count'].value * decayDateGauss(params.origin, params.scale, params.offset, params.decay, doc['created_at'].value)",
                    "params": {
                        "origin": str(round(time.time()*1000)),
                        "scale": "30d",
                        "offset": "0",
                        "decay": 0.5,
                    }
                },
            }
        }
    }

    # top playlists have large saved_by and reposted_by
    # exclude them from the result
    dsl['_source'] = {
        'exclude': ['saved_by', 'reposted_by']
    }

    found = esclient.search(index=ES_PLAYLISTS, query=dsl['query'], size=limit)

    playlists = []
    for hit in found["hits"]["hits"]:
        p = hit["_source"]
        p['score'] = hit['_score']
        playlists.append(p)

    # with users behavior
    user_id_set = set([str(p['playlist_owner_id']) for p in playlists])
    user_id_set.add(str(current_user_id))
    user_list = esclient.mget(index=ES_USERS, ids=list(user_id_set))
    user_by_id = {d["_id"]: d["_source"] for d in user_list["docs"] if d["found"]}

    # current_user = user_by_id.get(str(current_user_id))
    for p in playlists:
        p['user'] = user_by_id[str(p['playlist_owner_id'])]
        extend_playlist(p)

        # elsewhere we call:
        #   populate_track_or_playlist_metadata_es(p, current_user)
        # but we want to cache top playlists... 
        # and we source excluded saved_by and reposted_by
        # so we don't tailor to current_user here

        # also null out tracks
        p['tracks'] = None

    return playlists
