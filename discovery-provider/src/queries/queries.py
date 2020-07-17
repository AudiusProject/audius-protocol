import logging # pylint: disable=C0302
import datetime
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_followers_for_user import get_followers_for_user
from src.queries.get_tracks_including_unlisted import get_tracks_including_unlisted
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

from src.queries.get_users import get_users
from src.queries.get_tracks import get_tracks
from src.queries.get_playlists import get_playlists
from src.queries.get_tracks_including_unlisted import get_tracks_including_unlisted
from src.queries.get_stems_of import get_stems_of
from src.queries.get_feed import get_feed
from src.queries.get_repost_feed_for_user import get_repost_feed_for_user
from src.queries.get_follow_intersection_users import get_follow_intersection_users
from src.queries.get_track_repost_intersection_users import get_track_repost_intersection_users
from src.queries.get_playlist_repost_intersection_users import get_playlist_repost_intersection_users
from src.queries.get_followers_for_user import get_followers_for_user
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_reposters_for_track import get_reposters_for_track
from src.queries.get_reposters_for_playlist import get_reposters_for_playlist
from src.queries.get_savers_for_track import get_savers_for_track
from src.queries.get_savers_for_playlist import get_savers_for_playlist
from src.queries.get_saves import get_saves


logger = logging.getLogger(__name__)
bp = Blueprint("queries", __name__)

######## ROUTES ########

# Returns all users (paginated) with each user's follow count
# Optionally filters by is_creator, wallet, or user ids
@bp.route("/users", methods=("GET",))
def get_users_route():
    users = get_users(request.args.to_dict())
    return api_helpers.success_response(users)

# Returns all tracks (paginated) with each track's repost count
# optionally filters by track ids
@bp.route("/tracks", methods=("GET",))
def get_tracks_route():
    tracks = get_tracks(request.args.to_dict())
    return api_helpers.success_response(tracks)


# Get all tracks matching a route_id and track_id.
# Expects a JSON body of shape:
#   { "tracks": [{ "id": number, "url_title": string, "handle": string }]}
@bp.route("/tracks_including_unlisted", methods=("POST",))
def get_tracks_including_unlisted_route():
    tracks = get_tracks_including_unlisted(request.args.to_dict(), request.get_json())
    return api_helpers.success_response(tracks)


@bp.route("/stems/<int:track_id>", methods=("GET",))
def get_stems_of_route(track_id):
    stems = get_stems_of(track_id)
    return api_helpers.success_response(stems)


# Return playlist content in json form
# optional parameters playlist owner's user_id, playlist_id = []
@bp.route("/playlists", methods=("GET",))
def get_playlists_route():
    playlists = get_playlists(request.args.to_dict())
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
def get_feed_route():
    feed_results = get_feed(request.args.to_dict())
    return api_helpers.success_response(feed_results)


# user repost feed steps
# - get all reposts by user
# - get all track and public playlist reposts by user, ordered by timestamp
# - get additional metadata for each track/playlist: save count, repost count, current_user_reposted, followee_reposts
# -   (if current_user == user, skip current_user_reposted check and set all to true)
# - combine unsorted playlist and track arrays
# - sort combined results by activity_timestamp field and return
@bp.route("/feed/reposts/<int:user_id>", methods=("GET",))
def get_repost_feed_for_user_route(user_id):
    feed_results = get_repost_feed_for_user(user_id, request.args.to_dict())
    return api_helpers.success_response(feed_results)


# intersection of user1's followers and user2's followees
# get intersection of users that follow followeeUserId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
@bp.route("/users/intersection/follow/<int:followee_user_id>/<int:follower_user_id>", methods=("GET",))
def get_follow_intersection_users_route(followee_user_id, follower_user_id):
    users = get_follow_intersection_users(followee_user_id, follower_user_id)
    return api_helpers.success_response(users)


# get intersection of users that have reposted provided repost_track_id and users that are
# followed by follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_track_id = track that is reposted. repost_user_id = user that reposted track.
@bp.route("/users/intersection/repost/track/<int:repost_track_id>/<int:follower_user_id>", methods=("GET",))
def get_track_repost_intersection_users_route(repost_track_id, follower_user_id):
    try:
        users = get_track_repost_intersection_users(repost_track_id, follower_user_id)
        return api_helpers.success_response(users)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get intersection of users that have reposted provided repost_playlist_id and users that
# are followed by provided follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_playlist_id = playlist that is reposted. repost_user_id = user that reposted playlist.
@bp.route("/users/intersection/repost/playlist/<int:repost_playlist_id>/<int:follower_user_id>", methods=("GET",))
def get_playlist_repost_intersection_users_route(repost_playlist_id, follower_user_id):
    try:
        users = get_playlist_repost_intersection_users(repost_playlist_id, follower_user_id)
        return api_helpers.success_response(users)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that follow provided followee_user_id, sorted by their follower count descending.
