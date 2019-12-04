import logging # pylint: disable=C0302
import datetime
import sqlalchemy
from sqlalchemy import func, asc, desc, or_, and_
from sqlalchemy.orm import aliased

from flask import Blueprint, request

from src import api_helpers, exceptions
from src.models import User, Track, Repost, RepostType, Follow, Playlist, Save, SaveType
from src.utils import helpers
from src.utils.db_session import get_db
from src.queries import response_name_constants
from src.queries.query_helpers import get_current_user_id, parse_sort_param, populate_user_metadata, \
    populate_track_metadata, populate_playlist_metadata, get_repost_counts, get_save_counts, \
    get_pagination_vars, paginate_query

logger = logging.getLogger(__name__)
bp = Blueprint("queries", __name__)

trackDedupeMaxMinutes = 10


######## ROUTES ########


# Returns all users (paginated) with each user's follow count
# Optionally filters by is_creator, wallet, or user ids
@bp.route("/users", methods=("GET",))
def get_users():
    users = []
    db = get_db()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(User)
        # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
        base_query = base_query.filter(User.is_current == True, User.wallet != None, User.handle != None)

        # Process filters
        if "is_creator" in request.args:
            is_creator_flag = request.args.get("is_creator") == "true"
            base_query = base_query.filter(User.is_creator == is_creator_flag)
        if "wallet" in request.args:
            wallet = request.args.get("wallet")
            wallet = wallet.lower()
            if len(wallet) == 42:
                base_query = base_query.filter_by(wallet=wallet)
                base_query = base_query.order_by(asc(User.created_at))
            else:
                logger.warning("Invalid wallet length")
        if "handle" in request.args:
            handle = request.args.get("handle").lower()
            base_query = base_query.filter_by(handle_lc=handle)

        # Conditionally process an array of users
        if "id" in request.args:
            user_id_str_list = request.args.getlist("id")
            user_id_list = []
            try:
                user_id_list = [int(y) for y in user_id_str_list]
                base_query = base_query.filter(User.user_id.in_(user_id_list))
            except ValueError as e:
                raise exceptions.ArgumentError("Invalid value found in user id list", e)
        if "min_block_number" in request.args:
            min_block_number = request.args.get("min_block_number", type=int)
            base_query = base_query.filter(
                User.blocknumber >= min_block_number
            )
        users = paginate_query(base_query).all()
        users = helpers.query_result_to_list(users)

        user_ids = list(map(lambda user: user["user_id"], users))

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

    return api_helpers.success_response(users)


# Returns all tracks (paginated) with each track's repost count
# optionally filters by track ids
@bp.route("/tracks", methods=("GET",))
def get_tracks():
    tracks = []
    db = get_db()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(Track)
        base_query = base_query.filter(Track.is_current == True, Track.is_unlisted == False)

        # Conditionally process an array of tracks
        if "id" in request.args:
            # Retrieve argument from flask request object
            # Ensures empty parameters are not processed
            track_id_str_list = request.args.getlist("id")
            track_id_list = []
            try:
                track_id_list = [int(y) for y in track_id_str_list]
                # Update query with track_id list
                base_query = base_query.filter(Track.track_id.in_(track_id_list))
            except ValueError as e:
                logger.error("Invalid value found in track id list", exc_info=True)
                raise e

        # Allow filtering of tracks by a certain creator
        if "user_id" in request.args:
            user_id = request.args.get("user_id", type=int)
            base_query = base_query.filter(
                Track.owner_id == user_id
            )

        if "min_block_number" in request.args:
            min_block_number = request.args.get("min_block_number", type=int)
            base_query = base_query.filter(
                Track.blocknumber >= min_block_number
            )

        whitelist_params = ['created_at', 'create_date', 'release_date', 'blocknumber', 'track_id']
        base_query = parse_sort_param(base_query, Track, whitelist_params)
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)

        track_ids = list(map(lambda track: track["track_id"], tracks))

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    return api_helpers.success_response(tracks)


