import time

from src.api.v1.helpers import extend_playlist
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_USERS,
    get_esclient,
    populate_user_metadata_es,
)


def get_top_playlists_es(kind, args):
    esclient = get_esclient()
    current_user_id = args.get("current_user_id")
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

    playlist_track_ids = set()
    exclude_playlist_ids = set()
    playlists = []
    for hit in found["hits"]["hits"]:
        p = hit["_source"]
        p["score"] = hit["_score"]
        playlists.append(p)
        track_ids = set(
            map(
                lambda t: t["track"],
                p.get("playlist_contents", {}).get("track_ids", []),
            )
        )
        playlist_track_ids = playlist_track_ids.union(track_ids)

    # exclude playlists with only hidden tracks
    db = get_db_read_replica()
    if playlists:
        with db.scoped_session() as session:
            hidden_playlist_track_ids = (
                session.query(Track.track_id)
                .filter(Track.track_id.in_(list(playlist_track_ids)))
                .filter(Track.is_unlisted == True)
                .all()
            )
            hidden_playlist_track_ids = [t[0] for t in hidden_playlist_track_ids]

    for playlist in playlists:
        track_ids = list(
            map(
                lambda t: t["track"],
                playlist.get("playlist_contents", {}).get("track_ids", []),
            )
        )
        if all([t in hidden_playlist_track_ids for t in track_ids]):
            exclude_playlist_ids.add(playlist["playlist_id"])

    playlists = [p for p in playlists if p["playlist_id"] not in exclude_playlist_ids]

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
