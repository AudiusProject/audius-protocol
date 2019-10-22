# Discovery Provider Social Feed Overview
# For a given user, current_user, we provide a feed of relevant content from around the audius network.
# This is generated in the following manner:
#   - Generate list of users followed by current_user, known as 'followees'
#   - Query all track and public playlist reposts from followees
#     - Generate list of reposted track ids and reposted playlist ids
#   - Query all track and public playlists reposted OR created by followees, ordered by timestamp
#     - At this point, 2 separate arrays one for playlists / one for tracks
#   - Query additional metadata around feed entries in each array, repost + save counts, user repost boolean
#   - Combine unsorted playlist and track arrays
#   - Sort combined results by 'timestamp' field and return
@bp.route("/feed", methods=("GET",))
def get_feed():
    feed_results = []
    db = get_db()

    # filter should be one of ["all", "reposts", "original"]
    if "filter" in request.args and request.args.get("filter") in ["all", "repost", "original"]:
        feedFilter = request.args.get("filter")
    else:
        return api_helpers.error_response("Invalid filter provided")


    # Current user - user for whom feed is being generated
    current_user_id = get_current_user_id()
    with db.scoped_session() as session:
        # Generate list of users followed by current user, i.e. 'followees'
        followee_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .all()
        )
        followee_user_ids = [f[0] for f in followee_user_ids]
        logger.warning(f"followee user ids {followee_user_ids}")

        # Query playlists posted by followees, sorted and paginated by created_at desc
        created_playlists_query = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.is_private == False,
                Playlist.playlist_owner_id.in_(followee_user_ids)
            )
            .order_by(desc(Playlist.created_at))
        )
        created_playlists = paginate_query(created_playlists_query, False).all()
        logger.warning(f"created_playlists: {list(map(lambda playlist: (playlist.playlist_id, playlist.playlist_owner_id), created_playlists))}")

        # get track ids for all tracks in playlists
        playlist_track_ids = set()
        for playlist in created_playlists:
            for track in playlist.playlist_contents["track_ids"]:
                playlist_track_ids.add(track["track"])

        # get all track objects for track ids
        playlist_tracks = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id.in_(playlist_track_ids)
            )
            .all()
        )
        playlist_tracks_dict = {track.track_id: track for track in playlist_tracks}

        # get all track ids that have same owner as playlist and created in "same action"
        # "same action": track created within [x time] before playlist creation
        tracks_to_dedupe = set()
        for playlist in created_playlists:
            for track_entry in playlist.playlist_contents["track_ids"]:
                track = playlist_tracks_dict.get(track_entry["track"])
                if not track:
                    return api_helpers.error_response("Something caused the server to crash.")
                max_timedelta = datetime.timedelta(minutes=trackDedupeMaxMinutes)
                if (track.owner_id == playlist.playlist_owner_id) and \
                    (track.created_at <= playlist.created_at) and \
                    (playlist.created_at - track.created_at <= max_timedelta):
                    tracks_to_dedupe.add(track.track_id)

        tracks_to_dedupe = list(tracks_to_dedupe)

        # Query tracks posted by followees, sorted & paginated by created_at desc
        # exclude tracks that were posted in "same action" as playlist
        created_tracks_query = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.owner_id.in_(followee_user_ids),
                Track.track_id.notin_(tracks_to_dedupe)
            )
            .order_by(desc(Track.created_at))
        )
        created_tracks = paginate_query(created_tracks_query, False).all()

        # extract created_track_ids and created_playlist_ids
        created_track_ids = [track.track_id for track in created_tracks]
        created_playlist_ids = [playlist.playlist_id for playlist in created_playlists]

        # only grab the reposts if the user asked for them
        if feedFilter in ["repost", "all"]:
            # query items reposted by followees, sorted by oldest followee repost of item;
            # paginated by most recent repost timestamp
            # exclude items also created by followees to guarantee order determinism
            repost_subquery = (
                session.query(Repost)
                .filter(
                    Repost.is_current == True,
                    Repost.is_delete == False,
                    Repost.user_id.in_(followee_user_ids),
                    or_(
                        and_(
                            Repost.repost_type == RepostType.track,
                            Repost.repost_item_id.notin_(created_track_ids)
                        ),
                        and_(
                            Repost.repost_type != RepostType.track,
                            Repost.repost_item_id.notin_(created_playlist_ids)
                        )
                    )
                )
                .subquery()
            )
            repost_query = (
                session.query(
                    repost_subquery.c.repost_item_id,
                    repost_subquery.c.repost_type,
                    func.min(repost_subquery.c.created_at).label("min_created_at")
                )
                .group_by(repost_subquery.c.repost_item_id, repost_subquery.c.repost_type)
                .order_by("min_created_at desc")
            )
            followee_reposts = paginate_query(repost_query, False).all()
            logger.warning(f"followee reposts: {list(map(lambda entry: (entry[0], entry[1]), followee_reposts))}")

            # build dict of track id -> oldest followee repost timestamp from followee_reposts above
            track_repost_timestamp_dict = {}
            playlist_repost_timestamp_dict = {}
            for (repost_item_id, repost_type, oldest_followee_repost_timestamp) in followee_reposts:
                if repost_type == RepostType.track:
                    track_repost_timestamp_dict[repost_item_id] = oldest_followee_repost_timestamp
                elif repost_type in (RepostType.playlist, RepostType.album):
                    playlist_repost_timestamp_dict[repost_item_id] = oldest_followee_repost_timestamp

            # extract reposted_track_ids and reposted_playlist_ids
            reposted_track_ids = list(track_repost_timestamp_dict.keys())
            reposted_playlist_ids = list(playlist_repost_timestamp_dict.keys())

            # Query tracks reposted by followees, excluding tracks already fetched from above
            reposted_tracks = (
                session.query(Track)
                .filter(
                    Track.is_current == True,
                    Track.track_id.in_(reposted_track_ids),
                    Track.track_id.notin_(created_track_ids)
                )
                .order_by(desc(Track.created_at))
                .all()
            )

            # Query playlists reposted by followees, excluding playlists already fetched from above
            reposted_playlists = (
                session.query(Playlist)
                .filter(
                    Playlist.is_current == True,
                    Playlist.is_private == False,
                    Playlist.playlist_id.in_(reposted_playlist_ids),
                    Playlist.playlist_id.notin_(created_playlist_ids)
                )
                .all()
            )

        # Combine created + reposted track and playlist lists
        if feedFilter == "original":
            tracks_to_process = created_tracks
            playlists_to_process = created_playlists
        elif feedFilter == "repost":
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
                track[response_name_constants.activity_timestamp] = track_repost_timestamp_dict[track["track_id"]]
        for playlist in playlists:
            if playlist["playlist_owner_id"] in followee_user_ids:
                playlist[response_name_constants.activity_timestamp] = playlist["created_at"]
            else:
                playlist[response_name_constants.activity_timestamp] = \
                    playlist_repost_timestamp_dict[playlist["playlist_id"]]

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
            current_user_id
        )

        # build combined feed of tracks and playlists
        unsorted_feed = tracks + playlists

        # sort feed based on activity_timestamp
        sorted_feed = sorted(
            unsorted_feed,
            key=lambda entry: entry[response_name_constants.activity_timestamp],
            reverse=True
        )
        tracks = list(map(lambda track: (track["track_id"], track["owner_id"]), tracks))
        playlists = list(map(lambda playlist: (playlist["playlist_id"], playlist["playlist_owner_id"]), playlists))
        sorted_feed2 = list(map(lambda entry: (entry["track_id"], entry["owner_id"], 'T') if "track_id" in entry else (entry["playlist_id"], entry["playlist_owner_id"], 'P'), sorted_feed))
        logger.warning(f"feed length {len(sorted_feed)}")
        logger.warning(f"tracks: {tracks}")
        logger.warning(f"playlists: {playlists}")
        logger.warning(f"sorted_feed: {sorted_feed2}")

        # truncate feed to requested limit
        (limit, _) = get_pagination_vars()
        feed_results = sorted_feed[0:limit]

    return api_helpers.success_response(feed_results)