# Get all tracks matching a route_id and track_id.
# Expects a JSON body of shape:
#   { "tracks": [{ "id": number, "url_title": string, "handle": string }]}
@bp.route("/tracks_including_unlisted", methods=("POST",))
def get_tracks_including_unlisted():
    req_data = request.get_json()
    identifiers = req_data["tracks"]
    for i in identifiers:
        helpers.validate_arguments(i, ["handle", "id", "url_title"])

    db = get_db()
    with db.scoped_session() as session:
        base_query = session.query(Track)
        filter_cond = []

        # Create filter conditions as a list of `and` clauses
        for i in identifiers:
            route_id = helpers.create_track_route_id(i["url_title"], i["handle"])
            filter_cond.append(and_(Track.is_current == True, Track.route_id == route_id, Track.track_id == i["id"]))

        # Pass array of `and` clauses into an `or` clause as destrucutred *args
        base_query = base_query.filter(or_(*filter_cond))

        # Perform the query
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)
        track_ids = list(map(lambda track: track["track_id"], tracks))

        # Populate metadata
        current_user_id = get_current_user_id(required=False)
        extended_tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    return api_helpers.success_response(extended_tracks)


# Return playlist content in json form
# optional parameters playlist owner's user_id, playlist_id = []
@bp.route("/playlists", methods=("GET",))
def get_playlists():
    playlists = []
    current_user_id = get_current_user_id(required=False)
    filter_out_private_playlists = True

    db = get_db()
    with db.scoped_session() as session:
        try:
            playlist_query = (
                session.query(Playlist)
                .filter(Playlist.is_current == True)
            )

            # playlist ids filter if the optional query param is passed in
            if "playlist_id" in request.args:
                playlist_id_str_list = request.args.getlist("playlist_id")
                playlist_id_list = []
                try:
                    playlist_id_list = [int(y) for y in playlist_id_str_list]
                    playlist_query = playlist_query.filter(Playlist.playlist_id.in_(playlist_id_list))
                except ValueError as e:
                    raise exceptions.ArgumentError("Invalid value found in playlist id list", e)

            if "user_id" in request.args:
                user_id = request.args.get("user_id", type=int)
                # user id filter if the optional query param is passed in
                playlist_query = playlist_query.filter(
                    Playlist.playlist_owner_id == user_id
                )

                # if the current user is the same as the user passed in through the query param then we're trying
                # to get playlists for, check if the users are the same. if they are the same, the current user is
                # trying to request their own playlists, so allow them to see private playlists
                if current_user_id and user_id and (int(current_user_id) == int(user_id)):
                    filter_out_private_playlists = False

            if filter_out_private_playlists:
                playlist_query = playlist_query.filter(
                    Playlist.is_private == False
                )

            playlist_query = playlist_query.order_by(desc(Playlist.created_at))
            playlists = paginate_query(playlist_query).all()
            playlists = helpers.query_result_to_list(playlists)

            # retrieve playlist ids list
            playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

            current_user_id = get_current_user_id(required=False)

            # bundle peripheral info into playlist results
            playlists = populate_playlist_metadata(
                session,
                playlist_ids,
                playlists,
                [RepostType.playlist, RepostType.album],
                [SaveType.playlist, SaveType.album],
                current_user_id
            )

        except sqlalchemy.orm.exc.NoResultFound:
            pass

    return api_helpers.success_response(playlists)


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
    # empty filter value results in "all"
    if "filter" in request.args and request.args.get("filter") in ["all", "repost", "original"]:
        feed_filter = request.args.get("filter")
    else:
        feed_filter = "all"

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

        # Fetch followee creations if requested
        if feed_filter in ["original", "all"]:
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
                    Track.is_unlisted == False,
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
                    Track.is_unlisted == False,
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
        if feed_filter in ["repost", "all"]:
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
            if feed_filter == "all":
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
                Track.is_unlisted == False,
                Track.track_id.in_(reposted_track_ids)
            )
            # exclude tracks already fetched from above, in case of "all" filter
            if feed_filter == "all":
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
            if feed_filter == "all":
                reposted_playlists = reposted_playlists.filter(
                    Playlist.playlist_id.notin_(created_playlist_ids)
                )
            reposted_playlists = reposted_playlists.order_by(
                desc(Playlist.created_at)
            ).all()

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

        # truncate feed to requested limit
        (limit, _) = get_pagination_vars()
        feed_results = sorted_feed[0:limit]

    return api_helpers.success_response(feed_results)


