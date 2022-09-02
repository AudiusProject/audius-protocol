from src.queries.query_helpers import _populate_premium_track_metadata, get_users_ids
from src.utils.db_session import get_db_read_replica
from src.utils.elasticdsl import (
    ES_PLAYLISTS,
    ES_REPOSTS,
    ES_SAVES,
    ES_TRACKS,
    ES_USERS,
    esclient,
    pluck_hits,
    populate_track_or_playlist_metadata_es,
    populate_user_metadata_es,
)


def get_feed_es(args, limit=10):
    current_user_id = str(args.get("user_id"))
    feed_filter = args.get("filter", "all")
    load_reposts = feed_filter in ["repost", "all"]
    load_orig = feed_filter in ["original", "all"]

    mdsl = []

    if load_reposts:
        mdsl.extend(
            [
                {"index": ES_REPOSTS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup(current_user_id, "user_id"),
                                {"term": {"is_delete": False}},
                                {"range": {"created_at": {"gte": "now-30d"}}},
                            ]
                        }
                    },
                    # here doing some over-fetching to de-dupe later
                    # to approximate min_created_at + group by in SQL.
                    "size": 0,
                    "aggs": {
                        "item_key": {
                            "terms": {"field": "item_key", "size": 500},
                            "aggs": {
                                "min_created_at": {"min": {"field": "created_at"}}
                            },
                        }
                    },
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
                                following_ids_terms_lookup(current_user_id, "owner_id"),
                                {"term": {"is_unlisted": False}},
                                {"term": {"is_delete": False}},
                            ],
                            "must_not": [{"exists": {"field": "stem_of"}}],
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
                                following_ids_terms_lookup(
                                    current_user_id, "playlist_owner_id"
                                ),
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

    repost_agg = []
    tracks = []
    playlists = []

    founds = esclient.msearch(searches=mdsl)

    if load_reposts:
        repost_agg = founds["responses"].pop(0)
        repost_agg = repost_agg["aggregations"]["item_key"]["buckets"]
        for bucket in repost_agg:
            bucket["created_at"] = bucket["min_created_at"]["value_as_string"]
            bucket["item_key"] = bucket["key"]
        repost_agg.sort(key=lambda b: b["min_created_at"]["value"])

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
    for r in repost_agg:
        k = r["key"]
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

    # take a "soft limit" here.  Some tracks / reposts might get filtered out below
    # if is_delete
    sorted_with_reposts = sorted_with_reposts[0 : limit * 2]

    mget_reposts = []
    keyed_reposts = {}

    # hydrate repost stubs (agg bucket results)
    # min_created_at indicates a repost stub
    for r in sorted_with_reposts:
        if "min_created_at" not in r:
            continue
        (kind, id) = r["key"].split(":")
        if kind == "track":
            mget_reposts.append({"_index": ES_TRACKS, "_id": id})
        else:
            mget_reposts.append({"_index": ES_PLAYLISTS, "_id": id})

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
            if (
                s.get("is_delete")
                or s.get("is_private")
                or s.get("is_unlisted")
                or s.get("stem_of")
            ):
                # MISSING: skip reposts for delete, private, unlisted, stem_of
                # this is why we took soft limit above
                continue
            keyed_reposts[s["item_key"]] = s

    # replace repost with underlying items
    sorted_feed = []
    for x in sorted_with_reposts:
        if "min_created_at" not in x:
            x["activity_timestamp"] = x["created_at"]
            sorted_feed.append(x)
        else:
            k = x["key"]
            if k not in keyed_reposts:
                # MISSING: see above
                continue
            item = keyed_reposts[k]
            item["activity_timestamp"] = x["min_created_at"]["value_as_string"]
            sorted_feed.append(item)

    # attach users
    user_id_set = set([str(id) for id in get_users_ids(sorted_feed)])
    user_id_set.add(current_user_id)
    user_list = esclient.mget(index=ES_USERS, ids=list(user_id_set))
    user_by_id = {d["_id"]: d["_source"] for d in user_list["docs"] if d["found"]}

    # populate_user_metadata_es:
    current_user = user_by_id.get(str(current_user_id))
    for id, user in user_by_id.items():
        user_by_id[id] = populate_user_metadata_es(user, current_user)

    for item in sorted_feed:
        # GOTCHA: es ids must be strings, but our ids are ints...
        uid = str(item.get("playlist_owner_id", item.get("owner_id")))
        item["user"] = user_by_id[uid]

    # add context: followee_reposts, followee_saves
    # currently this over-fetches because there is no per-item grouping
    # really it should use an aggregation with top hits
    # to bucket ~3 saves / reposts per item
    item_keys = [i["item_key"] for i in sorted_feed]

    (follow_saves, follow_reposts) = fetch_followed_saves_and_reposts(
        current_user_id, item_keys
    )

    # store items which are tracks to later batch populate their
    # premium track metadata (playlists are not yet supported)
    track_items = []

    for item in sorted_feed:
        item["followee_reposts"] = follow_reposts[item["item_key"]]
        item["followee_saves"] = follow_saves[item["item_key"]]

        # save_count was renamed to favorite_count when working on search...
        # but /feed still expects save_count
        if "favorite_count" in item:
            item["save_count"] = item["favorite_count"]

        # add to track items if item is a track
        if "track_id" in item:
            track_items.append(item)

    # populate metadata + remove extra fields from items
    sorted_feed = [
        populate_track_or_playlist_metadata_es(item, current_user)
        for item in sorted_feed
    ]

    # populate premium track metadata
    db = get_db_read_replica()
    with db.scoped_session() as session:
        _populate_premium_track_metadata(session, track_items, current_user["user_id"])

    return sorted_feed[0:limit]


