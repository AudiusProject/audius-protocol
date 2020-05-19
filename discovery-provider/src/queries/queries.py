import logging # pylint: disable=C0302
import datetime
import sqlalchemy
from sqlalchemy import func, asc, desc, text, case, or_, and_, Integer, Float, Date
from sqlalchemy.orm import aliased
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.dialects import postgresql

from flask import Blueprint, request

from src import api_helpers, exceptions
from src.models import User, Track, Repost, RepostType, Follow, Playlist, Save, SaveType, Remix, Stem
from src.utils import helpers
from src.utils.db_session import get_db_read_replica
from src.queries import response_name_constants
from src.queries.query_helpers import get_current_user_id, parse_sort_param, populate_user_metadata, \
    populate_track_metadata, populate_playlist_metadata, get_repost_counts, get_save_counts, \
    get_pagination_vars, paginate_query, get_users_by_id, get_users_ids, \
    create_save_repost_count_subquery, decayed_score, filter_to_playlist_mood, \
    create_followee_playlists_subquery, add_users_to_tracks, create_save_count_subquery, \
    create_repost_count_subquery

logger = logging.getLogger(__name__)
bp = Blueprint("queries", __name__)

trackDedupeMaxMinutes = 10


######## ROUTES ########


# Returns all users (paginated) with each user's follow count
# Optionally filters by is_creator, wallet, or user ids
@bp.route("/users", methods=("GET",))
def get_users():
    users = []
    db = get_db_read_replica()
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
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(Track)
        base_query = base_query.filter(Track.is_current == True, Track.is_unlisted == False, Track.stem_of == None)

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

        # Allow filtering of deletes
        # Note: There is no standard for boolean url parameters, and any value (including 'false')
        # will be evaluated as true, so an explicit check is made for true
        if ("filter_deleted" in request.args):
            filter_deleted = request.args.get("filter_deleted")
            if (filter_deleted.lower() == 'true'):
                base_query = base_query.filter(
                    Track.is_delete == False
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

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

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

    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = session.query(Track)
        filter_cond = []

        # Create filter conditions as a list of `and` clauses
        for i in identifiers:
            filter_cond.append(and_(
                Track.is_current == True,
                Track.track_id == i["id"]
            ))

        # Pass array of `and` clauses into an `or` clause as destructured *args
        base_query = base_query.filter(or_(*filter_cond))

        # Allow filtering of deletes
        # Note: There is no standard for boolean url parameters, and any value (including 'false')
        # will be evaluated as true, so an explicit check is made for true
        if ("filter_deleted" in request.args):
            filter_deleted = request.args.get("filter_deleted")
            if (filter_deleted.lower() == 'true'):
                base_query = base_query.filter(
                    Track.is_delete == False
                )

        # Perform the query
        # TODO: pagination is broken with unlisted tracks
        query_results = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(query_results)

        # Mapping of track_id -> track object from request;
        # used to check route_id when iterating through identifiers
        identifiers_map = {track["id"]: track for track in identifiers}

        # If the track is unlisted and the generated route_id does not match the route_id in db,
        # filter track out from response
        def filter_fn(track):
            input_track = identifiers_map[track["track_id"]]
            route_id = helpers.create_track_route_id(input_track["url_title"], \
                        input_track["handle"])

            return not track["is_unlisted"] or track["route_id"] == route_id

        tracks = list(filter(filter_fn, tracks))

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

        track_ids = list(map(lambda track: track["track_id"], tracks))

        # Populate metadata
        current_user_id = get_current_user_id(required=False)
        extended_tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

    return api_helpers.success_response(extended_tracks)


@bp.route("/stems/<int:track_id>", methods=("GET",))
def get_stems_of(track_id):
    db = get_db_read_replica()
    stems = []
    with db.scoped_session() as session:
        parent_not_deleted_subquery = (
            session.query(Track.is_delete)
                .filter(Track.track_id == track_id)
                .subquery()
            )

        stem_results = (
            session.query(Track)
            .join(
                Stem,
                Stem.child_track_id == Track.track_id,
            )
            .filter(Track.is_current == True, Track.is_delete == False)
            .filter(Stem.parent_track_id == track_id)
            .filter(parent_not_deleted_subquery.c.is_delete == False)
            .all())
        stems = helpers.query_result_to_list(stem_results)

    return api_helpers.success_response(stems)

# Return playlist content in json form
# optional parameters playlist owner's user_id, playlist_id = []
@bp.route("/playlists", methods=("GET",))
def get_playlists():
    playlists = []
    current_user_id = get_current_user_id(required=False)
    filter_out_private_playlists = True

    db = get_db_read_replica()
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

            # Filter out deletes unless we're fetching explicitly by id
            if "playlist_id" not in request.args:
                playlist_query = playlist_query.filter(
                    Playlist.is_delete == False
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

            if "with_users" in request.args and request.args.get("with_users") != 'false':
                user_id_list = get_users_ids(playlists)
                users = get_users_by_id(session, user_id_list)
                for playlist in playlists:
                    user = users[playlist['playlist_owner_id']]
                    if user:
                        playlist['user'] = user

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
    db = get_db_read_replica()

    # filter should be one of ["all", "reposts", "original"]
    # empty filter value results in "all"
    if "filter" in request.args and request.args.get("filter") in ["all", "repost", "original"]:
        feed_filter = request.args.get("filter")
    else:
        feed_filter = "all"

    # Allow for fetching only tracks
    if ('tracks_only' in request.args and request.args.get('tracks_only') != 'false'):
        tracks_only = True
    else:
        tracks_only = False

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
            if not tracks_only:
                # Query playlists posted by followees, sorted and paginated by created_at desc
                created_playlists_query = (
                    session.query(Playlist)
                    .filter(
                        Playlist.is_current == True,
                        Playlist.is_delete == False,
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
                .order_by(desc("min_created_at"))
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
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
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

            if not tracks_only:
                # Query playlists reposted by followees, excluding playlists already fetched from above
                reposted_playlists = session.query(Playlist).filter(
                    Playlist.is_current == True,
                    Playlist.is_delete == False,
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

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            user_id_list = get_users_ids(feed_results)
            users = get_users_by_id(session, user_id_list)
            for result in feed_results:
                if 'playlist_owner_id' in result:
                    user = users[result['playlist_owner_id']]
                    if user:
                        result['user'] = user
                elif 'owner_id' in result:
                    user = users[result['owner_id']]
                    if user:
                        result['user'] = user

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
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # query all reposts by user
        repost_query = (
            session.query(Repost)
            .filter(
                Repost.is_current == True,
                Repost.is_delete == False,
                Repost.user_id == user_id
            )
            .order_by(desc(Repost.created_at), desc(Repost.repost_item_id), desc(Repost.repost_type))
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
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.track_id.in_(repost_track_ids)
            )
            .order_by(desc(Track.created_at))
        )
        tracks = track_query.all()
        tracks = helpers.query_result_to_list(tracks)

        # get track ids
        track_ids = [track["track_id"] for track in tracks]

        # query playlists for repost_playlist_ids
        playlist_query = (
            session.query(Playlist)
            .filter(
                Playlist.is_current == True,
                Playlist.is_delete == False,
                Playlist.is_private == False,
                Playlist.playlist_id.in_(repost_playlist_ids)
            )
            .order_by(desc(Playlist.created_at))
        )
        playlists = playlist_query.all()
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

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            user_id_list = get_users_ids(feed_results)
            users = get_users_by_id(session, user_id_list)
            for result in feed_results:
                if 'playlist_owner_id' in result:
                    user = users[result['playlist_owner_id']]
                    if user:
                        result['user'] = user
                elif 'owner_id' in result:
                    user = users[result['owner_id']]
                    if user:
                        result['user'] = user

    return api_helpers.success_response(feed_results)


# intersection of user1's followers and user2's followees
# get intersection of users that follow followeeUserId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
@bp.route("/users/intersection/follow/<int:followee_user_id>/<int:follower_user_id>", methods=("GET",))
def get_follow_intersection_users(followee_user_id, follower_user_id):
    users = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        query = (
            session.query(User)
            .filter(
                User.is_current == True,
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


# get intersection of users that have reposted provided repost_track_id and users that are
# followed by follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_track_id = track that is reposted. repost_user_id = user that reposted track.
@bp.route("/users/intersection/repost/track/<int:repost_track_id>/<int:follower_user_id>", methods=("GET",))
def get_track_repost_intersection_users(repost_track_id, follower_user_id):
    users = []
    db = get_db_read_replica()
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


# Get intersection of users that have reposted provided repost_playlist_id and users that
# are followed by provided follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_playlist_id = playlist that is reposted. repost_user_id = user that reposted playlist.
@bp.route("/users/intersection/repost/playlist/<int:repost_playlist_id>/<int:follower_user_id>", methods=("GET",))
def get_playlist_repost_intersection_users(repost_playlist_id, follower_user_id):
    users = []
    db = get_db_read_replica()
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


# Get paginated users that follow provided followee_user_id, sorted by their follower count descending.
@bp.route("/users/followers/<int:followee_user_id>", methods=("GET",))
def get_followers_for_user(followee_user_id):
    users = []
    db = get_db_read_replica()
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
                desc(response_name_constants.follower_count),
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


# Get paginated users that are followed by provided follower_user_id, sorted by their follower count descending.
@bp.route("/users/followees/<int:follower_user_id>", methods=("GET",))
def get_followees_for_user(follower_user_id):
    users = []
    db = get_db_read_replica()
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
            .order_by(desc(response_name_constants.follower_count))
        )
        followee_user_ids_by_follower_count = paginate_query(outer_select).all()

        user_ids = [user_id for (user_id, follower_count) in followee_user_ids_by_follower_count]

        # get all users for above user_ids
        users = (
            session.query(User)
            .filter(
                User.is_current == True,
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


# Get paginated users that reposted provided repost_track_id, sorted by their follower count descending.
@bp.route("/users/reposts/track/<int:repost_track_id>", methods=("GET",))
def get_reposters_for_track(repost_track_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Track exists for provided repost_track_id.
        track_entry = session.query(Track).filter(
            Track.track_id == repost_track_id,
            Track.is_current == True
        ).first()
        if track_entry is None:
            return api_helpers.error_response('Resource not found for provided track id', 404)

        # Subquery to get all (user_id, follower_count) entries from Follows table.
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
            .subquery()
        )

        # Get all Users that reposted track, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0)).label(response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that reposted given track.
                User.user_id.in_(
                    session.query(Repost.user_id)
                    .filter(
                        Repost.repost_item_id == repost_track_id,
                        Repost.repost_type == RepostType.track,
                        Repost.is_current == True,
                        Repost.is_delete == False
                    )
                )
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = paginate_query(query).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i]

    return api_helpers.success_response(user_results)


# Get paginated users that reposted provided repost_playlist_id, sorted by their follower count descending.
@bp.route("/users/reposts/playlist/<int:repost_playlist_id>", methods=("GET",))
def get_reposters_for_playlist(repost_playlist_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Playlist exists for provided repost_playlist_id.
        playlist_entry = session.query(Playlist).filter(
            Playlist.playlist_id == repost_playlist_id,
            Playlist.is_current == True
        ).first()
        if playlist_entry is None:
            return api_helpers.error_response('Resource not found for provided playlist id', 404)

        # Subquery to get all (user_id, follower_count) entries from Follows table.
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
            .subquery()
        )

        # Get all Users that reposted Playlist, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0)).label(response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that reposted given playlist.
                User.user_id.in_(
                    session.query(Repost.user_id)
                    .filter(
                        Repost.repost_item_id == repost_playlist_id,
                        # Select Reposts for Playlists and Albums (i.e. not Tracks).
                        Repost.repost_type != RepostType.track,
                        Repost.is_current == True,
                        Repost.is_delete == False
                    )
                )
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = paginate_query(query).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i]

    return api_helpers.success_response(user_results)


# Get paginated users that saved provided save_track_id, sorted by their follower count descending.
@bp.route("/users/saves/track/<int:save_track_id>", methods=("GET",))
def get_savers_for_track(save_track_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Track exists for provided save_track_id.
        track_entry = session.query(Track).filter(
            Track.track_id == save_track_id,
            Track.is_current == True
        ).first()
        if track_entry is None:
            return api_helpers.error_response('Resource not found for provided track id', 404)

        # Subquery to get all (user_id, follower_count) entries from Follows table.
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
            .subquery()
        )

        # Get all Users that saved track, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0)).label(response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that saved given track.
                User.user_id.in_(
                    session.query(Save.user_id)
                    .filter(
                        Save.save_item_id == save_track_id,
                        Save.save_type == SaveType.track,
                        Save.is_current == True,
                        Save.is_delete == False
                    )
                )
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = paginate_query(query).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i]

    return api_helpers.success_response(user_results)


# Get paginated users that saved provided save_playlist_id, sorted by their follower count descending.
@bp.route("/users/saves/playlist/<int:save_playlist_id>", methods=("GET",))
def get_savers_for_playlist(save_playlist_id):
    user_results = []
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Ensure Playlist exists for provided save_playlist_id.
        playlist_entry = session.query(Playlist).filter(
            Playlist.playlist_id == save_playlist_id,
            Playlist.is_current == True
        ).first()
        if playlist_entry is None:
            return api_helpers.error_response('Resource not found for provided playlist id', 404)

        # Subquery to get all (user_id, follower_count) entries from Follows table.
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
            .subquery()
        )

        # Get all Users that saved Playlist, ordered by follower_count desc & paginated.
        query = (
            session.query(
                User,
                # Replace null values from left outer join with 0 to ensure sort works correctly.
                (func.coalesce(follower_count_subquery.c.follower_count, 0)).label(response_name_constants.follower_count)
            )
            # Left outer join to associate users with their follower count.
            .outerjoin(follower_count_subquery, follower_count_subquery.c.followee_user_id == User.user_id)
            .filter(
                User.is_current == True,
                # Only select users that saved given playlist.
                User.user_id.in_(
                    session.query(Save.user_id)
                    .filter(
                        Save.save_item_id == save_playlist_id,
                        # Select Saves for Playlists and Albums (i.e. not Tracks).
                        Save.save_type != SaveType.track,
                        Save.is_current == True,
                        Save.is_delete == False
                    )
                )
            )
            .order_by(desc(response_name_constants.follower_count))
        )
        user_results = paginate_query(query).all()

        # Fix format to return only Users objects with follower_count field.
        if user_results:
            users, follower_counts = zip(*user_results)
            user_results = helpers.query_result_to_list(users)
            for i, user in enumerate(user_results):
                user[response_name_constants.follower_count] = follower_counts[i]

    return api_helpers.success_response(user_results)


# Get paginated saves of provided save_type for current user.
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
    db = get_db_read_replica()
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

# Get the user saved collections & uploaded collections along with the collection user owners
# NOTE: This is a one off endpoint for retrieving a user's collections/associated user and should
# be consolidated later in the client
@bp.route("/users/account", methods=("GET",))
def get_users_account():

    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Create initial query
        base_query = session.query(User)
        # Don't return the user if they have no wallet or handle (user creation did not finish properly on chain)
        base_query = base_query.filter(User.is_current == True, User.wallet != None, User.handle != None)

        if "wallet" not in request.args:
            return api_helpers.error_response('Missing wallet param', 404)

        wallet = request.args.get("wallet")
        wallet = wallet.lower()
        if len(wallet) == 42:
            base_query = base_query.filter_by(wallet=wallet)
            base_query = base_query.order_by(asc(User.created_at))
        else:
            return api_helpers.error_response('Invalid wallet length', 400)

        # If user cannot be found, exit early and return empty response
        user = base_query.first()
        if not user:
            return api_helpers.success_response(None)

        user = helpers.model_to_dictionary(user)
        user_id = user['user_id']

        # bundle peripheral info into user results
        users = populate_user_metadata(session, [user_id], [user], user_id, True)
        user = users[0]

        # Get saved playlists / albums ids
        saved_query = session.query(Save.save_item_id).filter(
            Save.user_id == user_id,
            Save.is_current == True,
            Save.is_delete == False,
            or_(Save.save_type == SaveType.playlist, Save.save_type == SaveType.album)
        )

        saved_query_results = saved_query.all()
        save_collection_ids = [item[0] for item in saved_query_results]

        # Get Playlist/Albums saved or owned by the user
        playlist_query = session.query(Playlist).filter(
                or_(
                    and_(Playlist.is_current == True, Playlist.is_delete == False, Playlist.playlist_owner_id == user_id),
                    and_(Playlist.is_current == True, Playlist.is_delete == False, Playlist.playlist_id.in_(save_collection_ids))
                )
            ).order_by(desc(Playlist.created_at))
        playlists = playlist_query.all()
        playlists = helpers.query_result_to_list(playlists)

        playlist_owner_ids = list(set([playlist['playlist_owner_id'] for playlist in playlists]))

        # Get Users for the Playlist/Albums
        user_query = session.query(User).filter(
                and_(User.is_current == True, User.user_id.in_(playlist_owner_ids))
            )
        users = user_query.all()
        users = helpers.query_result_to_list(users)
        user_map = {}

        stripped_playlists = []
        # Map the users to the playlists/albums
        for playlist_owner in users:
             user_map[playlist_owner['user_id']] = playlist_owner
        for playlist in playlists:
            playlist_owner = user_map[playlist['playlist_owner_id']]
            stripped_playlists.append({
                'id': playlist['playlist_id'],
                'name': playlist['playlist_name'],
                'is_album': playlist['is_album'],
                'user': { 'id': playlist_owner['user_id'], 'handle': playlist_owner['handle'] }
            })
        user['playlists'] = stripped_playlists

    return api_helpers.success_response(user)

# Gets the max id for tracks, playlists, or users.
@bp.route("/latest/<type>", methods=("GET",))
def get_max_id(type):
    if not type:
        return api_helpers.error_response(
            "Invalid type provided, must be one of 'track', 'playlist', 'user'", 400
        )

    db = get_db_read_replica()
    with db.scoped_session() as session:
        if type == 'track':
            latest = (
                session
                .query(func.max(Track.track_id))
                .scalar()
            )
            return api_helpers.success_response(latest)
        elif type == 'playlist':
            latest = (
                session
                .query(func.max(Playlist.playlist_id))
                .scalar()
            )
            return api_helpers.success_response(latest)
        elif type == 'user':
            latest = (
                session
                .query(func.max(User.user_id))
                .scalar()
            )
            return api_helpers.success_response(latest)
    return api_helpers.error_response("Unable to compute latest", 400)

@bp.route("/top/<type>", methods=("GET",))
def get_top_playlists(type):
    """
    An endpoint to retrieve the "top" of a certain demographic of playlists or albums.
    This endpoint is useful in generating views like:
        - Top playlists
        - Top Albums
        - Top playlists of a certain mood
        - Top playlists of a certain mood from people you follow

    Args:
        type: (string) The `type` (same as repost/save type) to query from.
        limit?: (number) default=16, max=100
        mood?: (string) default=None
        filter?: (string) Optional filter to include (supports 'followees') default=None
    """
    current_user_id = get_current_user_id(required=False)

    # Argument parsing and checking
    if type != 'playlist' and type != 'album':
        return api_helpers.error_response(
            "Invalid type provided, must be one of 'playlist', 'album'", 400
        )

    if 'limit' in request.args:
        limit = min(int(request.args.get('limit')), 100)
    else:
        limit = 16

    if 'mood' in request.args:
        mood = request.args.get('mood')
    else:
        mood = None

    if 'filter' in request.args:
        query_filter = request.args.get('filter')
        if query_filter != 'followees':
            return api_helpers.error_response(
                "Invalid type provided, must be one of 'followees'", 400
            )
        if query_filter == 'followees':
            if not current_user_id:
                return api_helpers.error_response(
                    "User id required to query for followees", 400
                )
    else:
        query_filter = None

    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Construct a subquery to get the summed save + repost count for the `type`
        count_subquery = create_save_repost_count_subquery(session, type)

        # If filtering by followees, set the playlist view to be only playlists from
        # users that the current user follows.
        if query_filter == 'followees':
            playlists_to_query = create_followee_playlists_subquery(session, current_user_id)
        # Otherwise, just query all playlists
        else:
            playlists_to_query = session.query(Playlist).subquery()

        # Create a decayed-score view of the playlists
        playlist_query = (
            session.query(
                playlists_to_query,
                count_subquery.c['count'],
                decayed_score(count_subquery.c['count'], playlists_to_query.c.created_at).label('score')
            )
            .select_from(playlists_to_query)
            .join(
                count_subquery,
                count_subquery.c['id'] == playlists_to_query.c.playlist_id
            )
            .filter(
                playlists_to_query.c.is_current == True,
                playlists_to_query.c.is_delete == False,
                playlists_to_query.c.is_private == False,
            )
        )

        # Filter by mood (no-op if no mood is provided)
        playlist_query = filter_to_playlist_mood(
            session,
            mood,
            playlist_query,
            playlists_to_query
        )

        # Order and limit the playlist query by score
        playlist_query = (
            playlist_query.order_by(
                desc('score'),
                desc(playlists_to_query.c.playlist_id)
            )
            .limit(limit)
        )

        playlist_results = playlist_query.all()

        # Unzip query results into playlists and scores
        score_map = {} # playlist_id : score
        playlists = []
        if playlist_results:
            for result in playlist_results:
                # The playlist is the portion of the query result before repost_count and score
                playlist = result[0:-2]
                repost_count = result[-2]
                score = result[-1]

                # Convert the playlist row tuple into a dictionary keyed by column name
                playlist = helpers.tuple_to_model_dictionary(playlist, Playlist)
                score_map[playlist['playlist_id']] = score
                playlists.append(playlist)

        playlist_ids = list(map(lambda playlist: playlist["playlist_id"], playlists))

        # Bundle peripheral info into playlist results
        playlists = populate_playlist_metadata(
            session,
            playlist_ids,
            playlists,
            [RepostType.playlist, RepostType.album],
            [SaveType.playlist, SaveType.album],
            current_user_id
        )
        # Add scores into the response
        for playlist in playlists:
            playlist['score'] = score_map[playlist['playlist_id']]

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            user_id_list = get_users_ids(playlists)
            users = get_users_by_id(session, user_id_list)
            for playlist in playlists:
                user = users[playlist['playlist_owner_id']]
                if user:
                    playlist['user'] = user

    return api_helpers.success_response(playlists)

@bp.route("/top_followee_windowed/<type>/<window>")
def get_top_followee_windowed(type, window):
    """
        Gets a windowed (over a certain timerange) view into the "top" of a certain type
        amongst followees. Requires an account.
        This endpoint is useful in generating views like:
            - New releases

        Args:
            type: (string) The `type` (same as repost/save type) to query from. Currently only
                track is supported.
            window: (string) The window from now() to look back over. Supports all standard
                SqlAlchemy interval notation (week, month, year, etc.).
            limit?: (number) default=25, max=100
    """
    if type != 'track':
        return api_helpers.error_response(
            "Invalid type provided, must be one of 'track'", 400
        )

    valid_windows =['week', 'month', 'year']
    if not window or window not in valid_windows:
        return api_helpers.error_response(
            "Invalid window provided, must be one of {}".format(valid_windows)
        )

    if 'limit' in request.args:
        limit = min(int(request.args.get('limit')), 100)
    else:
        limit = 25

    current_user_id = get_current_user_id()
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Construct a subquery to get the summed save + repost count for the `type`
        count_subquery = create_save_repost_count_subquery(session, type)

        followee_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
        )
        followee_user_ids_subquery = followee_user_ids.subquery()

        # Queries for tracks joined against followed users and counts
        tracks_query = (
            session.query(
                Track,
            )
            .join(
                followee_user_ids_subquery,
                Track.owner_id == followee_user_ids_subquery.c.followee_user_id
            )
            .join(
                count_subquery,
                Track.track_id == count_subquery.c['id']
            )
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
                # Query only tracks created `window` time ago (week, month, etc.)
                Track.created_at >= text("NOW() - interval '1 {}'".format(window)),
            )
            .order_by(
                desc(count_subquery.c['count']),
                desc(Track.track_id)
            )
            .limit(limit)
        )

        tracks_query_results = tracks_query.all()
        tracks = helpers.query_result_to_list(tracks_query_results)
        track_ids = list(map(lambda track: track['track_id'], tracks))

        # Bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if 'with_users' in request.args and request.args.get('with_users') != 'false':
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

    return api_helpers.success_response(tracks)

@bp.route("/top_followee_saves/<type>")
def get_top_followee_saves(type):
    """
        Gets a global view into the most saved of `type` amongst followees. Requires an account.
        This endpoint is useful in generating views like:
            - Most favorited

        Args:
            type: (string) The `type` (same as repost/save type) to query from. Currently only
                track is supported.
            limit?: (number) default=25, max=100
    """
    if type != 'track':
        return api_helpers.error_response(
            "Invalid type provided, must be one of 'track'", 400
        )

    if 'limit' in request.args:
        limit = min(int(request.args.get('limit')), 100)
    else:
        limit = 25

    current_user_id = get_current_user_id()
    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Construct a subquery of all followees
        followee_user_ids = (
            session.query(Follow.followee_user_id)
            .filter(
                Follow.follower_user_id == current_user_id,
                Follow.is_current == True,
                Follow.is_delete == False
            )
        )
        followee_user_ids_subquery = followee_user_ids.subquery()

        # Construct a subquery of all saves from followees aggregated by id
        save_count = (
            session.query(
                Save.save_item_id,
                func.count(Save.save_item_id).label(response_name_constants.save_count)
            )
            .join(
                followee_user_ids_subquery,
                Save.user_id == followee_user_ids_subquery.c.followee_user_id
            )
            .filter(
                Save.is_current == True,
                Save.is_delete == False,
                Save.save_type == type,
            )
            .group_by(
                Save.save_item_id
            )
            .order_by(
                desc(response_name_constants.save_count)
            )
            .limit(limit)
        )
        save_count_subquery = save_count.subquery()

        # Query for tracks joined against followee save counts
        tracks_query = (
            session.query(
                Track,
            )
            .join(
                save_count_subquery,
                Track.track_id == save_count_subquery.c.save_item_id
            )
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False,
                Track.stem_of == None,
            )
        )

        tracks_query_results = tracks_query.all()
        tracks = helpers.query_result_to_list(tracks_query_results)
        track_ids = list(map(lambda track: track['track_id'], tracks))

        # bundle peripheral info into track results
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if 'with_users' in request.args and request.args.get('with_users') != 'false':
            user_id_list = get_users_ids(tracks)
            users = get_users_by_id(session, user_id_list)
            for track in tracks:
                user = users[track['owner_id']]
                if user:
                    track['user'] = user

    return api_helpers.success_response(tracks)