# user repost feed steps
# - get all reposts by user
# - get all track and public playlist reposts by user, ordered by timestamp
# - get additional metadata for each track/playlist: save count, repost count, current_user_reposted, followee_reposts
# -   (if current_user == user, skip current_user_reposted check and set all to true)
# - combine unsorted playlist and track arrays
# - sort combined results by activity_timestamp field and return
@bp.route("/feed/reposts/<int:user_id>", methods=("GET",))
def get_repost_feed_for_user(user_id):
    feed_results = {}
    db = get_db()
    with db.scoped_session() as session:
        # query all reposts by user
        repost_query = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.user_id == user_id
            )
            .order_by(desc(Repost.created_at))
        )
        reposts = paginate_query(repost_query).all()

        # get track reposts from above
        track_reposts = [r for r in reposts if r.repost_type == RepostType.track]

        # get reposted track ids
        repost_track_ids = [r.repost_item_id for r in track_reposts]

        # get playlist reposts from above
        playlist_reposts = [
            r for r in reposts
            if r.repost_type == RepostType.playlist or r.repost_type == RepostType.album
        ]

        # get reposted playlist ids
        repost_playlist_ids = [r.repost_item_id for r in playlist_reposts]

        track_reposts = helpers.query_result_to_list(track_reposts)
        playlist_reposts = helpers.query_result_to_list(playlist_reposts)

        # build track/playlist id --> repost dict from repost lists
        track_repost_dict = {repost["repost_item_id"] : repost for repost in track_reposts}
        playlist_repost_dict = {repost["repost_item_id"] : repost for repost in playlist_reposts}

        # query tracks for repost_track_ids
        track_query = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.is_unlisted == False,
                Track.track_id.in_(repost_track_ids)
            )
            .order_by(desc(Track.created_at))
        )
        tracks = paginate_query(track_query).all()
        tracks = helpers.query_result_to_list(tracks)

        # get track ids
        track_ids = [track["track_id"] for track in tracks]

        # query playlists for repost_playlist_ids
        playlist_query = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.is_private == False,
                Playlist.playlist_id.in_(repost_playlist_ids)
            )
            .order_by(desc(Playlist.created_at))
        )
        playlists = paginate_query(playlist_query).all()
        playlists = helpers.query_result_to_list(playlists)

        # get playlist ids
        playlist_ids = [playlist["playlist_id"] for playlist in playlists]

        # get repost counts by track and playlist IDs
        repost_counts = get_repost_counts(session, False, True, track_ids + playlist_ids, None)
        track_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type == RepostType.track
        }
        playlist_repost_counts = {
            repost_item_id: repost_count
            for (repost_item_id, repost_count, repost_type) in repost_counts
            if repost_type in (RepostType.playlist, RepostType.album)
        }

        # get save counts for tracks and playlists
        save_counts = get_save_counts(session, False, True, track_ids + playlist_ids, None)
        track_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type == SaveType.track
        }
        playlist_save_counts = {
            save_item_id: save_count
            for (save_item_id, save_count, save_type) in save_counts
            if save_type in (SaveType.playlist, SaveType.album)
        }

        current_user_id = get_current_user_id(required=False)
        requested_user_is_current_user = False
        user_reposted_track_ids = {}
        user_reposted_playlist_ids = {}
        user_saved_track_dict = {}
        user_saved_playlist_dict = {}
        followees_track_repost_dict = {}
        followees_playlist_repost_dict = {}
        if current_user_id:
            # if current user = user_id, skip current_user_reposted queries and default to true
            if current_user_id == user_id:
                requested_user_is_current_user = True
            else:
                user_reposted_query = (
                    session.query(Repost.repost_item_id, Repost.repost_type)
                    .filter(
                        Repost.is_current == True,
                        Repost.is_delete == False,
                        Repost.user_id == current_user_id,
                        or_(Repost.repost_item_id.in_(track_ids),
                            Repost.repost_item_id.in_(playlist_ids))
                    )
                    .all()
                )

                # generate dictionary of track id --> current user reposted status
                user_reposted_track_ids = {
                    r[0] : True
                    for r in user_reposted_query if r[1] == RepostType.track
                }

                # generate dictionary of playlist id --> current user reposted status
                user_reposted_playlist_ids = {
                    r[0] : True
                    for r in user_reposted_query if r[1] == RepostType.album or r[1] == RepostType.playlist
                }

            # build dict of tracks and playlists that current user has saved

            #   - query saves by current user from relevant tracks/playlists
            user_saved_query = (
                session.query(Save.save_item_id, Save.save_type)
                .filter(
                    Save.is_current == True,
                    Save.is_delete == False,
                    Save.user_id == current_user_id,
                    or_(Save.save_item_id.in_(track_ids),
                        Save.save_item_id.in_(playlist_ids))
                )
                .all()
            )
            #   - build dict of track id --> current user save status
            user_saved_track_dict = {
                save[0]: True
                for save in user_saved_query if save[1] == SaveType.track
            }
            #   - build dict of playlist id --> current user save status
            user_saved_playlist_dict = {
                save[0]: True
                for save in user_saved_query if save[1] == SaveType.playlist or save[1] == SaveType.album
            }

            # query current user's followees
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

            # query all followees' reposts
            followee_repost_query = (
                session.query(Repost)
                .filter(
                    Repost.is_current == True,
                    Repost.is_delete == False,
                    Repost.user_id.in_(followee_user_ids),
                    or_(Repost.repost_item_id.in_(repost_track_ids),
                        Repost.repost_item_id.in_(repost_playlist_ids))
                )
                .order_by(desc(Repost.created_at))
            )
            followee_reposts = paginate_query(followee_repost_query).all()
            followee_reposts = helpers.query_result_to_list(followee_reposts)

            # build dict of track id --> reposts from followee track reposts
            for repost in followee_reposts:
                if repost["repost_type"] == RepostType.track:
                    if repost["repost_item_id"] not in followees_track_repost_dict:
                        followees_track_repost_dict[repost["repost_item_id"]] = []
                    followees_track_repost_dict[repost["repost_item_id"]].append(repost)

            # build dict of playlist id --> reposts from followee playlist reposts
            for repost in followee_reposts:
                if (repost["repost_type"] == RepostType.playlist or repost["repost_type"] == RepostType.album):
                    if repost["repost_item_id"] not in followees_playlist_repost_dict:
                        followees_playlist_repost_dict[repost["repost_item_id"]] = []
                    followees_playlist_repost_dict[repost["repost_item_id"]].append(repost)

        # populate metadata for track entries
        for track in tracks:
            track[response_name_constants.repost_count] = track_repost_counts.get(track["track_id"], 0)
            track[response_name_constants.save_count] = track_save_counts.get(track["track_id"], 0)
            track[response_name_constants.has_current_user_reposted] = (
                True if requested_user_is_current_user
                else user_reposted_track_ids.get(track["track_id"], False)
            )
            track[response_name_constants.has_current_user_saved] = user_saved_track_dict.get(track["track_id"], False)
            track[response_name_constants.followee_reposts] = followees_track_repost_dict.get(track["track_id"], [])
            track[response_name_constants.activity_timestamp] = track_repost_dict[track["track_id"]]["created_at"]

        for playlist in playlists:
            playlist[response_name_constants.repost_count] = playlist_repost_counts.get(playlist["playlist_id"], 0)
            playlist[response_name_constants.save_count] = playlist_save_counts.get(playlist["playlist_id"], 0)
            playlist[response_name_constants.has_current_user_reposted] = (
                True if requested_user_is_current_user
                else user_reposted_playlist_ids.get(playlist["playlist_id"], False)
            )
            playlist[response_name_constants.has_current_user_saved] = \
                user_saved_playlist_dict.get(playlist["playlist_id"], False)
            playlist[response_name_constants.followee_reposts] = \
                followees_playlist_repost_dict.get(playlist["playlist_id"], [])
            playlist[response_name_constants.activity_timestamp] = \
                playlist_repost_dict[playlist["playlist_id"]]["created_at"]

        unsorted_feed = tracks + playlists

        # sort feed by repost timestamp desc
        feed_results = sorted(
            unsorted_feed, key=lambda entry: entry[response_name_constants.activity_timestamp], reverse=True)

    return api_helpers.success_response(feed_results)