@bp.route("/feed2", methods=("GET",))
def get_feed2():
    feed_results = []
    db = get_db()

    # filter should be one of ["all", "reposts", "original"]
    if "filter" in request.args and request.args.get("filter") in ["all", "repost", "original"]:
        feedFilter = request.args.get("filter")
    else:
        return api_helpers.error_response("Invalid filter provided")


    # Current user - user for whom feed is being generated
    current_user_id = get_current_user_id()
    with db.scoped_session() as session:
        # Generate list of users followed by current user, i.e. 'followees'
        followee_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .all()
        )
        followee_user_ids = [f[0] for f in followee_user_ids]
        logger.warning(f"followee user ids {followee_user_ids}")

        # Fetch followee creations if requested
        if feedFilter in ["original", "all"]:
            # Query playlists posted by followees, sorted and paginated by created_at desc
            created_playlists_query = (
                session.query(Playlist)
                .filter(
                    Playlist.is_current == True,
                    Playlist.is_private == False,
                    Playlist.playlist_owner_id.in_(followee_user_ids)
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
            playlist_tracks = (
                session.query(Track)
                .filter(
                    Track.is_current == True,
                    Track.track_id.in_(playlist_track_ids)
                )
                .all()
            )
            playlist_tracks_dict = {track.track_id: track for track in playlist_tracks}

            # get all track ids that have same owner as playlist and created in "same action"
            # "same action": track created within [x time] before playlist creation
            tracks_to_dedupe = set()
            for playlist in created_playlists:
                for track_entry in playlist.playlist_contents["track_ids"]:
                    track = playlist_tracks_dict.get(track_entry["track"])
                    if not track:
                        return api_helpers.error_response("Something caused the server to crash.")
                    max_timedelta = datetime.timedelta(minutes=trackDedupeMaxMinutes)
                    if (track.owner_id == playlist.playlist_owner_id) and \
                        (track.created_at <= playlist.created_at) and \
                        (playlist.created_at - track.created_at <= max_timedelta):
                        tracks_to_dedupe.add(track.track_id)

            tracks_to_dedupe = list(tracks_to_dedupe)

            # Query tracks posted by followees, sorted & paginated by created_at desc
            # exclude tracks that were posted in "same action" as playlist
            created_tracks_query = (
                session.query(Track)
                .filter(
                    Track.is_current == True,
                    Track.owner_id.in_(followee_user_ids),
                    Track.track_id.notin_(tracks_to_dedupe)
                )
                .order_by(desc(Track.created_at))
            )
            created_tracks = paginate_query(created_tracks_query, False).all()

            # extract created_track_ids and created_playlist_ids
            created_track_ids = [track.track_id for track in created_tracks]
            created_playlist_ids = [playlist.playlist_id for playlist in created_playlists]

        # Fetch followee reposts if requested
        if feedFilter in ["repost", "all"]:
            # query items reposted by followees, sorted by oldest followee repost of item;
            # paginated by most recent repost timestamp
            repost_subquery = (
                session.query(Repost)
                .filter(
                    Repost.is_current == True,
                    Repost.is_delete == False,
                    Repost.user_id.in_(followee_user_ids)
                )
            )
            # exclude items also created by followees to guarantee order determinism, in case of "all" filter
            if feedFilter == "all":
                repost_subquery = (
                    repost_subquery
                    .filter(
                        or_(
                            and_(
                                Repost.repost_type == RepostType.track,
                                Repost.repost_item_id.notin_(created_track_ids)
                            ),
                            and_(
                                Repost.repost_type != RepostType.track,
                                Repost.repost_item_id.notin_(created_playlist_ids)
                            )
                        )
                    )
                )
            repost_subquery = repost_subquery.subquery()

            repost_query = (
                session.query(
                    repost_subquery.c.repost_item_id,
                    repost_subquery.c.repost_type,
                    func.min(repost_subquery.c.created_at).label("min_created_at")
                )
                .group_by(repost_subquery.c.repost_item_id, repost_subquery.c.repost_type)
                .order_by("min_created_at desc")
            )
            followee_reposts = paginate_query(repost_query, False).all()
            logger.warning(f"followee reposts: {list(map(lambda entry: (entry[0], entry[1]), followee_reposts))}")

            # build dict of track_id / playlist_id -> oldest followee repost timestamp from followee_reposts above
            track_repost_timestamp_dict = {}
            playlist_repost_timestamp_dict = {}
            for (repost_item_id, repost_type, oldest_followee_repost_timestamp) in followee_reposts:
                if repost_type == RepostType.track:
                    track_repost_timestamp_dict[repost_item_id] = oldest_followee_repost_timestamp
                elif repost_type in (RepostType.playlist, RepostType.album):
                    playlist_repost_timestamp_dict[repost_item_id] = oldest_followee_repost_timestamp

            # extract reposted_track_ids and reposted_playlist_ids
            reposted_track_ids = list(track_repost_timestamp_dict.keys())
            reposted_playlist_ids = list(playlist_repost_timestamp_dict.keys())

            # Query tracks reposted by followees
            reposted_tracks = session.query(Track).filter(
                Track.is_current == True,
                Track.track_id.in_(reposted_track_ids)
            )
            # exclude tracks already fetched from above, in case of "all" filter
            if feedFilter == "all":
                reposted_tracks = reposted_tracks.filter(
                    Track.track_id.notin_(created_track_ids)
                )
            reposted_tracks = reposted_tracks.order_by(
                desc(Track.created_at)
            ).all()

            # Query playlists reposted by followees, excluding playlists already fetched from above
            reposted_playlists = session.query(Playlist).filter(
                Playlist.is_current == True,
                Playlist.is_private == False,
                Playlist.playlist_id.in_(reposted_playlist_ids)
            )
            # exclude playlists already fetched from above, in case of "all" filter
            if feedFilter == "all":
                reposted_playlists = reposted_playlists.filter(
                    Playlist.playlist_id.notin_(created_playlist_ids)
                )
            reposted_playlists = reposted_playlists.order_by(
                desc(Playlist.created_at)
            ).all()

        if feedFilter == "original":
            tracks_to_process = created_tracks
            playlists_to_process = created_playlists
        elif feedFilter == "repost":
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
                track[response_name_constants.activity_timestamp] = track_repost_timestamp_dict[track["track_id"]]
        for playlist in playlists:
            if playlist["playlist_owner_id"] in followee_user_ids:
                playlist[response_name_constants.activity_timestamp] = playlist["created_at"]
            else:
                playlist[response_name_constants.activity_timestamp] = \
                    playlist_repost_timestamp_dict[playlist["playlist_id"]]

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
            current_user_id
        )

        # build combined feed of tracks and playlists
        unsorted_feed = tracks + playlists

        # sort feed based on activity_timestamp
        sorted_feed = sorted(
            unsorted_feed,
            key=lambda entry: entry[response_name_constants.activity_timestamp],
            reverse=True
        )
        tracks = list(map(lambda track: (track["track_id"], track["owner_id"]), tracks))
        playlists = list(map(lambda playlist: (playlist["playlist_id"], playlist["playlist_owner_id"]), playlists))
        sorted_feed2 = list(map(lambda entry: (entry["track_id"], entry["owner_id"]) if "track_id" in entry else (entry["playlist_id"], entry["playlist_owner_id"]), sorted_feed))
        logger.warning(f"feed length {len(sorted_feed)}")
        logger.warning(f"tracks: {tracks}")
        logger.warning(f"playlists: {playlists}")
        logger.warning(f"sorted_feed: {sorted_feed2}")

        # truncate feed to requested limit
        (limit, _) = get_pagination_vars()
        feed_results = sorted_feed[0:limit]

    return api_helpers.success_response(feed_results)