# Retrieves the top users for a requested genre under the follow parameters
# - A given user can only be associated w/ one genre
# - The user's associated genre is calculated by tallying the genre of the tracks and taking the max
#   - If there is a tie for # of tracks in a genre, then the first genre alphabetically is taken
# - The users associated w/ the requested genre are then sorted by follower count
# Route Parameters
#   urlParam: {Array<string>?}  genre       List of genres to query for the 'top' users
#   urlParam: {boolean?}        with_user   Boolean if the response should be the user ID or user metadata defaults to false
@bp.route("/users/genre/top", methods=("GET",))
def get_top_genre_users():

    genres = []
    if "genre" in request.args:
        genres = request.args.getlist("genre")

    # If the with_users url arg is provided, then populate the user metadata else return user ids
    with_users = "with_users" in request.args and request.args.get("with_users") != 'false'

    db = get_db_read_replica()
    with db.scoped_session() as session:
        with_genres = len(genres) != 0

        # Associate the user w/ a genre by counting the total # of tracks per genre
        # taking the genre w/ the most tracks (using genre name as secondary sort)
        user_genre_count_query = (
            session.query(
                User.user_id.label('user_id'),
                Track.genre.label('genre'),
                func.row_number().over(
                        partition_by=User.user_id,
                        order_by=(desc(func.count(Track.genre)), asc(Track.genre))
                ).label("row_number")
            ).join(
                Track,
                Track.owner_id == User.user_id
            ).filter(
                User.is_current == True,
                User.is_creator == True,
                Track.is_unlisted == False,
                Track.stem_of == None,
                Track.is_current == True,
                Track.is_delete == False
            ).group_by(
                User.user_id,
                Track.genre
            ).order_by(
                desc(func.count(Track.genre)), asc(Track.genre)
            )
        )

        user_genre_count_query = user_genre_count_query.subquery('user_genre_count_query')

        user_genre_query = (
            session.query(
                user_genre_count_query.c.user_id.label('user_id'),
                user_genre_count_query.c.genre.label('genre'),
            ).filter(
                user_genre_count_query.c.row_number == 1
            ).subquery('user_genre_query')
        )

        # Using the subquery of user to associated genre,
        #   filter by the requested genres and
        #   sort by user follower count
        user_genre_followers_query = (
            session.query(
                user_genre_query.c.user_id.label('user_id')
            ).join(
                Follow, Follow.followee_user_id == user_genre_query.c.user_id
            ).filter(
                Follow.is_current == True,
                Follow.is_delete == False
            ).group_by(
                user_genre_query.c.user_id, user_genre_query.c.genre
            ).order_by(
                # desc('follower_count')
                desc(func.count(Follow.follower_user_id))
            )
        )

        if with_genres:
            user_genre_followers_query = user_genre_followers_query.filter(user_genre_query.c.genre.in_(genres))

        # If the with_users flag is not set, respond with the user_ids
        users = paginate_query(user_genre_followers_query).all()
        user_ids = list(map(lambda user: user[0], users))

        # If the with_users flag is used, retrieve the user metadata
        if with_users:
            user_query = session.query(User).filter(
                User.user_id.in_(user_ids),
                User.is_current == True
            )
            users = user_query.all()
            users = helpers.query_result_to_list(users)
            queried_user_ids = list(map(lambda user: user["user_id"], users))
            users = populate_user_metadata(session, queried_user_ids, users, None)

            # Sort the users so that it's in the same order as the previous query
            user_map = {user['user_id']:user for user in users}
            users = [user_map[user_id] for user_id in user_ids]
            return api_helpers.success_response({ 'users': users })


        return api_helpers.success_response({ 'user_ids': user_ids })



