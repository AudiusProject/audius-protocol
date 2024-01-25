import re

from flask import Blueprint, Response, request

from src import api_helpers, exceptions
from src.queries.get_cid_source import get_cid_source
from src.queries.get_feed import get_feed
from src.queries.get_follow_intersection_users import get_follow_intersection_users
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_followers_for_user import get_followers_for_user
from src.queries.get_latest_entities import get_latest_entities
from src.queries.get_playlist_repost_intersection_users import (
    get_playlist_repost_intersection_users,
)
from src.queries.get_playlists import get_playlists
from src.queries.get_previously_private_playlists import (
    get_previously_private_playlists,
)
from src.queries.get_previously_unlisted_tracks import get_previously_unlisted_tracks
from src.queries.get_remix_track_parents import get_remix_track_parents
from src.queries.get_remixes_of import get_remixes_of
from src.queries.get_repost_feed_for_user import get_repost_feed_for_user
from src.queries.get_reposters_for_playlist import get_reposters_for_playlist
from src.queries.get_reposters_for_track import get_reposters_for_track
from src.queries.get_savers_for_playlist import get_savers_for_playlist
from src.queries.get_savers_for_track import get_savers_for_track
from src.queries.get_saves import get_saves
from src.queries.get_sitemap import (
    build_default,
    get_playlist_page,
    get_playlist_root,
    get_track_page,
    get_track_root,
    get_user_page,
    get_user_root,
)
from src.queries.get_sol_plays import (
    get_sol_play,
    get_total_aggregate_plays,
    get_track_listen_milestones,
)
from src.queries.get_stems_of import get_stems_of
from src.queries.get_top_followee_saves import get_top_followee_saves
from src.queries.get_top_followee_windowed import get_top_followee_windowed
from src.queries.get_top_genre_users import get_top_genre_users
from src.queries.get_top_playlists import get_top_playlists
from src.queries.get_track_repost_intersection_users import (
    get_track_repost_intersection_users,
)
from src.queries.get_tracks import get_tracks
from src.queries.get_tracks_including_unlisted import get_tracks_including_unlisted
from src.queries.get_user_history import get_user_history
from src.queries.get_users import get_users
from src.queries.get_users_account import get_users_account
from src.queries.query_helpers import get_current_user_id, get_pagination_vars
from src.utils.db_session import get_db_read_replica
from src.utils.redis_metrics import record_metrics
from src.utils.structured_logger import StructuredLogger, log_duration

logger = StructuredLogger(__name__)
bp = Blueprint("queries", __name__)


def to_dict(multi_dict):
    """Converts a multi dict into a dict where only list entries are not flat"""
    return {
        k: v if len(v) > 1 else v[0]
        for (k, v) in multi_dict.to_dict(flat=False).items()
    }


def parse_bool_param(field):
    """Converts a url param to a boolean value"""
    return field.lower() == "true" if field else False


def parse_id_array_param(list):
    """Converts a list of strings ids to int"""
    return [int(y) for y in list]


# ####### ROUTES ####### #


# Returns all users (paginated) with each user's follow count
# Optionally filters by wallet or user ids
@bp.route("/users", methods=("GET",))
@record_metrics
def get_users_route():
    args = to_dict(request.args)
    if "id" in request.args:
        args["id"] = parse_id_array_param(request.args.getlist("id"))
    if "min_block_number" in request.args:
        args["min_block_number"] = request.args.get("min_block_number", type=int)
    if "include_incomplete" in request.args:
        args["include_incomplete"] = parse_bool_param(
            request.args.get("include_incomplete")
        )
    current_user_id = get_current_user_id(required=False)
    args["current_user_id"] = current_user_id
    users = get_users(args)

    def validate_hidden_fields(user, current_user_id):
        if "playlist_library" in user and (
            not current_user_id or current_user_id != user["user_id"]
        ):
            del user["playlist_library"]
        return user

    users = list(map(lambda user: validate_hidden_fields(user, current_user_id), users))
    return api_helpers.success_response(users)