# intersection of user1's followers and user2's followees
# get intersection of users that follow followeeUserId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
@bp.route("/users/intersection/follow/<int:followee_user_id>/<int:follower_user_id>", methods=("GET",))
def get_follow_intersection_users(followee_user_id, follower_user_id):
    users = []
    db = get_db()
    with db.scoped_session() as session:
        query = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                User.user_id.in_(
                    session.query(Follow.follower_user_id)
                    .filter(
                        Follow.followee_user_id == followee_user_id,
                        Follow.is_current == True,
                        Follow.is_delete == False
                    )
                    .intersect(
                        session.query(Follow.followee_user_id)
                        .filter(
                            Follow.follower_user_id == follower_user_id,
                            Follow.is_current == True,
                            Follow.is_delete == False
                        )
                    )
                )
            )
        )
        users = paginate_query(query).all()
        users = helpers.query_result_to_list(users)
        user_ids = [user[response_name_constants.user_id] for user in users]

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

        # order by follower_count desc
        users.sort(
            key=lambda user: user[response_name_constants.follower_count],
            reverse=True
        )

    return api_helpers.success_response(users)


# get intersection of users that have reposted repostTrackId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
# repostTrackId = track that is reposted; repostUserId = user that reposted track
@bp.route("/users/intersection/repost/track/<int:repost_track_id>/<int:follower_user_id>", methods=("GET",))
def get_track_repost_intersection_users(repost_track_id, follower_user_id):
    users = []
    db = get_db()
    with db.scoped_session() as session:
        # ensure track_id exists
        track_entry = session.query(Track).filter(
            Track.track_id == repost_track_id,
            Track.is_current == True
        ).first()
        if track_entry is None:
            return api_helpers.error_response('Resource not found for provided track id', 404)

        query = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                User.user_id.in_(
                    session.query(Repost.user_id)
                    .filter(
                        Repost.repost_item_id == repost_track_id,
                        Repost.repost_type == RepostType.track,
                        Repost.is_current == True,
                        Repost.is_delete == False
                    )
                    .intersect(
                        session.query(Follow.followee_user_id)
                        .filter(
                            Follow.follower_user_id == follower_user_id,
                            Follow.is_current == True,
                            Follow.is_delete == False
                        )
                    )
                )
            )
        )
        users = paginate_query(query).all()
        users = helpers.query_result_to_list(users)

    return api_helpers.success_response(users)


