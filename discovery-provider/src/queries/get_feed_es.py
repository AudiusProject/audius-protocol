from collections import defaultdict

from src.queries.query_helpers import get_users_ids
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_REPOSTS,
    ES_SAVES,
    ES_TRACKS,
    ES_USERS,
    esclient,
    omit_indexed_fields,
    pluck_hits,
    popuate_user_metadata_es,
)


def get_feed_es(args, limit=10):
    current_user_id = str(args.get("user_id"))
    feed_filter = args.get("filter", "all")
    load_reposts = feed_filter in ["repost", "all"]
    load_orig = feed_filter in ["original", "all"]

    mdsl = []

    def following_ids_terms_lookup(field):
        """
        does a "terms lookup" to query a field
        with the user_ids that the current user follows
        """
        return {
            "terms": {
                field: {
                    "index": ES_USERS,
                    "id": current_user_id,
                    "path": "following_ids",
                },
            }
        }

    if load_reposts:
        mdsl.extend(
            [
                {"index": ES_REPOSTS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup("user_id"),
                                {"term": {"is_delete": False}},
                            ]
                        }
                    },
                    # here doing some over-fetching to de-dupe later
                    # to approximate min_created_at + group by in SQL.
                    "size": limit * 10,
                    "sort": {"created_at": "desc"},
                },
            ]
        )

    if load_orig:
        mdsl.extend(
            [
                {"index": ES_TRACKS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup("owner_id"),
                                {"term": {"is_unlisted": False}},
                                {"term": {"is_delete": False}},
                            ]
                        }
                    },
                    "size": limit,
                    "sort": {"created_at": "desc"},
                },
                {"index": ES_PLAYLISTS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup("playlist_owner_id"),
                                {"term": {"is_private": False}},
                                {"term": {"is_delete": False}},
                            ]
                        }
                    },
                    "size": limit,
                    "sort": {"created_at": "desc"},
                },
            ]
        )

    reposts = []
    tracks = []
    playlists = []

    founds = esclient.msearch(searches=mdsl)

    if load_reposts:
        reposts = pluck_hits(founds["responses"].pop(0))

    if load_orig:
        tracks = pluck_hits(founds["responses"].pop(0))
        playlists = pluck_hits(founds["responses"].pop(0))

    # track timestamps and duplicates
    seen = set()
    unsorted_feed = []

    for playlist in playlists:
        # Q: should es-indexer set item_key on track / playlist too?
        #    instead of doing it dynamically here?
        playlist["item_key"] = item_key(playlist)
        seen.add(playlist["item_key"])
        # Q: should we add playlist tracks to seen?
        #    get_feed will "debounce" tracks in playlist
        unsorted_feed.append(playlist)

    for track in tracks:
        track["item_key"] = item_key(track)
        seen.add(track["item_key"])
        unsorted_feed.append(track)

    # remove duplicates from repost feed
    reposts.reverse()
    for r in reposts:
        k = r["item_key"]
        if k in seen:
            continue
        seen.add(k)
        unsorted_feed.append(r)

    # sorted feed with repost records
    # the repost records are stubs that we'll now "hydrate"
    # with the related track / playlist
    sorted_with_reposts = sorted(
        unsorted_feed,
        key=lambda entry: entry["created_at"],
        reverse=True,
    )
    sorted_with_reposts = sorted_with_reposts[0:limit]

    mget_reposts = []
    keyed_reposts = {}

    for r in sorted_with_reposts:
        if r.get("repost_type") == "track":
            mget_reposts.append({"_index": ES_TRACKS, "_id": r["repost_item_id"]})
        elif r.get("repost_type") in ["playlist", "album"]:
            mget_reposts.append({"_index": ES_PLAYLISTS, "_id": r["repost_item_id"]})

    if mget_reposts:
        reposted_docs = esclient.mget(docs=mget_reposts)
        for doc in reposted_docs["docs"]:
            if not doc["found"]:
                # MISSING: a repost for a track or playlist not in the index?
                # this should only happen if repost indexing is running ahead of track / playlist
                # should be transient... but should maybe still be tracked?
                continue
            s = doc["_source"]
            s["item_key"] = item_key(s)
            keyed_reposts[s["item_key"]] = s

    # replace repost with underlying items
    sorted_feed = []
    for x in sorted_with_reposts:
        if "repost_type" not in x:
            x["activity_timestamp"] = x["created_at"]
            sorted_feed.append(x)
        else:
            k = x["item_key"]
            if k not in keyed_reposts:
                # MISSING: see above
                continue
            item = keyed_reposts[k]
            item["activity_timestamp"] = x["created_at"]
            sorted_feed.append(item)

    # attach users
    user_id_list = [str(id) for id in get_users_ids(sorted_feed)]
    user_id_list.append(current_user_id)
    user_list = esclient.mget(index=ES_USERS, ids=user_id_list)
    user_by_id = {d["_id"]: d["_source"] for d in user_list["docs"] if d["found"]}

    # popuate_user_metadata_es:
    #   does_current_user_follow
    #   does_follow_current_user
    current_user = user_by_id.pop(str(current_user_id))
    for user in user_by_id.values():
        popuate_user_metadata_es(user, current_user)

    for item in sorted_feed:
        # GOTCHA: es ids must be strings, but our ids are ints...
        uid = str(item.get("playlist_owner_id", item.get("owner_id")))
        item["user"] = user_by_id[uid]

    # add context: followee_reposts, followee_saves
    item_keys = [i["item_key"] for i in sorted_feed]
    save_repost_query = {
        "query": {
            "bool": {
                "must": [
                    following_ids_terms_lookup("user_id"),
                    {"terms": {"item_key": item_keys}},
                    {"term": {"is_delete": False}},
                ]
            }
        },
        "size": limit * 20,  # how mutch to overfetch?
        "sort": {"created_at": "desc"},
    }
    mdsl = [
        {"index": ES_REPOSTS},
        save_repost_query,
        {"index": ES_SAVES},
        save_repost_query,
    ]

    founds = esclient.msearch(searches=mdsl)
    (reposts, saves) = [pluck_hits(r) for r in founds["responses"]]

    follow_reposts = defaultdict(list)
    follow_saves = defaultdict(list)

    for r in reposts:
        follow_reposts[r["item_key"]].append(r)
    for s in saves:
        follow_saves[s["item_key"]].append(s)

    for item in sorted_feed:
        item["followee_reposts"] = follow_reposts[item["item_key"]]
        item["followee_saves"] = follow_saves[item["item_key"]]

    # remove extra fields from items
    [omit_indexed_fields(item) for item in sorted_feed]

    return sorted_feed[0:limit]


def item_key(item):
    if "track_id" in item:
        return "track:" + str(item["track_id"])
    elif "playlist_id" in item:
        if item["is_album"]:
            return "album:" + str(item["playlist_id"])
        return "playlist:" + str(item["playlist_id"])
    else:
        raise Exception("item_key unknown type")