# Returns all tracks (paginated) with each track's repost count
# optionally filters by track ids
@bp.route("/tracks", methods=("GET",))
@record_metrics
def get_tracks_route():
    args = to_dict(request.args)
    if "id" in request.args:
        args["id"] = parse_id_array_param(request.args.getlist("id"))
    if "user_id" in request.args:
        args["user_id"] = request.args.get("user_id", type=int)
    if "filter_deleted" in request.args:
        args["filter_deleted"] = parse_bool_param(request.args.get("filter_deleted"))
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    if "min_block_number" in request.args:
        args["min_block_number"] = request.args.get("min_block_number", type=int)
    current_user_id = get_current_user_id(required=False)
    args["current_user_id"] = current_user_id
    args["skip_unlisted_filter"] = True
    args["skip_stem_of_filter"] = True
    tracks = get_tracks(args)
    return api_helpers.success_response(tracks)


# Get all tracks matching a route_id and track_id.
# Expects a JSON body of shape:
#   { "tracks": [{ "id": number, "url_title": string, "handle": string }]}
@bp.route("/tracks_including_unlisted", methods=("POST",))
@record_metrics
def get_tracks_including_unlisted_route():
    args = to_dict(request.args)
    if "filter_deleted" in request.args:
        args["filter_deleted"] = parse_bool_param(request.args.get("filter_deleted"))
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    current_user_id = get_current_user_id(required=False)
    args["current_user_id"] = current_user_id
    identifiers = request.get_json()["tracks"]
    args["identifiers"] = identifiers
    tracks = get_tracks_including_unlisted(args)
    return api_helpers.success_response(tracks)


@bp.route("/stems/<int:track_id>", methods=("GET",))
@record_metrics
def get_stems_of_route(track_id):
    stems = get_stems_of(track_id)
    return api_helpers.success_response(stems)


# Return playlist content in json form
# optional parameters playlist owner's user_id, playlist_id = []
@bp.route("/playlists", methods=("GET",))
@record_metrics
def get_playlists_route():
    args = {}
    if "playlist_id" in request.args:
        args["playlist_ids"] = [int(y) for y in request.args.getlist("playlist_id")]
    if "user_id" in request.args:
        args["user_id"] = request.args.get("user_id", type=int)
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    args["current_user_id"] = get_current_user_id(required=False)
    playlists = get_playlists(args)
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
@log_duration(logger)
@record_metrics
def get_feed_route():
    args = to_dict(request.args)
    # filter should be one of ["all", "reposts", "original"]
    # empty filter value results in "all"
    if "filter" in request.args and request.args.get("filter") in [
        "all",
        "repost",
        "original",
    ]:
        args["filter"] = args.get("filter")
    else:
        args["filter"] = "all"
    if "tracks_only" in request.args:
        args["tracks_only"] = parse_bool_param(request.args.get("tracks_only"))
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    if "followee_user_id" in request.args:
        args["followee_user_ids"] = parse_id_array_param(
            request.args.getlist("followee_user_id")
        )
    user_id = get_current_user_id()
    args["user_id"] = user_id
    feed_results = get_feed(args)
    return api_helpers.success_response(feed_results)


# user repost feed steps
# - get all reposts by user
# - get all track and public playlist reposts by user, ordered by timestamp
# - get additional metadata for each track/playlist: save count, repost count, current_user_reposted, followee_reposts
# -   (if current_user == user, skip current_user_reposted check and set all to true)
# - combine unsorted playlist and track arrays
# - sort combined results by activity_timestamp field and return
@bp.route("/feed/reposts/<int:user_id>", methods=("GET",))
@record_metrics
def get_repost_feed_for_user_route(user_id):
    args = to_dict(request.args)
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    args["current_user_id"] = get_current_user_id(required=False)
    feed_results = get_repost_feed_for_user(user_id, args)
    return api_helpers.success_response(feed_results)


# intersection of user1's followers and user2's followees
# get intersection of users that follow followeeUserId and users that are followed by followerUserId
# followee = user that is followed; follower = user that follows
@bp.route(
    "/users/intersection/follow/<int:followee_user_id>/<int:follower_user_id>",
    methods=("GET",),
)
@record_metrics
def get_follow_intersection_users_route(followee_user_id, follower_user_id):
    users = get_follow_intersection_users(followee_user_id, follower_user_id)
    return api_helpers.success_response(users)