@bp.route("/users/followers/<int:followee_user_id>", methods=("GET",))
def get_followers_for_user_route(followee_user_id):
    users = get_followers_for_user(followee_user_id)
    return api_helpers.success_response(users)


# Get paginated users that are followed by provided follower_user_id, sorted by their follower count descending.
@bp.route("/users/followees/<int:follower_user_id>", methods=("GET",))
def get_followees_for_user_route(follower_user_id):
    users = get_followees_for_user(follower_user_id)
    return api_helpers.success_response(users)


# Get paginated users that reposted provided repost_track_id, sorted by their follower count descending.
@bp.route("/users/reposts/track/<int:repost_track_id>", methods=("GET",))
def get_reposters_for_track_route(repost_track_id):
    try:
        user_results = get_reposters_for_track(repost_track_id)
        return api_helpers.success_response(user_results)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that reposted provided repost_playlist_id, sorted by their follower count descending.
@bp.route("/users/reposts/playlist/<int:repost_playlist_id>", methods=("GET",))
def get_reposters_for_playlist_route(repost_playlist_id):
    try:
        user_results = get_reposters_for_playlist(repost_playlist_id)
        return api_helpers.success_response(user_results)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that saved provided save_track_id, sorted by their follower count descending.
@bp.route("/users/saves/track/<int:save_track_id>", methods=("GET",))
def get_savers_for_track_route(save_track_id):
    try:
        user_results = get_savers_for_track(save_track_id)
        return api_helpers.success_response(user_results)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that saved provided save_playlist_id, sorted by their follower count descending.
@bp.route("/users/saves/playlist/<int:save_playlist_id>", methods=("GET",))
def get_savers_for_playlist_route(save_playlist_id):
    try:
        user_results = get_savers_for_playlist(save_playlist_id)
        return api_helpers.success_response(user_results)
    except Exception as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated saves of provided save_type for current user.
@bp.route("/saves/<save_type>", methods=("GET",))
def get_saves_route(save_type):
    try:
        save_results = get_saves(save_type)
        return api_helpers.success_response(save_results)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


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
                .filter(Track.is_unlisted == False)
                .scalar()
            )
            return api_helpers.success_response(latest)
        elif type == 'playlist':
            latest = (
                session
                .query(func.max(Playlist.playlist_id))
                .filter(Playlist.is_private == False)
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

# Get the tracks that were previously unlisted and became public after the date provided
@bp.route("/previously_unlisted/track", methods=("GET",))
def get_previously_unlisted_tracks():
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "date" not in request.args:
            return api_helpers.error_response(
                "'date' required to query for retrieving previously unlisted tracks", 400
            )

        date = request.args.get("date")

        tracks_after_date = (
            session.query(
                Track.track_id,
                Track.updated_at
            ).distinct(
                Track.track_id
            ).filter(
                Track.is_unlisted == False,
                Track.updated_at >= date
            ).subquery()
        )

        tracks_before_date = (
            session.query(
                Track.track_id,
                Track.updated_at
            ).distinct(
                Track.track_id
            ).filter(
                Track.is_unlisted == True,
                Track.updated_at < date
            ).subquery()
        )

        previously_unlisted_results = session.query(
            tracks_before_date.c['track_id']
        ).join(
            tracks_after_date,
            tracks_after_date.c['track_id'] == tracks_before_date.c['track_id'],
        ).all()

        track_ids = [result[0] for result in previously_unlisted_results]

    return api_helpers.success_response({ 'ids': track_ids })

# Get the playlists that were previously private and became public after the date provided
@bp.route("/previously_private/playlist", methods=("GET",))
def get_previously_private_playlist():
    db = get_db_read_replica()
    with db.scoped_session() as session:
        if "date" not in request.args:
            return api_helpers.error_response(
                "'date' required to query for retrieving previously private playlists", 400
            )

        date = request.args.get("date")

        playlist_after_date = (
            session.query(
                Playlist.playlist_id,
                Playlist.updated_at
            ).distinct(
                Playlist.playlist_id
            ).filter(
                Playlist.is_private == False,
                Playlist.updated_at >= date
            ).subquery()
        )

        playlist_before_date = (
            session.query(
                Playlist.playlist_id,
                Playlist.updated_at
            ).distinct(
                Playlist.playlist_id
            ).filter(
                Playlist.is_private == True,
                Playlist.updated_at < date
            ).subquery()
        )

        previously_private_results = session.query(
            playlist_before_date.c['playlist_id']
        ).join(
            playlist_after_date,
            playlist_after_date.c['playlist_id'] == playlist_before_date.c['playlist_id'],
        ).all()

        playlist_ids = [result[0] for result in previously_private_results]

    return api_helpers.success_response({ 'ids': playlist_ids })
