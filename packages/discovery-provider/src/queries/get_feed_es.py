from src.queries.query_helpers import _populate_gated_track_metadata, get_users_ids
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


def get_feed_es(args, limit=10, offset=0):
    current_user_id = str(args.get("user_id"))
    feed_filter = args.get("filter", "all")
    load_reposts = feed_filter in ["repost", "all"]
    load_orig = feed_filter in ["original", "all"]

    explicit_ids = args.get("followee_user_ids", [])

    mdsl = []

    if load_reposts:
        mdsl.extend(
            [
                {"index": ES_REPOSTS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup(
                                    current_user_id, "user_id", explicit_ids
                                ),
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
                                following_ids_terms_lookup(
                                    current_user_id, "owner_id", explicit_ids
                                ),
                                {"term": {"is_unlisted": False}},
                                {"term": {"is_delete": False}},
                            ],
                            "must_not": [{"exists": {"field": "stem_of"}}],
                        }
                    },
                    "size": offset + limit,
                    "sort": {"created_at": "desc"},
                },
                {"index": ES_PLAYLISTS},
                {
                    "query": {
                        "bool": {
                            "must": [
                                following_ids_terms_lookup(
                                    current_user_id, "playlist_owner_id", explicit_ids
                                ),
                                {"term": {"is_private": False}},
                                {"term": {"is_delete": False}},
                            ]
                        }
                    },
                    "size": offset + limit,
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
        unsorted_feed.append(playlist)

        # add playlist track_ids to seen
        # if a user uploads an orig playlist or album
        # surpress individual tracks from said album appearing in feed
        for track in playlist["tracks"]:
            seen.add(item_key(track))

    for track in tracks:
        track["item_key"] = item_key(track)
        if track["item_key"] in seen:
            continue
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
    # if is_delete, or if track is collectible gated
    sorted_with_reposts = sorted_with_reposts[0 : (offset + limit) * 2]

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
                or s.get("is_stream_gated")
            ):
                # MISSING: skip reposts for delete, private, unlisted, stem_of, is_stream_gated
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

    (follow_saves, follow_reposts) = fetch_followed_saves_and_reposts(
        current_user, sorted_feed
    )

    for item in sorted_feed:
        item["followee_reposts"] = follow_reposts[item["item_key"]]
        item["followee_saves"] = follow_saves[item["item_key"]]

        # save_count was renamed to favorite_count when working on search...
        # but /feed still expects save_count
        if "favorite_count" in item:
            item["save_count"] = item["favorite_count"]

    # Filter out collectible gated tracks from feed.
    # The soft limit above allows us to filter out collectible gated tracks
    # and still be able to probabilistically satisfy the given limit later below.
    sorted_feed = list(
        filter(
            lambda item: ("stream_conditions" not in item)  # not a track
            or (item["stream_conditions"] is None)  # not a gated track
            or (
                "nft_collection" not in item["stream_conditions"]
            ),  # not a collectible gated track
            sorted_feed,
        )
    )

    # batch populate gated track metadata
    db = get_db_read_replica()
    with db.scoped_session() as session:
        track_items = list(filter(lambda item: "track_id" in item, sorted_feed))
        _populate_gated_track_metadata(session, track_items, current_user["user_id"])

    # populate metadata + remove extra fields from items
    sorted_feed = [
        populate_track_or_playlist_metadata_es(item, current_user)
        for item in sorted_feed
    ]

    return sorted_feed[offset:limit]


def following_ids_terms_lookup(current_user_id, field, explicit_ids=None):
    """
    does a "terms lookup" to query a field
    with the user_ids that the current user follows
    """
    if not explicit_ids:
        explicit_ids = []
    return {
        "bool": {
            "should": [
                {
                    "terms": {
                        field: {
                            "index": ES_USERS,
                            "id": str(current_user_id),
                            "path": "following_ids",
                        },
                    }
                },
                {"terms": {field: explicit_ids}},
            ]
        }
    }


def fetch_followed_saves_and_reposts(current_user, items):
    item_keys = [item_key(i) for i in items]
    follow_reposts = {k: [] for k in item_keys}
    follow_saves = {k: [] for k in item_keys}

    if not current_user or not item_keys:
        return (follow_saves, follow_reposts)

    mget_social_activity = []
    my_friends = set(current_user.get("following_ids", []))

    for item in items:
        key = item_key(item)
        saved_by = item.get("saved_by", [])
        reposted_by = item.get("reposted_by", [])

        save_friends = [f"{uid}:{key}" for uid in saved_by if uid in my_friends]
        for id in save_friends[0:5]:
            mget_social_activity.append({"_index": ES_SAVES, "_id": id})

        repost_friends = [f"{uid}:{key}" for uid in reposted_by if uid in my_friends]
        for id in repost_friends[0:5]:
            mget_social_activity.append({"_index": ES_REPOSTS, "_id": id})

    if mget_social_activity:
        social_activity = esclient.mget(docs=mget_social_activity)
        for doc in social_activity["docs"]:
            if not doc["found"]:
                print("elasticsearch not found", doc)
                continue
            s = doc["_source"]
            if "repost_type" in s:
                follow_reposts[s["item_key"]].append(s)
            else:
                follow_saves[s["item_key"]].append(s)

    return (follow_saves, follow_reposts)


def item_key(item):
    if "item_key" in item:
        return item["item_key"]
    elif "track_id" in item:
        return "track:" + str(item["track_id"])
    elif "playlist_id" in item:
        return "playlist:" + str(item["playlist_id"])
    elif "user_id" in item:
        return "user:" + str(item["user_id"])
    else:
        raise Exception("item_key unknown type")