# get intersection of users that have reposted provided repost_track_id and users that are
# followed by follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_track_id = track that is reposted. repost_user_id = user that reposted track.
@bp.route(
    "/users/intersection/repost/track/<int:repost_track_id>/<int:follower_user_id>",
    methods=("GET",),
)
@record_metrics
def get_track_repost_intersection_users_route(repost_track_id, follower_user_id):
    try:
        users = get_track_repost_intersection_users(repost_track_id, follower_user_id)
        return api_helpers.success_response(users)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get intersection of users that have reposted provided repost_playlist_id and users that
# are followed by provided follower_user_id.
# - Followee = user that is followed. Follower = user that follows.
# - repost_playlist_id = playlist that is reposted. repost_user_id = user that reposted playlist.
@bp.route(
    "/users/intersection/repost/playlist/<int:repost_playlist_id>/<int:follower_user_id>",
    methods=("GET",),
)
@record_metrics
def get_playlist_repost_intersection_users_route(repost_playlist_id, follower_user_id):
    try:
        users = get_playlist_repost_intersection_users(
            repost_playlist_id, follower_user_id
        )
        return api_helpers.success_response(users)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that follow provided followee_user_id, sorted by their follower count descending.
@bp.route("/users/followers/<int:followee_user_id>", methods=("GET",))
@record_metrics
def get_followers_for_user_route(followee_user_id):
    current_user_id = get_current_user_id(required=False)
    (limit, offset) = get_pagination_vars()
    args = {
        "followee_user_id": followee_user_id,
        "current_user_id": current_user_id,
        "limit": limit,
        "offset": offset,
    }
    users = get_followers_for_user(args)
    return api_helpers.success_response(users)


# Get paginated users that are followed by provided follower_user_id, sorted by their follower count descending.
@bp.route("/users/followees/<int:follower_user_id>", methods=("GET",))
@record_metrics
def get_followees_for_user_route(follower_user_id):
    current_user_id = get_current_user_id(required=False)
    (limit, offset) = get_pagination_vars()
    args = {
        "follower_user_id": follower_user_id,
        "current_user_id": current_user_id,
        "limit": limit,
        "offset": offset,
    }
    users = get_followees_for_user(args)
    return api_helpers.success_response(users)


