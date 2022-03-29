import datetime
from collections import defaultdict

from flask import request
from sqlalchemy import and_, desc, func, or_
from src import api_helpers
from src.models import Follow, Playlist, Repost, RepostType, SaveType, Track
from src.queries import response_name_constants
from src.queries.get_unpopulated_tracks import get_unpopulated_tracks
from src.queries.query_helpers import (
    get_pagination_vars,
    get_users_by_id,
    get_users_ids,
    paginate_query,
    populate_playlist_metadata,
    populate_track_metadata,
)
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.utils.elasticdsl import esclient, hits, omit_indexed_fields

trackDedupeMaxMinutes = 10


def get_feed(args):
    skip_es = request.args.get("es") == "0"
    (limit, _) = get_pagination_vars()
    if skip_es:
        return _get_feed(args)
    else:
        return _es_get_feed(args, limit)

    # try:
    #     return _es_get_feed(args, limit)
    # except:
    #     return _get_feed(args)


def _es_get_feed(args, limit=10):
    current_user_id = str(args.get("user_id"))
    # feed_filter = args.get("filter")
    # load_reposts = feed_filter in ["repost", "all"]
    # tracks_only = args.get("tracks_only", False)

    mdsl = [
        {"index": "reposts"},
        {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "user_id": {
                                    "index": "users",
                                    "id": current_user_id,
                                    "path": "following_ids",
                                },
                            }
                        },
                        {"term": {"is_delete": False}},
                    ]
                }
            },
            # here doing some over-fetching to de-dupe later
            # to approximate min_created_at + group by in SQL.
            # could also do some kind of bucket aggregation + top hits
            # to do a better approximation...
            "size": limit * 3,
            "sort": {"created_at": "desc"},
        },
        {"index": "tracks"},
        {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "owner_id": {
                                    "index": "users",
                                    "id": current_user_id,
                                    "path": "following_ids",
                                },
                            },
                        },
                        {"term": {"is_unlisted": False}},
                        {"term": {"is_delete": False}},
                    ]
                }
            },
            "size": limit,
            "sort": {"created_at": "desc"},
        },
        {"index": "playlists"},
        {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "owner_id": {
                                    "index": "users",
                                    "id": current_user_id,
                                    "path": "following_ids",
                                },
                            },
                        },
                        {"term": {"is_private": False}},
                        {"term": {"is_delete": False}},
                    ]
                }
            },
            "size": limit,
            "sort": {"created_at": "desc"},
        },
    ]

    founds = esclient.msearch(searches=mdsl)
    for found in founds["responses"]:
        print("took:", found["took"])

    (reposts, tracks, playlists) = [hits(r) for r in founds["responses"]]

    # track timestamps and duplicates
    seen = set()
    unsorted_feed = []

    for playlist in playlists:
        playlist["item_key"] = item_key(playlist)
        seen.add(playlist["item_key"])
        # add playlist tracks to seen?
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

    has_reposts = sorted(
        unsorted_feed,
        key=lambda entry: entry["created_at"],
        reverse=True,
    )
    has_reposts = has_reposts[0:limit]

    # fetch underlying item for reposts
    mget_reposts = []
    for r in has_reposts:
        if r.get("repost_type") == "track":
            mget_reposts.append({"_index": "tracks", "_id": r["repost_item_id"]})
        elif r.get("repost_type") == "playlist":
            mget_reposts.append({"_index": "playlists", "_id": r["repost_item_id"]})

    reposted_docs = esclient.mget(docs=mget_reposts)
    keyed_reposts = {}
    for doc in reposted_docs["docs"]:
        if not doc["found"]:
            # MISSING: track or playlist for repost??
            # when can this happen?  a repost for an item not in the tracks or playlists
            # probably if a track is unlisted / deleted, and thus removed from the
            # tracks / playlists index?
            # To match existing postgres behavior, probably need to index deleted docs
            # instead of removing from index
            print("---------------- NOT FOUND", doc["_index"], doc["_id"])
            continue
        s = doc["_source"]
        s["item_key"] = item_key(s)
        keyed_reposts[s["item_key"]] = s

    # replace repost with underlying items
    sorted_feed = []
    for x in has_reposts:
        if "repost_type" not in x:
            x["activity_timestamp"] = x["created_at"]
            sorted_feed.append(x)
        else:
            # gotcha 2: strings vs int ids
            k = x["item_key"]
            if k not in keyed_reposts:
                # MISSING: track or playlist for repost??
                # from above
                print("missing", k)
                continue
            item = keyed_reposts[k]
            item["activity_timestamp"] = x["created_at"]
            sorted_feed.append(item)

    # attach users
    user_id_list = get_users_ids(sorted_feed)
    print("---------------", current_user_id)
    user_list = esclient.mget(index="users", ids=user_id_list)
    user_by_id = {d["_id"]: d["_source"] for d in user_list["docs"] if d["found"]}
    for item in sorted_feed:
        # gotcha: es ids must be strings, but our ids are ints...
        uid = str(item.get("playlist_owner_id", item.get("owner_id")))
        item["user"] = omit_indexed_fields(user_by_id[uid])

    # add context: followee_reposts, followee_saves
    item_keys = [i["item_key"] for i in sorted_feed]
    mdsl = [
        {"index": "reposts"},
        {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "user_id": {
                                    "index": "users",
                                    "id": current_user_id,
                                    "path": "following_ids",
                                },
                            }
                        },
                        {"terms": {"item_key": item_keys}},
                        {"term": {"is_delete": False}},
                    ]
                }
            },
            "size": limit * 20,  # how mutch to overfetch?
            "sort": {"created_at": "desc"},
        },
        {"index": "saves"},
        {
            "query": {
                "bool": {
                    "must": [
                        {
                            "terms": {
                                "user_id": {
                                    "index": "users",
                                    "id": current_user_id,
                                    "path": "following_ids",
                                },
                            }
                        },
                        {"terms": {"item_key": item_keys}},
                        {"term": {"is_delete": False}},
                    ]
                }
            },
            "size": limit * 20,  # how much to overfetch?
            "sort": {"created_at": "desc"},
        },
    ]

    founds = esclient.msearch(searches=mdsl)

    (reposts, saves) = [hits(r) for r in founds["responses"]]

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
        return "playlist:" + str(item["playlist_id"])
    else:
        raise Exception("item_key unknown type")