# get intersection of users that have reposted repostPlaylistId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
# repostPlaylistId = playlist that is reposted; repostUserId = user that reposted playlist
@bp.route("/users/intersection/repost/playlist/<int:repost_playlist_id>/<int:follower_user_id>", methods=("GET",))
def get_playlist_repost_intersection_users(repost_playlist_id, follower_user_id):
    users = []
    db = get_db()
    with db.scoped_session() as session:
        # ensure playlist_id exists
        playlist_entry = session.query(Playlist).filter(
            Playlist.playlist_id == repost_playlist_id,
            Playlist.is_current == True
        ).first()
        if playlist_entry is None:
            return api_helpers.error_response('Resource not found for provided playlist id', 404)

        query = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                User.user_id.in_(
                    session.query(Repost.user_id)
                    .filter(
                        Repost.repost_item_id == repost_playlist_id,
                        Repost.repost_type != RepostType.track,
                        Repost.is_current == True,
                        Repost.is_delete == False
                    )
                    .intersect(
                        session.query(Follow.followee_user_id)
                        .filter(
                            Follow.follower_user_id == follower_user_id,
                            Follow.is_current == True,
                            Follow.is_delete == False
                        )
                    )
                )
            )
        )
        users = paginate_query(query).all()
        users = helpers.query_result_to_list(users)

    return api_helpers.success_response(users)