# Get paginated users that reposted provided repost_track_id, sorted by their follower count descending.
@bp.route("/users/reposts/track/<int:repost_track_id>", methods=("GET",))
@record_metrics
def get_reposters_for_track_route(repost_track_id):
    try:
        current_user_id = get_current_user_id(required=False)
        (limit, offset) = get_pagination_vars()
        args = {
            "repost_track_id": repost_track_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        user_results = get_reposters_for_track(args)
        return api_helpers.success_response(user_results)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that reposted provided repost_playlist_id, sorted by their follower count descending.
@bp.route("/users/reposts/playlist/<int:repost_playlist_id>", methods=("GET",))
@record_metrics
def get_reposters_for_playlist_route(repost_playlist_id):
    try:
        current_user_id = get_current_user_id(required=False)
        (limit, offset) = get_pagination_vars()
        args = {
            "repost_playlist_id": repost_playlist_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        user_results = get_reposters_for_playlist(args)
        return api_helpers.success_response(user_results)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that saved provided save_track_id, sorted by their follower count descending.
@bp.route("/users/saves/track/<int:save_track_id>", methods=("GET",))
@record_metrics
def get_savers_for_track_route(save_track_id):
    try:
        current_user_id = get_current_user_id(required=False)
        (limit, offset) = get_pagination_vars()
        args = {
            "save_track_id": save_track_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        user_results = get_savers_for_track(args)
        return api_helpers.success_response(user_results)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated users that saved provided save_playlist_id, sorted by their follower count descending.
@bp.route("/users/saves/playlist/<int:save_playlist_id>", methods=("GET",))
@record_metrics
def get_savers_for_playlist_route(save_playlist_id):
    try:
        current_user_id = get_current_user_id(required=False)
        (limit, offset) = get_pagination_vars()
        args = {
            "save_playlist_id": save_playlist_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        user_results = get_savers_for_playlist(args)
        return api_helpers.success_response(user_results)
    except exceptions.NotFoundError as e:
        return api_helpers.error_response(str(e), 404)


# Get paginated saves of provided save_type for current user.
@bp.route("/saves/<save_type>", methods=("GET",))
@record_metrics
def get_saves_route(save_type):
    try:
        user_id = get_current_user_id()
        save_results = get_saves(save_type, user_id)
        return api_helpers.success_response(save_results)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get the user saved collections & uploaded collections along with the collection user owners
# NOTE: This is a one off endpoint for retrieving a user's collections/associated user and should
# be consolidated later in the client
@bp.route("/users/account", methods=("GET",))
@record_metrics
def get_users_account_route():
    try:
        user = get_users_account(to_dict(request.args))
        return api_helpers.success_response(user)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Gets the max id for tracks, playlists, or users.
@bp.route("/latest/<type>", methods=("GET",))
@record_metrics
def get_latest_entities_route(type):
    try:
        args = to_dict(request.args)
        if "limit" in request.args:
            args["limit"] = min(request.args.get("limit", type=int), 100)
        else:
            args["limit"] = 1
        if "offset" in request.args:
            args["offset"] = request.args.get("offset", type=int)
        else:
            args["offset"] = 0

        latest = get_latest_entities(type, args)
        return api_helpers.success_response(latest)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/top/<type>", methods=("GET",))
@record_metrics
def get_top_playlists_route(type):
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
    args = to_dict(request.args)
    if "limit" in request.args:
        args["limit"] = min(request.args.get("limit", type=int), 100)
    else:
        args["limit"] = 16

    if "mood" in request.args:
        args["mood"] = request.args.get("mood")
    else:
        args["mood"] = None
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))

    current_user_id = get_current_user_id(required=False)
    args["current_user_id"] = current_user_id

    try:
        playlists = get_top_playlists(type, args)
        return api_helpers.success_response(playlists)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/top_followee_windowed/<type>/<window>")
@record_metrics
def get_top_followee_windowed_route(type, window):
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
    args = to_dict(request.args)
    if "limit" in request.args:
        args["limit"] = min(request.args.get("limit", type=int), 100)
    else:
        args["limit"] = 25
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    user_id = get_current_user_id()
    args["user_id"] = user_id
    try:
        tracks = get_top_followee_windowed(type, window, args)
        return api_helpers.success_response(tracks)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/top_followee_saves/<type>")
@record_metrics
def get_top_followee_saves_route(type):
    """
    Gets a global view into the most saved of `type` amongst followees. Requires an account.
    This endpoint is useful in generating views like:
        - Most favorited

    Args:
        type: (string) The `type` (same as repost/save type) to query from. Currently only
            track is supported.
        limit?: (number) default=25, max=100
    """
    args = to_dict(request.args)
    if "limit" in request.args:
        args["limit"] = min(request.args.get("limit", type=int), 100)
    else:
        args["limit"] = 25
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    user_id = get_current_user_id()
    args["user_id"] = user_id
    try:
        tracks = get_top_followee_saves(type, args)
        return api_helpers.success_response(tracks)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Retrieves the top users for a requested genre under the follow parameters
# - A given user can only be associated w/ one genre
# - The user's associated genre is calculated by tallying the genre of the tracks and taking the max
#   - If there is a tie for # of tracks in a genre, then the first genre alphabetically is taken
# - The users associated w/ the requested genre are then sorted by follower count
# Route Parameters
#   urlParam: {Array<string>?}  genre       List of genres to query for the 'top' users
#   urlParam: {boolean?}        with_user
#             Boolean if the response should be the user ID or user metadata defaults to false
@bp.route("/users/genre/top", methods=("GET",))
@record_metrics
def get_top_genre_users_route():
    args = to_dict(request.args)
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    users = get_top_genre_users(args)
    return api_helpers.success_response({ "user_ids": users })


# Get the tracks that are 'children' remixes of the requested track
# The results are sorted by if the original artist has reposted or saved the track
@bp.route("/remixes/<int:track_id>/children", methods=("GET",))
@record_metrics
def get_remixes_of_route(track_id):
    args = to_dict(request.args)
    args["track_id"] = track_id
    args["current_user_id"] = get_current_user_id(required=False)
    limit, offset = get_pagination_vars()
    args["limit"] = limit
    args["offset"] = offset
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    try:
        remixes = get_remixes_of(args)
        return api_helpers.success_response(remixes)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get the tracks that are 'parent' remixes of the requested track
@bp.route("/remixes/<int:track_id>/parents", methods=("GET",))
@record_metrics
def get_remix_track_parents_route(track_id):
    args = to_dict(request.args)
    if "with_users" in request.args:
        args["with_users"] = parse_bool_param(request.args.get("with_users"))
    args["track_id"] = track_id
    args["current_user_id"] = get_current_user_id(required=False)
    limit, offset = get_pagination_vars()
    args["limit"] = limit
    args["offset"] = offset
    tracks = get_remix_track_parents(args)
    return api_helpers.success_response(tracks)


# Get the tracks that were previously unlisted and became public after the date provided
@bp.route("/previously_unlisted/track", methods=("GET",))
@record_metrics
def get_previously_unlisted_tracks_route():
    try:
        tracks = get_previously_unlisted_tracks(to_dict(request.args))
        return api_helpers.success_response(tracks)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get the playlists that were previously private and became public after the date provided
@bp.route("/previously_private/playlist", methods=("GET",))
@record_metrics
def get_previously_private_playlists_route():
    try:
        playlists = get_previously_private_playlists(to_dict(request.args))
        return api_helpers.success_response(playlists)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get details for a single play written to Solana
@bp.route("/get_sol_play", methods=("GET",))
def get_sol_play_tx():
    try:
        # Assign value only if not None or empty string
        tx_sig = request.args.get("tx_sig") or None
        sig = get_sol_play(tx_sig)
        return api_helpers.success_response(sig)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get total aggregate play count
@bp.route("/get_total_aggregate_plays", methods=("GET",))
def get_total_plays():
    try:
        data = get_total_aggregate_plays()
        return api_helpers.success_response(data)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


# Get details for latest track listen milestones
# Used to parse and issue notifications
@bp.route("/track_listen_milestones", methods=("GET",))
def get_track_listen_milestone_data():
    try:
        # Assign value only if not None or empty string
        data = get_track_listen_milestones(100)
        return api_helpers.success_response(data)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/cid/source/<string:request_cid>", methods=("GET",))
def get_cid_source_route(request_cid):
    try:
        cid_source = get_cid_source(request_cid)
        return api_helpers.success_response(cid_source)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/users/history/<int:user_id>", methods=("GET",))
def get_user_history_route(user_id):
    try:
        (limit, offset) = get_pagination_vars()
        args = {
            "user_id": user_id,
            "limit": limit,
            "offset": offset,
        }
        user_history = get_user_history(args)
        return api_helpers.success_response(user_history)
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/sitemaps/default.xml", methods=("GET",))
def get_base_sitemap():
    try:
        default_sitemap = build_default()
        return Response(default_sitemap, mimetype="text/xml")
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/sitemaps/<string:type>/index.xml", methods=("GET",))
def get_type_base_sitemap(type):
    try:
        db = get_db_read_replica()
        with db.scoped_session() as session:
            xml = ""
            if type == "playlist":
                xml = get_playlist_root(session)
            elif type == "track":
                xml = get_track_root(session)
            elif type == "user":
                xml = get_user_root(session)
            else:
                return api_helpers.error_response(
                    f"Invalid sitemap type {type}, should be one of playlist, track, user",
                    400,
                )
            return Response(xml, mimetype="text/xml")
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)


@bp.route("/sitemaps/<string:type>/<string:file_name>", methods=("GET",))
def get_type_sitemap_page(type: str, file_name: str):
    try:
        number = re.search("(\d+)\.xml$", file_name)  # noqa: W605
        if not number:
            return api_helpers.error_response(
                f"Invalid filepath {file_name}, should be of format <integer>.xml", 400
            )
        page_number = int(number.group(1))
        db = get_db_read_replica()
        with db.scoped_session() as session:
            xml = ""
            if type == "playlist":
                xml = get_playlist_page(session, page_number)
            elif type == "track":
                xml = get_track_page(session, page_number)
            elif type == "user":
                xml = get_user_page(session, page_number)
            else:
                return api_helpers.error_response(
                    f"Invalid sitemap type {type}, should be one of playlist, track, user",
                    400,
                )
            return Response(xml, mimetype="text/xml")
    except exceptions.ArgumentError as e:
        return api_helpers.error_response(str(e), 400)