def _get_feed(args):
    feed_results = []
    db = get_db_read_replica()

    feed_filter = args.get("filter")
    # Allow for fetching only tracks
    tracks_only = args.get("tracks_only", False)

    followee_user_ids = args.get("followee_user_ids", [])

    # Current user - user for whom feed is being generated
    current_user_id = args.get("user_id")
    with db.scoped_session() as session:
        # Generate list of users followed by current user, i.e. 'followees'
        if not followee_user_ids:
            followee_user_ids = (
                session.query(Follow.followee_user_id)
                .filter(
                    Follow.follower_user_id == current_user_id,
                    Follow.is_current == True,
                    Follow.is_delete == False,
                )
                .all()
            )
            followee_user_ids = [f[0] for f in followee_user_ids]

        # Fetch followee creations if requested
        if feed_filter in ["original", "all"]:
            if not tracks_only:
                # Query playlists posted by followees, sorted and paginated by created_at desc
                created_playlists_query = (
                    session.query(Playlist)
                    .filter(
                        Playlist.is_current == True,
                        Playlist.is_delete == False,
                        Playlist.is_private == False,
                        Playlist.playlist_owner_id.in_(followee_user_ids),
                    )
                    .order_by(desc(Playlist.created_at))
                )
                created_playlists = paginate_query(created_playlists_query, False).all()

                # get track ids for all tracks in playlists
                playlist_track_ids = set()
                for playlist in created_playlists:
                    for track in playlist.playlist_contents["track_ids"]:
                        playlist_track_ids.add(track["track"])

                # get all track objects for track ids
                playlist_tracks = get_unpopulated_tracks(session, playlist_track_ids)
                playlist_tracks_dict = {
                    track["track_id"]: track for track in playlist_tracks
                }

                # get all track ids that have same owner as playlist and created in "same action"
                # "same action": track created within [x time] before playlist creation
                tracks_to_dedupe = set()
                for playlist in created_playlists:
                    for track_entry in playlist.playlist_contents["track_ids"]:
                        track = playlist_tracks_dict.get(track_entry["track"])
                        if not track:
                            return api_helpers.error_response(
                                "Something caused the server to crash."
                            )
                        max_timedelta = datetime.timedelta(
                            minutes=trackDedupeMaxMinutes
                        )
                        if (
                            (track["owner_id"] == playlist.playlist_owner_id)
                            and (track["created_at"] <= playlist.created_at)
                            and (
                                playlist.created_at - track["created_at"]
                                <= max_timedelta
                            )
                        ):
                            tracks_to_dedupe.add(track["track_id"])
                tracks_to_dedupe = list(tracks_to_dedupe)
            else:
                # No playlists to consider
                tracks_to_dedupe = []
                created_playlists = []

            # Query tracks posted by followees, sorted & paginated by created_at desc
            # exclude tracks that were posted in "same action" as playlist
            created_tracks_query = (
                session.query(Track)
                .filter(
                    Track.is_current == True,
                    Track.is_delete == False,
                    Track.is_unlisted == False,
                    Track.stem_of == None,
                    Track.owner_id.in_(followee_user_ids),
                    Track.track_id.notin_(tracks_to_dedupe),
                )
                .order_by(desc(Track.created_at))
            )
            created_tracks = paginate_query(created_tracks_query, False).all()

            # extract created_track_ids and created_playlist_ids
            created_track_ids = [track.track_id for track in created_tracks]
            created_playlist_ids = [
                playlist.playlist_id for playlist in created_playlists
            ]

        # Fetch followee reposts if requested
        if feed_filter in ["repost", "all"]:
            # query items reposted by followees, sorted by oldest followee repost of item;
            # paginated by most recent repost timestamp
            repost_subquery = session.query(Repost).filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.user_id.in_(followee_user_ids),
            )
            # exclude items also created by followees to guarantee order determinism, in case of "all" filter
            if feed_filter == "all":
                repost_subquery = repost_subquery.filter(
                    or_(
                        and_(
                            Repost.repost_type == RepostType.track,
                            Repost.repost_item_id.notin_(created_track_ids),
                        ),
                        and_(
                            Repost.repost_type != RepostType.track,
                            Repost.repost_item_id.notin_(created_playlist_ids),
                        ),
                    )
                )
            repost_subquery = repost_subquery.subquery()

            repost_query = (
                session.query(
                    repost_subquery.c.repost_item_id,
                    repost_subquery.c.repost_type,
                    func.min(repost_subquery.c.created_at).label("min_created_at"),
                )
                .group_by(
                    repost_subquery.c.repost_item_id, repost_subquery.c.repost_type
                )
                .order_by(desc("min_created_at"))
            )
            followee_reposts = paginate_query(repost_query, False).all()

            # build dict of track_id / playlist_id -> oldest followee repost timestamp from followee_reposts above
            track_repost_timestamp_dict = {}
            playlist_repost_timestamp_dict = {}
            for (
                repost_item_id,
                repost_type,
                oldest_followee_repost_timestamp,
            ) in followee_reposts:
                if repost_type == RepostType.track:
                    track_repost_timestamp_dict[
                        repost_item_id
                    ] = oldest_followee_repost_timestamp
                elif repost_type in (RepostType.playlist, RepostType.album):
                    playlist_repost_timestamp_dict[
                        repost_item_id
                    ] = oldest_followee_repost_timestamp

            # extract reposted_track_ids and reposted_playlist_ids
            reposted_track_ids = list(track_repost_timestamp_dict.keys())
            reposted_playlist_ids = list(playlist_repost_timestamp_dict.keys())

            # Query tracks reposted by followees
            reposted_tracks = session.query(Track).filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(reposted_track_ids),
            )
            # exclude tracks already fetched from above, in case of "all" filter
            if feed_filter == "all":
                reposted_tracks = reposted_tracks.filter(
                    Track.track_id.notin_(created_track_ids)
                )
            reposted_tracks = reposted_tracks.order_by(desc(Track.created_at)).all()

            if not tracks_only:
                # Query playlists reposted by followees, excluding playlists already fetched from above
                reposted_playlists = session.query(Playlist).filter(
                    Playlist.is_current == True,
                    Playlist.is_delete == False,
                    Playlist.is_private == False,
                    Playlist.playlist_id.in_(reposted_playlist_ids),
                )
                # exclude playlists already fetched from above, in case of "all" filter
                if feed_filter == "all":
                    reposted_playlists = reposted_playlists.filter(
                        Playlist.playlist_id.notin_(created_playlist_ids)
                    )
                reposted_playlists = reposted_playlists.order_by(
                    desc(Playlist.created_at)
                ).all()
            else:
                reposted_playlists = []

        if feed_filter == "original":
            tracks_to_process = created_tracks
            playlists_to_process = created_playlists
        elif feed_filter == "repost":
            tracks_to_process = reposted_tracks
            playlists_to_process = reposted_playlists
        else:
            tracks_to_process = created_tracks + reposted_tracks
            playlists_to_process = created_playlists + reposted_playlists

        tracks = helpers.query_result_to_list(tracks_to_process)
        playlists = helpers.query_result_to_list(playlists_to_process)

        # define top level feed activity_timestamp to enable sorting
        # activity_timestamp: created_at if item created by followee, else reposted_at
        for track in tracks:
            if track["owner_id"] in followee_user_ids:
                track[response_name_constants.activity_timestamp] = track["created_at"]
            else:
                track[
                    response_name_constants.activity_timestamp
                ] = track_repost_timestamp_dict[track["track_id"]]
        for playlist in playlists:
            if playlist["playlist_owner_id"] in followee_user_ids:
                playlist[response_name_constants.activity_timestamp] = playlist[
                    "created_at"
                ]
            else:
                playlist[
                    response_name_constants.activity_timestamp
                ] = playlist_repost_timestamp_dict[playlist["playlist_id"]]

        # bundle peripheral info into track and playlist objects
        track_ids = list(map(lambda track: track["track_id"], tracks))
        playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id,
        )

        # build combined feed of tracks and playlists
        unsorted_feed = tracks + playlists

        # sort feed based on activity_timestamp
        sorted_feed = sorted(
            unsorted_feed,
            key=lambda entry: entry[response_name_constants.activity_timestamp],
            reverse=True,
        )

        # truncate feed to requested limit
        (limit, _) = get_pagination_vars()
        feed_results = sorted_feed[0:limit]
        if "with_users" in args and args.get("with_users") != False:
            user_id_list = get_users_ids(feed_results)
            users = get_users_by_id(session, user_id_list)
            for result in feed_results:
                if "playlist_owner_id" in result:
                    user = users[result["playlist_owner_id"]]
                    if user:
                        result["user"] = user
                elif "owner_id" in result:
                    user = users[result["owner_id"]]
                    if user:
                        result["user"] = user

    return feed_results


if __name__ == "__main__":
    # PYTHONPATH=. ES_URL=http://localhost:9200 python src/queries/get_feed.py
    stuff = _es_get_feed({"user_id": 1})
    # stuff = esclient.mget(index="users", ids=["1", "2", "3", "4", "5"])
    # print(stuff)
    for item in stuff:
        print(item.get("title") or item.get("playlist_name"))