# get users that follow followeeUserId, sorted by follower count descending
@bp.route("/users/followers/<int:followee_user_id>", methods=("GET",))
def get_followers_for_user(followee_user_id):
    users = []
    db = get_db()
    with db.scoped_session() as session:
        # correlated subquery sqlalchemy code:
        # https://groups.google.com/forum/#!topic/sqlalchemy/WLIy8jxD7qg
        inner_follow = aliased(Follow)
        outer_follow = aliased(Follow)

        # subquery to get a user's follower count
        inner_select = (
            session.query(
                func.count(inner_follow.followee_user_id)
            )
            .filter(
                inner_follow.is_current == True,
                inner_follow.is_delete == False,
                inner_follow.followee_user_id == outer_follow.follower_user_id
            )
            .correlate(outer_follow)
        )

        # get all users that follow input user, sorted by their follower count desc
        outer_select = (
            session.query(
                outer_follow.follower_user_id,
                inner_select.as_scalar().label(response_name_constants.follower_count)
            )
            .filter(
                outer_follow.followee_user_id == followee_user_id,
                outer_follow.is_current == True,
                outer_follow.is_delete == False
            )
            .group_by(outer_follow.follower_user_id)
            .order_by(
                response_name_constants.follower_count + " desc",
                # secondary sort to guarantee determinism as explained here:
                # https://stackoverflow.com/questions/13580826/postgresql-repeating-rows-from-limit-offset
                asc(outer_follow.follower_user_id)
            )
        )
        follower_user_ids_by_follower_count = paginate_query(outer_select).all()

        user_ids = [user_id for (user_id, follower_count) in follower_user_ids_by_follower_count]

        # get all users for above user_ids
        users = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                User.user_id.in_(user_ids)
            )
            .all()
        )
        users = helpers.query_result_to_list(users)

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

        # order by (follower_count desc, user_id asc) to match query sorting
        # tuple key syntax from: https://stackoverflow.com/a/4233482/8414360
        users.sort(
            key=lambda user: (user[response_name_constants.follower_count], (user['user_id'])*(-1)),
            reverse=True
        )

    return api_helpers.success_response(users)


# get users that are followed by followerUserId, sorted by their follower count descending
@bp.route("/users/followees/<int:follower_user_id>", methods=("GET",))
def get_followees_for_user(follower_user_id):
    users = []
    db = get_db()
    with db.scoped_session() as session:
        # correlated subquery sqlalchemy code:
        # https://groups.google.com/forum/#!topic/sqlalchemy/WLIy8jxD7qg
        inner_follow = aliased(Follow)
        outer_follow = aliased(Follow)

        # subquery to get a user's follower count
        inner_select = (
            session.query(
                func.count(inner_follow.followee_user_id)
            )
            .filter(
                inner_follow.followee_user_id == outer_follow.followee_user_id,
                inner_follow.is_current == True,
                inner_follow.is_delete == False
            )
            .correlate(outer_follow)
        )

        # get all users followed by input user, sorted by their follower count desc
        outer_select = (
            session.query(
                outer_follow.followee_user_id,
                inner_select.as_scalar().label(response_name_constants.follower_count)
            )
            .filter(
                outer_follow.follower_user_id == follower_user_id,
                outer_follow.is_current == True,
                outer_follow.is_delete == False
            )
            .group_by(outer_follow.followee_user_id)
            .order_by(response_name_constants.follower_count + " desc")
        )
        followee_user_ids_by_follower_count = paginate_query(outer_select).all()

        user_ids = [user_id for (user_id, follower_count) in followee_user_ids_by_follower_count]

        # get all users for above user_ids
        users = (
            session.query(User)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                User.user_id.in_(user_ids)
            )
            .all()
        )
        users = helpers.query_result_to_list(users)

        current_user_id = get_current_user_id(required=False)

        # bundle peripheral info into user results
        users = populate_user_metadata(session, user_ids, users, current_user_id)

        # order by follower_count desc
        users.sort(
            key=lambda user: user[response_name_constants.follower_count],
            reverse=True
        )

    return api_helpers.success_response(users)