def following_ids_terms_lookup(current_user_id, field):
    """
    does a "terms lookup" to query a field
    with the user_ids that the current user follows
    """
    return {
        "terms": {
            field: {
                "index": ES_USERS,
                "id": str(current_user_id),
                "path": "following_ids",
            },
        }
    }


def fetch_followed_saves_and_reposts(current_user_id, item_keys):
    follow_reposts = {k: [] for k in item_keys}
    follow_saves = {k: [] for k in item_keys}

    if not current_user_id or not item_keys:
        return (follow_saves, follow_reposts)

    save_repost_query = {
        "query": {
            "bool": {
                "must": [
                    following_ids_terms_lookup(current_user_id, "user_id"),
                    {"terms": {"item_key": item_keys}},
                    {"term": {"is_delete": False}},
                ]
            }
        },
        "collapse": {
            "field": "item_key",
            "inner_hits": {
                "name": "most_recent",
                "size": 5,
                "sort": [{"created_at": "desc"}],
            },
            "max_concurrent_group_searches": 4,
        },
        "sort": {"created_at": "desc"},
        "size": len(item_keys),
        "_source": False,
    }
    mdsl = [
        {"index": ES_REPOSTS},
        save_repost_query,
        {"index": ES_SAVES},
        save_repost_query,
    ]

    founds = esclient.msearch(searches=mdsl)
    collapsed_reposts = founds["responses"][0]["hits"]["hits"]
    collapsed_saves = founds["responses"][1]["hits"]["hits"]

    for group in collapsed_reposts:
        reposts = pluck_hits(group["inner_hits"]["most_recent"])
        item_key = reposts[0]["item_key"]
        follow_reposts[item_key] = reposts
    for group in collapsed_saves:
        saves = pluck_hits(group["inner_hits"]["most_recent"])
        item_key = saves[0]["item_key"]
        follow_saves[item_key] = saves

    return (follow_saves, follow_reposts)


def item_key(item):
    if "track_id" in item:
        return "track:" + str(item["track_id"])
    elif "playlist_id" in item:
        if item["is_album"]:
            return "album:" + str(item["playlist_id"])
        return "playlist:" + str(item["playlist_id"])
    elif "user_id" in item:
        return "user:" + str(item["user_id"])
    else:
        raise Exception("item_key unknown type")