# Get the tracks that are 'children' remixes of the requested track
# The results are sorted by if the original artist has reposted or saved the track
@bp.route("/remixes/<int:track_id>/children", methods=("GET",))
def get_remixes_of(track_id):

    db = get_db_read_replica()
    with db.scoped_session() as session:
        # Fetch the parent track to get the track's owner id
        parent_track = session.query(Track).filter(
            Track.is_current == True,
            Track.track_id == track_id
        ).first()
        
        if (parent_track == None):
            return api_helpers.error_response("Invalid track_id provided", 400)

        track_owner_id = parent_track.owner_id

        # Create subquery for save counts for sorting
        save_count_subquery = create_save_count_subquery(session, SaveType.track)

        # Create subquery for repost counts for sorting
        repost_count_subquery = create_repost_count_subquery(session, RepostType.track)

        # Get the 'children' remix tracks
        # Use the track owner id to fetch reposted/saved tracks returned first 
        base_query = (
            session.query(
                Track
            )
            .join(
                Remix,
                and_(
                    Remix.child_track_id == Track.track_id,
                    Remix.parent_track_id == track_id
                )
            ).outerjoin(
                Save,
                and_(
                    Save.save_item_id == Track.track_id,
                    Save.save_type == SaveType.track,
                    Save.is_current == True,
                    Save.is_delete == False,
                    Save.user_id == track_owner_id
                )
            ).outerjoin(
                Repost,
                and_(
                    Repost.repost_item_id == Track.track_id,
                    Repost.user_id == track_owner_id,
                    Repost.repost_type == RepostType.track,
                    Repost.is_current == True,
                    Repost.is_delete == False
                )
            ).outerjoin(
                repost_count_subquery,
                repost_count_subquery.c['id'] == Track.track_id
            ).outerjoin(
                save_count_subquery,
                save_count_subquery.c['id'] == Track.track_id
            )
            .filter(
                Track.is_current == True,
                Track.is_delete == False,
                Track.is_unlisted == False
            )
            # 1. Co-signed tracks ordered by save + repost count
            # 2. Other tracks ordered by save + repost count
            .order_by(
                desc(
                    # If there is no "co-sign" for the track (no repost or save from the parent owner),
                    # defer to secondary sort
                    case(
                        [
                            (and_(Repost.created_at == None, Save.created_at == None), 0),
                        ],
                        else_ = (
                            func.coalesce(repost_count_subquery.c.repost_count, 0) + \
                            func.coalesce(save_count_subquery.c.save_count, 0)
                        )
                    )
                ),
                # Order by saves + reposts
                desc(
                    func.coalesce(repost_count_subquery.c.repost_count, 0) + \
                    func.coalesce(save_count_subquery.c.save_count, 0)
                ),
                # Ties, pick latest track id
                desc(Track.track_id)
            )
        )

        (tracks, count) = paginate_query(base_query, True, True)
        tracks = tracks.all()
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))
        current_user_id = get_current_user_id(required=False)
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            add_users_to_tracks(session, tracks)

    return api_helpers.success_response({ 'tracks': tracks, 'count': count }, 200)

# Get the tracks that are 'parent' remixes of the requested track
@bp.route("/remixes/<int:track_id>/parents", methods=("GET",))
def get_remix_track_parents(track_id):
    db = get_db_read_replica()
    with db.scoped_session() as session:
        base_query = (
            session.query(Track)
            .join(
                Remix,
                and_(
                    Remix.parent_track_id == Track.track_id,
                    Remix.child_track_id == track_id
                )
            )
            .filter(
                Track.is_current == True,
                Track.is_unlisted == False
            )
            .order_by(
                desc(Track.created_at),
                desc(Track.track_id)
            )
        )

        tracks = paginate_query(base_query).all()
        tracks = helpers.query_result_to_list(tracks)
        track_ids = list(map(lambda track: track["track_id"], tracks))
        current_user_id = get_current_user_id(required=False)
        tracks = populate_track_metadata(session, track_ids, tracks, current_user_id)

        if "with_users" in request.args and request.args.get("with_users") != 'false':
            add_users_to_tracks(session, tracks)

    return api_helpers.success_response(tracks)