# get users that reposted repostTrackId, sorted by follower count descending
@bp.route("/users/reposts/track/<int:repost_track_id>", methods=("GET",))
def get_reposters_for_track(repost_track_id):
    user_results = []
    db = get_db()
    with db.scoped_session() as session:
        # ensure track_id exists
        track_entry = session.query(Track).filter(
            Track.track_id == repost_track_id,
            Track.is_current == True
        ).first()
        if track_entry is None:
            return api_helpers.error_response('Resource not found for provided track id', 404)

        follower_count_subquery = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id).label(response_name_constants.follower_count)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .group_by(Follow.followee_user_id)
            .order_by(response_name_constants.follower_count + " desc")
        )
        follower_count_subquery = paginate_query(follower_count_subquery).subquery()

        query = (
            session.query(User, follower_count_subquery.c.follower_count)
            .join(Repost, User.user_id == Repost.user_id)
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                Repost.repost_item_id == repost_track_id,
                Repost.repost_type == RepostType.track,
                Repost.is_current == True,
                Repost.is_delete == False
            )
        )
        user_results = query.all()

        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i] or 0

    return api_helpers.success_response(user_results)


# get users that reposted repostPlaylistId, sorted by follower count descending
@bp.route("/users/reposts/playlist/<int:repost_playlist_id>", methods=("GET",))
def get_reposters_for_playlist(repost_playlist_id):
    user_results = []
    db = get_db()
    with db.scoped_session() as session:
        # ensure playlist_id exists
        playlist_entry = session.query(Playlist).filter(
            Playlist.playlist_id == repost_playlist_id,
            Playlist.is_current == True
        ).first()
        if playlist_entry is None:
            return api_helpers.error_response('Resource not found for provided playlist id', 404)

        follower_count_subquery = (
            session.query(
                Follow.followee_user_id,
                func.count(Follow.followee_user_id).label(response_name_constants.follower_count)
            )
            .filter(
                Follow.is_current == True,
                Follow.is_delete == False
            )
            .group_by(Follow.followee_user_id)
            .order_by(response_name_constants.follower_count + " desc")
        )
        follower_count_subquery = paginate_query(follower_count_subquery).subquery()

        query = (
            session.query(User, follower_count_subquery.c.follower_count)
            .join(Repost, User.user_id == Repost.user_id)
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                User.is_ready == True,
                Repost.repost_item_id == repost_playlist_id,
                Repost.repost_type != RepostType.track,
                Repost.is_current == True,
                Repost.is_delete == False
            )
        )
        user_results = query.all()

        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i] or 0

    return api_helpers.success_response(user_results)


# Returns records that match save type and user id
@bp.route("/saves/<save_type>", methods=("GET",))
def get_saves(save_type):
    save_query_type = None
    if save_type == 'albums':
        save_query_type = SaveType.album
    elif save_type == 'playlists':
        save_query_type = SaveType.playlist
    elif save_type == 'tracks':
        save_query_type = SaveType.track
    else:
        raise exceptions.ArgumentError("Invalid save type provided")

    save_results = []
    current_user_id = get_current_user_id()
    db = get_db()
    with db.scoped_session() as session:
        query = (
            session.query(Save)
            .filter(
                Save.user_id == current_user_id,
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_type == save_query_type
            )
        )
        # filter out saves for deleted entries
        if save_type == 'albums':
            query = query.filter(
                Save.save_item_id.in_(
                    session.query(Playlist.playlist_id).filter(
                        Playlist.is_album == True,
                        Playlist.is_current == True
                    )
                )
            )
        elif save_type == 'playlists':
            query = query.filter(
                Save.save_item_id.in_(
                    session.query(Playlist.playlist_id).filter(
                        Playlist.is_album == False,
                        Playlist.is_current == True
                    )
                )
            )
        elif save_type == 'tracks':
            query = query.filter(
                Save.save_item_id.in_(
                    session.query(Track.track_id).filter(
                        Track.is_current == True
                    )
                )
            )

        query_results = paginate_query(query).all()
        save_results = helpers.query_result_to_list(query_results)
    return api_helpers.success_response(save_results)
