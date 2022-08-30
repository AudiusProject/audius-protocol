import base64
import json
import logging

from eth_account.messages import encode_defunct
from flask_restx import Namespace, Resource, fields, reqparse
from src.api.v1.helpers import (
    DescriptiveArgument,
    abort_bad_request_param,
    abort_not_found,
    current_user_parser,
    decode_with_abort,
    extend_activity,
    extend_challenge_response,
    extend_favorite,
    extend_supporter,
    extend_supporting,
    extend_track,
    extend_user,
    format_limit,
    format_offset,
    format_query,
    format_sort_direction,
    format_sort_method,
    get_current_user_id,
    get_default_max,
    make_full_response,
    make_response,
    pagination_parser,
    pagination_with_current_user_parser,
    search_parser,
    success_response,
    track_history_parser,
    user_favorited_tracks_parser,
    user_tracks_route_parser,
    verify_token_parser,
)
from src.api.v1.models.activities import activity_model, activity_model_full
from src.api.v1.models.common import favorite
from src.api.v1.models.support import (
    supporter_response,
    supporter_response_full,
    supporting_response,
    supporting_response_full,
)
from src.api.v1.models.tracks import track, track_full
from src.api.v1.models.users import (
    associated_wallets,
    challenge_response,
    connected_wallets,
    decoded_user_token,
    encoded_user_id,
    user_model,
    user_model_full,
    user_replica_set,
)
from src.api.v1.playlists import get_tracks_for_playlist
from src.challenges.challenge_event_bus import setup_challenge_bus
from src.queries.get_associated_user_id import get_associated_user_id
from src.queries.get_associated_user_wallet import get_associated_user_wallet
from src.queries.get_challenges import get_challenges
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_followers_for_user import get_followers_for_user
from src.queries.get_related_artists import get_related_artists
from src.queries.get_repost_feed_for_user import get_repost_feed_for_user
from src.queries.get_save_tracks import GetSaveTracksArgs, get_save_tracks
from src.queries.get_saves import get_saves
from src.queries.get_support_for_user import (
    get_support_received_by_user,
    get_support_sent_by_user,
)
from src.queries.get_top_genre_users import get_top_genre_users
from src.queries.get_top_user_track_tags import get_top_user_track_tags
from src.queries.get_top_users import get_top_users
from src.queries.get_tracks import GetTrackArgs, get_tracks
from src.queries.get_user_listening_history import (
    GetUserListeningHistoryArgs,
    get_user_listening_history,
)
from src.queries.get_user_with_wallet import get_user_with_wallet
from src.queries.get_users import get_users
from src.queries.get_users_cnode import ReplicaType, get_users_cnode
from src.queries.search_queries import SearchKind, search
from src.utils import web3_provider
from src.utils.auth_middleware import auth_middleware
from src.utils.config import shared_config
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import decode_string_id, encode_int_id
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics

logger = logging.getLogger(__name__)

ns = Namespace("users", description="User related operations")
full_ns = Namespace("users", description="Full user operations")

user_response = make_response("user_response", ns, fields.Nested(user_model))
full_user_response = make_full_response(
    "full_user_response", full_ns, fields.List(fields.Nested(user_model_full))
)

# Cache TTL in seconds for the v1/full/users/content_node route
GET_USERS_CNODE_TTL_SEC = shared_config["discprov"]["get_users_cnode_ttl_sec"]


def get_single_user(user_id, current_user_id):
    args = {"id": [user_id], "current_user_id": current_user_id}
    users = get_users(args)
    if not users:
        abort_not_found(user_id, ns)
    user = extend_user(users[0], current_user_id)
    return success_response(user)


USER_ROUTE = "/<string:id>"


@ns.route(USER_ROUTE)
class User(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User""",
        description="Gets a single user by their user ID",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(user_response)
    @cache(ttl_sec=5)
    def get(self, id):
        user_id = decode_with_abort(id, ns)
        return get_single_user(user_id, None)


@full_ns.route(USER_ROUTE)
class FullUser(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User""",
        description="Gets a single user by their user ID",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(current_user_parser)
    @full_ns.marshal_with(full_user_response)
    @cache(ttl_sec=5)
    def get(self, id):
        user_id = decode_with_abort(id, ns)
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        return get_single_user(user_id, current_user_id)


USER_HANDLE_ROUTE = "/handle/<string:handle>"


@full_ns.route(USER_HANDLE_ROUTE)
class FullUserHandle(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, handle):
        args = current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        args = {"handle": handle, "current_user_id": current_user_id}
        users = get_users(args)
        if not users:
            abort_not_found(handle, ns)
        user = extend_user(users[0])
        return success_response(user)

    @full_ns.doc(
        id="""Get User by Handle""",
        description="Gets a single user by their handle",
        params={"handle": "A User handle"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(current_user_parser)
    @full_ns.marshal_with(full_user_response)
    def get(self, handle):
        return self._get(handle)


@ns.route(USER_HANDLE_ROUTE)
class UserHandle(FullUserHandle):
    @ns.doc(
        id="""Get User by Handle""",
        description="Gets a single user by their handle",
        params={"handle": "A User handle"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(user_response)
    def get(self, handle):
        return super()._get(handle)


USER_TRACKS_ROUTE = "/<string:id>/tracks"

tracks_response = make_response(
    "tracks_response", ns, fields.List(fields.Nested(track))
)


@ns.route(USER_TRACKS_ROUTE)
class TrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Tracks by User""",
        description="""Gets the tracks created by a user using their user ID""",
        params={
            "id": "A User ID",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(user_tracks_route_parser)
    @ns.marshal_with(tracks_response)
    @auth_middleware()
    @cache(ttl_sec=5)
    def get(self, id, authed_user_id=None):
        decoded_id = decode_with_abort(id, ns)
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        sort = args.get("sort", None)  # Deprecated
        offset = format_offset(args)
        limit = format_limit(args)
        query = format_query(args)
        sort_method = format_sort_method(args)
        sort_direction = format_sort_direction(args)

        args = GetTrackArgs(
            user_id=decoded_id,
            authed_user_id=authed_user_id,
            current_user_id=current_user_id,
            filter_deleted=True,
            exclude_premium=True,
            sort=sort,
            limit=limit,
            offset=offset,
            query=query,
            sort_method=sort_method,
            sort_direction=sort_direction,
            # Unused
            handle=None,
            id=None,
            min_block_number=None,
            routes=None,
        )
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


full_tracks_response = make_full_response(
    "full_tracks", full_ns, fields.List(fields.Nested(track_full))
)


@full_ns.route(USER_TRACKS_ROUTE)
class FullTrackList(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get Tracks by User""",
        description="""Gets the tracks created by a user using their user ID""",
        params={
            "id": "A User ID",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(user_tracks_route_parser)
    @full_ns.marshal_with(full_tracks_response)
    @auth_middleware()
    @cache(ttl_sec=5)
    def get(self, id, authed_user_id=None):
        decoded_id = decode_with_abort(id, ns)
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        offset = format_offset(args)
        limit = format_limit(args)
        query = format_query(args)

        sort = args.get("sort", None)  # Deprecated
        sort_method = format_sort_method(args)
        sort_direction = format_sort_direction(args)
        if sort_method:
            sort = None

        args = GetTrackArgs(
            user_id=decoded_id,
            authed_user_id=authed_user_id,
            current_user_id=current_user_id,
            filter_deleted=True,
            exclude_premium=False,
            sort=sort,
            limit=limit,
            offset=offset,
            query=query,
            sort_method=sort_method,
            sort_direction=sort_direction,
            # Unused
            handle=None,
            id=None,
            min_block_number=None,
            routes=None,
        )
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


USER_HANDLE_TRACKS = "/handle/<string:handle>/tracks"


@full_ns.route(USER_HANDLE_TRACKS)
class HandleFullTrackList(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, handle, authed_user_id=None):
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "handle": handle,
            "current_user_id": current_user_id,
            "authed_user_id": authed_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset,
        }
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)

    @auth_middleware()
    @full_ns.doc(
        id="""Get Tracks by User Handle""",
        description="""Gets the tracks created by a user using the user's handle""",
        params={
            "handle": "A User handle",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(user_tracks_route_parser)
    @full_ns.marshal_with(full_tracks_response)
    def get(self, handle, authed_user_id=None):
        return self._get(handle, authed_user_id)


@ns.route(USER_HANDLE_TRACKS)
class HandleTrackList(HandleFullTrackList):
    @auth_middleware()
    @ns.doc(
        id="""Get Tracks by User Handle""",
        description="""Gets the tracks created by a user using the user's handle""",
        params={
            "handle": "A User handle",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(user_tracks_route_parser)
    @ns.marshal_with(tracks_response)
    def get(self, handle, authed_user_id):
        return super()._get(handle, authed_user_id)


USER_REPOSTS_ROUTE = "/<string:id>/reposts"

reposts_response = make_response(
    "reposts", ns, fields.List(fields.Nested(activity_model))
)
full_reposts_response = make_full_response(
    "full_reposts", full_ns, fields.List(fields.Nested(activity_model_full))
)


@ns.route(USER_REPOSTS_ROUTE)
class RepostList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Reposts""",
        description="""Gets the given user's reposts""",
        params={
            "id": "A User ID",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(reposts_response)
    @cache(ttl_sec=5)
    def get(self, id):
        decoded_id = decode_with_abort(id, ns)
        args = pagination_with_current_user_parser.parse_args()

        current_user_id = get_current_user_id(args)

        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "limit": limit,
            "offset": offset,
        }
        reposts = get_repost_feed_for_user(decoded_id, args)
        activities = list(map(extend_activity, reposts))

        return success_response(activities)


@full_ns.route(USER_REPOSTS_ROUTE)
class FullRepostList(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get Reposts""",
        description="""Gets the given user's reposts""",
        params={
            "id": "A User ID",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_reposts_response)
    @cache(ttl_sec=5)
    def get(self, id):
        decoded_id = decode_with_abort(id, ns)
        args = pagination_with_current_user_parser.parse_args()

        current_user_id = get_current_user_id(args)

        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "limit": limit,
            "offset": offset,
        }
        reposts = get_repost_feed_for_user(decoded_id, args)
        for repost in reposts:
            if "playlist_id" in repost:
                repost["tracks"] = get_tracks_for_playlist(
                    repost["playlist_id"], current_user_id
                )
        activities = list(map(extend_activity, reposts))

        return success_response(activities)


REPOST_LIST_ROUTE = "/handle/<string:handle>/reposts"


@full_ns.route(REPOST_LIST_ROUTE)
class HandleFullRepostList(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, handle):
        args = pagination_with_current_user_parser.parse_args()

        current_user_id = get_current_user_id(args)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "handle": handle,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "limit": limit,
            "offset": offset,
        }
        reposts = get_repost_feed_for_user(None, args)
        for repost in reposts:
            if "playlist_id" in repost:
                repost["tracks"] = get_tracks_for_playlist(
                    repost["playlist_id"], current_user_id
                )
        activities = list(map(extend_activity, reposts))

        return success_response(activities)

    @full_ns.doc(
        id="""Get Reposts by Handle""",
        description="""Gets the user's reposts by the user handle""",
        params={
            "handle": "A User handle",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_reposts_response)
    def get(self, handle):
        return self._get(handle)


@ns.route(REPOST_LIST_ROUTE)
class HandleRepostList(HandleFullRepostList):
    @ns.doc(
        id="""Get Reposts by Handle""",
        description="""Gets the user's reposts by the user handle""",
        params={
            "handle": "A User handle",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(reposts_response)
    def get(self, handle):
        return super()._get(handle)


tags_route_parser = pagination_with_current_user_parser.copy()
tags_route_parser.remove_argument("offset")
tags_response = make_response("tags_response", ns, fields.List(fields.String))


@ns.route("/<string:id>/tags")
class MostUsedTags(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Top Track Tags""",
        description="""Gets the most used track tags by a user.""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(tags_route_parser)
    @ns.marshal_with(tags_response)
    @cache(ttl_sec=60 * 5)
    def get(self, id):
        """Fetch most used tags in a user's tracks."""
        decoded_id = decode_with_abort(id, ns)
        args = tags_route_parser.parse_args()
        limit = format_limit(args)
        tags = get_top_user_track_tags({"user_id": decoded_id, "limit": limit})
        return success_response(tags)


favorites_response = make_response(
    "favorites_response", ns, fields.List(fields.Nested(favorite))
)
favorites_full_response = make_full_response(
    "favorites_response_full", full_ns, fields.List(fields.Nested(activity_model_full))
)


# different route from /<string:id>/favorites/tracks
@ns.route("/<string:id>/favorites")
class FavoritedTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Favorites""",
        description="""Gets a user's favorite tracks""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(favorites_response)
    @cache(ttl_sec=5)
    def get(self, id):
        decoded_id = decode_with_abort(id, ns)
        favorites = get_saves("tracks", decoded_id)
        favorites = list(map(extend_favorite, favorites))
        return success_response(favorites)


USER_FAVORITED_TRACKS_ROUTE = "/<string:id>/favorites/tracks"


@full_ns.route(USER_FAVORITED_TRACKS_ROUTE)
class UserFavoritedTracksFull(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id):
        """Fetch favorited tracks for a user."""
        args = user_favorited_tracks_parser.parse_args()
        decoded_id = decode_with_abort(id, ns)
        current_user_id = get_current_user_id(args)

        offset = format_offset(args)
        limit = format_limit(args)
        query = format_query(args)
        sort_method = format_sort_method(args)
        sort_direction = format_sort_direction(args)
        get_tracks_args = GetSaveTracksArgs(
            filter_deleted=False,
            user_id=decoded_id,
            current_user_id=current_user_id,
            limit=limit,
            offset=offset,
            query=query,
            sort_method=sort_method,
            sort_direction=sort_direction,
        )
        track_saves = get_save_tracks(get_tracks_args)
        tracks = list(map(extend_activity, track_saves))
        return success_response(tracks)

    @full_ns.doc(
        id="""Get Favorites""",
        description="""Gets a user's favorite tracks""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(user_favorited_tracks_parser)
    @full_ns.marshal_with(favorites_full_response)
    def get(self, id):
        return self._get(id)


history_response = make_full_response(
    "history_response", ns, fields.List(fields.Nested(activity_model))
)
history_response_full = make_full_response(
    "history_response_full", full_ns, fields.List(fields.Nested(activity_model_full))
)

USER_HISTORY_TRACKS_ROUTE = "/<string:id>/history/tracks"


@full_ns.route(USER_HISTORY_TRACKS_ROUTE)
class TrackHistoryFull(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id):
        args = track_history_parser.parse_args()
        decoded_id = decode_with_abort(id, ns)
        current_user_id = get_current_user_id(args)
        offset = format_offset(args)
        limit = format_limit(args)
        query = format_query(args)
        sort_method = format_sort_method(args)
        sort_direction = format_sort_direction(args)
        get_tracks_args = GetUserListeningHistoryArgs(
            user_id=decoded_id,
            current_user_id=current_user_id,
            limit=limit,
            offset=offset,
            query=query,
            sort_method=sort_method,
            sort_direction=sort_direction,
        )
        track_history = get_user_listening_history(get_tracks_args)
        tracks = list(map(extend_activity, track_history))
        return success_response(tracks)

    @full_ns.doc(
        id="""Get User's Track History""",
        description="""Get the tracks the user recently listened to.""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(track_history_parser)
    @full_ns.marshal_with(history_response_full)
    def get(self, id):
        return self._get(id)


@ns.route(USER_HISTORY_TRACKS_ROUTE)
class TrackHistory(TrackHistoryFull):
    @ns.doc(
        id="""Get User's Track History""",
        description="""Get the tracks the user recently listened to.""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(track_history_parser)
    @ns.marshal_with(history_response)
    def get(self, id):
        return super()._get(id)


user_search_result = make_response(
    "user_search", ns, fields.List(fields.Nested(user_model))
)


@ns.route("/search")
class UserSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Users""",
        description="""Search for users that match the given query""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(search_parser)
    @ns.marshal_with(user_search_result)
    @cache(ttl_sec=600)
    def get(self):
        args = search_parser.parse_args()
        query = args["query"]
        if not query:
            abort_bad_request_param("query", ns)
        search_args = {
            "query": query,
            "kind": SearchKind.users.name,
            "is_auto_complete": False,
            "current_user_id": None,
            "with_users": True,
            "limit": 10,
            "offset": 0,
            "exclude_premium": True,
        }
        response = search(search_args)
        return success_response(response["users"])


followers_response = make_full_response(
    "followers_response", ns, fields.List(fields.Nested(user_model))
)
full_followers_response = make_full_response(
    "full_followers_response", full_ns, fields.List(fields.Nested(user_model_full))
)

USER_FOLLOWERS_ROUTE = "/<string:id>/followers"


@full_ns.route(USER_FOLLOWERS_ROUTE)
class FullFollowerUsers(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id):
        decoded_id = decode_with_abort(id, full_ns)
        args = pagination_with_current_user_parser.parse_args()
        limit = get_default_max(args.get("limit"), 10, 100)
        offset = get_default_max(args.get("offset"), 0)
        current_user_id = get_current_user_id(args)
        args = {
            "followee_user_id": decoded_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        users = get_followers_for_user(args)
        users = list(map(extend_user, users))
        return success_response(users)

    @full_ns.doc(
        id="""Get Followers""",
        description="""All users that follow the provided user""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_followers_response)
    def get(self, id):
        return self._get(id)


@ns.route(USER_FOLLOWERS_ROUTE)
class FollowerUsers(FullFollowerUsers):
    @ns.doc(
        id="""Get Followers""",
        description="""All users that follow the provided user""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(followers_response)
    def get(self, id):
        return super()._get(id)


following_response = make_full_response(
    "following_response", ns, fields.List(fields.Nested(user_model))
)
following_response_full = make_full_response(
    "following_response_full", full_ns, fields.List(fields.Nested(user_model_full))
)

FOLLOWING_USERS_ROUTE = "/<string:id>/following"


@full_ns.route(FOLLOWING_USERS_ROUTE)
class FullFollowingUsers(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id):
        decoded_id = decode_with_abort(id, full_ns)
        args = pagination_with_current_user_parser.parse_args()
        limit = get_default_max(args.get("limit"), 10, 100)
        offset = get_default_max(args.get("offset"), 0)
        current_user_id = get_current_user_id(args)
        args = {
            "follower_user_id": decoded_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
        }
        users = get_followees_for_user(args)
        users = list(map(extend_user, users))
        return success_response(users)

    @full_ns.doc(
        id="""Get Followings""",
        description="""All users that the provided user follows""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(following_response_full)
    def get(self, id):
        return self._get(id)


@ns.route(FOLLOWING_USERS_ROUTE)
class FollowingUsers(FullFollowingUsers):
    @ns.doc(
        id="""Get Followings""",
        description="""All users that the provided user follows""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(following_response)
    def get(self, id):
        return super()._get(id)


related_artist_route_parser = pagination_with_current_user_parser.copy()
related_artist_route_parser.remove_argument("offset")
related_artist_response = make_response(
    "related_artist_response", ns, fields.List(fields.Nested(user_model))
)
related_artist_response_full = make_full_response(
    "related_artist_response_full", full_ns, fields.List(fields.Nested(user_model_full))
)

USER_RELATED_ROUTE = "/<string:id>/related"


@full_ns.route(USER_RELATED_ROUTE)
class FullRelatedUsers(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id):
        args = related_artist_route_parser.parse_args()
        limit = get_default_max(args.get("limit"), 10, 100)
        current_user_id = get_current_user_id(args)
        decoded_id = decode_with_abort(id, full_ns)
        users = get_related_artists(decoded_id, current_user_id, limit)
        users = list(map(extend_user, users))
        return success_response(users)

    @full_ns.doc(
        id="""Get Related Users""",
        description="""Gets a list of users that might be of interest to followers of this user.""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(related_artist_route_parser)
    @full_ns.marshal_with(related_artist_response_full)
    def get(self, id):
        return self._get(id)


@ns.route(USER_RELATED_ROUTE)
class RelatedUsers(FullRelatedUsers):
    @ns.doc(
        id="""Get Related Users""",
        description="""Gets a list of users that might be of interest to followers of this user.""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(related_artist_route_parser)
    @ns.marshal_with(related_artist_response)
    def get(self, id):
        return super()._get(id)


top_genre_users_route_parser = pagination_parser.copy()
top_genre_users_route_parser.add_argument(
    "genre", required=False, action="append", description="List of Genres"
)
top_genre_users_response = make_response(
    "top_genre_users_response", ns, fields.List(fields.Nested(user_model))
)
top_genre_users_response_full = make_full_response(
    "top_genre_users_response_full",
    full_ns,
    fields.List(fields.Nested(user_model_full)),
)

TOP_GENRE_ROUTE = "/genre/top"


@full_ns.route(TOP_GENRE_ROUTE)
class FullTopGenreUsers(Resource):
    @cache(ttl_sec=60 * 60 * 24)
    def _get(self):
        args = top_genre_users_route_parser.parse_args()
        limit = get_default_max(args.get("limit"), 10, 100)
        offset = get_default_max(args.get("offset"), 0)

        get_top_genre_users_args = {
            "limit": limit,
            "offset": offset,
            "with_users": True,
        }
        if args["genre"] is not None:
            get_top_genre_users_args["genre"] = args["genre"]
        top_users = get_top_genre_users(get_top_genre_users_args)
        users = list(map(extend_user, top_users["users"]))
        return success_response(users)

    @full_ns.doc(
        id="""Get Top Users In Genre""",
        description="""Get the Top Users for a Given Genre""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(top_genre_users_route_parser)
    @full_ns.marshal_with(top_genre_users_response_full)
    def get(self):
        return self._get()


@ns.route(TOP_GENRE_ROUTE)
class TopGenreUsers(FullTopGenreUsers):
    @ns.doc(
        id="""Get Top Users In Genre""",
        description="""Get the Top Users for a Given Genre""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(top_genre_users_route_parser)
    @ns.marshal_with(top_genre_users_response)
    def get(self):
        return super()._get()


top_users_response = make_response(
    "top_users_response", ns, fields.List(fields.Nested(user_model))
)
top_users_response_full = make_full_response(
    "top_users_response_full", full_ns, fields.List(fields.Nested(user_model_full))
)

TOP_ROUTE = "/top"


@full_ns.route(TOP_ROUTE)
class FullTopUsers(Resource):
    @cache(ttl_sec=60 * 60 * 24)
    def _get(self):
        args = pagination_with_current_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        top_users = get_top_users(current_user_id)
        users = list(map(extend_user, top_users))
        return success_response(users)

    @full_ns.doc(
        id="""Get Top Users""",
        description="""Get the Top Users having at least one track by follower count""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(top_users_response_full)
    def get(self):
        return self._get()


@ns.route(TOP_ROUTE)
class TopUsers(FullTopUsers):
    @ns.doc(
        id="""Get Top Users""",
        description="""Get the Top Users having at least one track by follower count""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(pagination_with_current_user_parser)
    @ns.marshal_with(top_users_response)
    def get(self):
        return super()._get()


associated_wallet_route_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
associated_wallet_route_parser.add_argument(
    "id", required=True, description="A User ID"
)
associated_wallet_response = make_response(
    "associated_wallets_response", ns, fields.Nested(associated_wallets)
)


@ns.deprecated
@ns.route(
    "/associated_wallets",
    doc=False,
)
class AssociatedWalletByUserId(Resource):
    @ns.doc(
        id="""Get Associated Wallets""",
        description="""Get the User's associated wallets""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(associated_wallet_route_parser)
    @ns.marshal_with(associated_wallet_response)
    @cache(ttl_sec=10)
    def get(self):
        args = associated_wallet_route_parser.parse_args()
        user_id = decode_with_abort(args.get("id"), ns)
        wallets = get_associated_user_wallet({"user_id": user_id})
        return success_response(
            {"wallets": wallets["eth"], "sol_wallets": wallets["sol"]}
        )


user_associated_wallet_route_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
user_associated_wallet_route_parser.add_argument(
    "associated_wallet", required=True, description="Wallet address"
)
user_associated_wallet_response = make_response(
    "user_associated_wallet_response", ns, fields.Nested(encoded_user_id)
)


@ns.route("/id")
class UserIdByAssociatedWallet(Resource):
    @ns.doc(
        id="""Get User ID from Wallet""",
        description="""Gets a User ID from an associated wallet address""",
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(user_associated_wallet_route_parser)
    @ns.marshal_with(user_associated_wallet_response)
    @cache(ttl_sec=10)
    def get(self):
        args = user_associated_wallet_route_parser.parse_args()
        user_id = get_associated_user_id({"wallet": args.get("associated_wallet")})
        return success_response(
            {"user_id": encode_int_id(user_id) if user_id else None}
        )


connected_wallets_response = make_response(
    "connected_wallets_response", ns, fields.Nested(connected_wallets)
)


@ns.route("/<string:id>/connected_wallets")
class ConnectedWallets(Resource):
    @ns.doc(
        id="""Get connected wallets""",
        description="""Get the User's ERC and SPL connected wallets""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(connected_wallets_response)
    @cache(ttl_sec=10)
    def get(self, id):
        decoded_id = decode_with_abort(id, full_ns)
        wallets = get_associated_user_wallet({"user_id": decoded_id})
        return success_response(
            {"erc_wallets": wallets["eth"], "spl_wallets": wallets["sol"]}
        )


users_by_content_node_route_parser = reqparse.RequestParser(
    argument_class=DescriptiveArgument
)
users_by_content_node_route_parser.add_argument(
    "creator_node_endpoint",
    required=True,
    type=str,
    description="Get users who have this Content Node endpoint as their primary/secondary",
)
users_by_content_node_route_parser.add_argument(
    "prev_user_id",
    required=False,
    type=int,
    description="Minimum user_id to return. Used for pagination as the offset after sorting in ascending order by user_id",
)
users_by_content_node_route_parser.add_argument(
    "max_users",
    required=False,
    type=int,
    description="Maximum number of users to return (SQL LIMIT)",
)
users_by_content_node_response = make_full_response(
    "users_by_content_node", full_ns, fields.List(fields.Nested(user_replica_set))
)


@full_ns.route("/content_node/<string:replica_type>", doc=False)
class UsersByContentNode(Resource):
    @ns.doc(
        id="""Get Users By Replica Type for Content Node""",
        description="""
        (Only consumed by Content Node) Gets users that have a given Content Node endpoint as
        their primary, secondary, or either (depending on the replica_type passed).
        Response = array of objects of schema {
            user_id, wallet, primary, secondary1, secondary2, primarySpId, secondary1SpID, secondary2SpID
        }
        """,
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(users_by_content_node_response)
    @cache(ttl_sec=GET_USERS_CNODE_TTL_SEC)
    def get(self, replica_type):
        args = users_by_content_node_route_parser.parse_args()

        # Endpoint that a user's primary/secondary/either must be set to for them to be included in the results
        cnode_url = args.get("creator_node_endpoint")
        # Used for pagination with ">" comparison in SQL query. See https://ivopereira.net/efficient-pagination-dont-use-offset-limit
        prev_user_id = args.get("prev_user_id")
        # LIMIT used in SQL query
        max_users = args.get("max_users")

        if replica_type == "primary":
            users = get_users_cnode(
                cnode_url, ReplicaType.PRIMARY, prev_user_id, max_users
            )
        elif replica_type == "secondary":
            users = get_users_cnode(
                cnode_url, ReplicaType.SECONDARY, prev_user_id, max_users
            )
        else:
            users = get_users_cnode(cnode_url, ReplicaType.ALL, prev_user_id, max_users)

        return success_response(users)


get_challenges_route_parser = reqparse.RequestParser(argument_class=DescriptiveArgument)
get_challenges_route_parser.add_argument(
    "show_historical",
    required=False,
    type=bool,
    default=False,
    description="Whether to show challenges that are inactive but completed",
)
get_challenges_response = make_response(
    "get_challenges", ns, fields.List(fields.Nested(challenge_response))
)


@ns.route("/<string:id>/challenges", doc=False)
class GetChallenges(Resource):
    @ns.doc(
        id="""Get User Challenges""",
        description="""Gets all challenges for the given user""",
        params={"id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.expect(get_challenges_route_parser)
    @ns.marshal_with(get_challenges_response)
    @cache(ttl_sec=5)
    def get(self, id: str):
        args = get_challenges_route_parser.parse_args()
        show_historical = args.get("show_historical")
        decoded_id = decode_with_abort(id, ns)
        db = get_db_read_replica()

        with db.scoped_session() as session:
            bus = setup_challenge_bus()
            challenges = get_challenges(decoded_id, show_historical, session, bus)
            challenges = list(map(extend_challenge_response, challenges))

            return success_response(challenges)


get_supporters_response = make_response(
    "get_supporters", ns, fields.List(fields.Nested(supporter_response))
)

USER_SUPPORTERS_ROUTE = "/<string:id>/supporters"


@ns.route(USER_SUPPORTERS_ROUTE)
class GetSupporters(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Supporters""",
        description="""Gets the supporters of the given user""",
        params={"id": "A User ID"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(get_supporters_response)
    @cache(ttl_sec=5)
    def get(self, id: str):
        args = pagination_parser.parse_args()
        decoded_id = decode_with_abort(id, ns)
        args["user_id"] = decoded_id
        support = get_support_received_by_user(args)
        support = list(map(extend_supporter, support))
        return success_response(support)


full_get_supporters_response = make_full_response(
    "full_get_supporters", full_ns, fields.List(fields.Nested(supporter_response_full))
)


@full_ns.route(USER_SUPPORTERS_ROUTE)
class FullGetSupporters(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get Supporters""",
        description="""Gets the supporters of the given user""",
        params={"id": "A User ID"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_get_supporters_response)
    @cache(ttl_sec=5)
    def get(self, id: str):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(id, full_ns)
        current_user_id = get_current_user_id(args)
        args["user_id"] = decoded_id
        args["current_user_id"] = current_user_id
        support = get_support_received_by_user(args)
        support = list(map(extend_supporter, support))
        return success_response(support)


get_supporter_response = make_response(
    "get_supporter", ns, fields.Nested(supporter_response)
)
full_get_supporter_response = make_full_response(
    "full_get_supporter", full_ns, fields.Nested(supporter_response_full)
)


SUPPORTER_USER_ROUTE = "/<string:id>/supporters/<string:supporter_user_id>"


@full_ns.route(SUPPORTER_USER_ROUTE)
class FullGetSupporter(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id: str, supporter_user_id: str):
        args = current_user_parser.parse_args()
        decoded_id = decode_with_abort(id, full_ns)
        current_user_id = get_current_user_id(args)
        decoded_supporter_user_id = decode_with_abort(supporter_user_id, full_ns)
        args["user_id"] = decoded_id
        args["current_user_id"] = current_user_id
        args["supporter_user_id"] = decoded_supporter_user_id
        support = get_support_received_by_user(args)
        support = list(map(extend_supporter, support))
        if not support:
            abort_not_found(supporter_user_id, full_ns)
        return success_response(support[0])

    @full_ns.doc(
        id="""Get Supporter""",
        description="""Gets the specified supporter of the given user""",
        params={"id": "A User ID", "supporter_user_id": "A User ID of a supporter"},
    )
    @full_ns.expect(current_user_parser)
    @full_ns.marshal_with(full_get_supporter_response)
    def get(self, id: str, supporter_user_id: str):
        return self._get(id, supporter_user_id)


@ns.route(SUPPORTER_USER_ROUTE)
class GetSupporter(FullGetSupporter):
    @ns.doc(
        id="""Get Supporter""",
        description="""Gets the specified supporter of the given user""",
        params={"id": "A User ID", "supporter_user_id": "A User ID of a supporter"},
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(get_supporter_response)
    def get(self, id: str, supporter_user_id: str):
        return super()._get(id, supporter_user_id)


get_supporting_response = make_response(
    "get_supporting", ns, fields.List(fields.Nested(supporting_response))
)

USER_SUPPORTINGS_ROUTE = "/<string:id>/supporting"


@ns.route(USER_SUPPORTINGS_ROUTE)
class GetSupportings(Resource):
    @record_metrics
    @ns.doc(
        id="""Get Supportings""",
        description="""Gets the users that the given user supports""",
        params={"id": "A User ID"},
    )
    @ns.expect(pagination_parser)
    @ns.marshal_with(get_supporting_response)
    @cache(ttl_sec=5)
    def get(self, id: str):
        args = pagination_parser.parse_args()
        decoded_id = decode_with_abort(id, ns)
        args["user_id"] = decoded_id
        support = get_support_sent_by_user(args)
        support = list(map(extend_supporting, support))
        return success_response(support)


full_get_supporting_response = make_full_response(
    "full_get_supporting", full_ns, fields.List(fields.Nested(supporting_response_full))
)

full_get_supporting_response = make_full_response(
    "full_get_supporting", full_ns, fields.List(fields.Nested(supporting_response_full))
)


@full_ns.route(USER_SUPPORTINGS_ROUTE)
class FullGetSupportings(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get Supportings""",
        description="""Gets the users that the given user supports""",
        params={"id": "A User ID"},
    )
    @full_ns.expect(pagination_with_current_user_parser)
    @full_ns.marshal_with(full_get_supporting_response)
    @cache(ttl_sec=5)
    def get(self, id: str):
        args = pagination_with_current_user_parser.parse_args()
        decoded_id = decode_with_abort(id, full_ns)
        current_user_id = get_current_user_id(args)
        args["user_id"] = decoded_id
        args["current_user_id"] = current_user_id
        support = get_support_sent_by_user(args)
        support = list(map(extend_supporting, support))
        return success_response(support)


full_get_supporting_response = make_full_response(
    "full_get_supporting", full_ns, fields.Nested(supporting_response_full)
)

GET_SUPPORTING_ROUTE = "/<string:id>/supporting/<string:supported_user_id>"


@full_ns.route(GET_SUPPORTING_ROUTE)
class FullGetSupporting(Resource):
    @record_metrics
    @cache(ttl_sec=5)
    def _get(self, id: str, supported_user_id: str):
        args = current_user_parser.parse_args()
        decoded_id = decode_with_abort(id, full_ns)
        current_user_id = get_current_user_id(args)
        decoded_supported_user_id = decode_with_abort(supported_user_id, full_ns)
        args["user_id"] = decoded_id
        args["current_user_id"] = current_user_id
        args["supported_user_id"] = decoded_supported_user_id
        support = get_support_sent_by_user(args)
        support = list(map(extend_supporting, support))
        if not support:
            abort_not_found(decoded_id, full_ns)
        return success_response(support[0])

    @full_ns.doc(
        id="""Get Supporting""",
        description="""Gets the support from the given user to the supported user""",
        params={
            "id": "A User ID",
            "supported_user_id": "A User ID of a supported user",
        },
    )
    @full_ns.expect(current_user_parser)
    @full_ns.marshal_with(full_get_supporting_response)
    def get(self, id: str, supported_user_id: str):
        return self._get(id, supported_user_id)


@ns.route(GET_SUPPORTING_ROUTE)
class GetSupporting(FullGetSupporting):
    @ns.doc(
        id="""Get Supporting""",
        description="""Gets the support from the given user to the supported user""",
        params={
            "id": "A User ID",
            "supported_user_id": "A User ID of a supported user",
        },
    )
    @ns.expect(current_user_parser)
    @ns.marshal_with(get_supporting_response)
    def get(self, id: str, supported_user_id: str):
        return super()._get(id, supported_user_id)


verify_token_response = make_response(
    "verify_token", ns, fields.Nested(decoded_user_token)
)


@ns.route("/verify_token")
class GetTokenVerification(Resource):
    @record_metrics
    @ns.doc(
        id="""Verify ID Token""",
        description="""Verify if the given jwt ID token was signed by the subject (user) in the payload""",
        responses={
            200: "Success",
            400: "Bad input",
            404: "ID token not valid",
            500: "Server error",
        },
    )
    @ns.expect(verify_token_parser)
    @ns.marshal_with(verify_token_response)
    def get(self):
        args = verify_token_parser.parse_args()
        # 1. Break JWT into parts
        token_parts = args["token"].split(".")
        if not len(token_parts) == 3:
            abort_bad_request_param("token", ns)

        # 2. Decode the signature
        try:
            signature = base64.urlsafe_b64decode(token_parts[2] + "==")
        except Exception:
            ns.abort(400, "The JWT signature could not be decoded.")

        signature = signature.decode()
        base64_header = token_parts[0]
        base64_payload = token_parts[1]
        message = f"{base64_header}.{base64_payload}"

        # 3. Recover message from signature
        web3 = web3_provider.get_web3()

        wallet = None
        encoded_message = encode_defunct(text=message)
        try:
            wallet = web3.eth.account.recover_message(
                encoded_message,
                signature=signature,
            )
        except Exception:
            ns.abort(
                404, "The JWT signature is invalid - wallet could not be recovered."
            )
        if not wallet:
            ns.abort(
                404, "The JWT signature is invalid - wallet could not be recovered."
            )

        # 4. Check that user from payload matches the user from the wallet from the signature
        try:
            stringified_payload = base64.urlsafe_b64decode(base64_payload + "==")
            payload = json.loads(stringified_payload)
        except Exception:
            ns.abort(400, "JWT payload could not be decoded.")

        wallet_user_id = get_user_with_wallet(wallet)
        if not wallet_user_id or (
            wallet_user_id != payload["userId"]
            and wallet_user_id != decode_string_id(payload["userId"])
        ):
            ns.abort(
                404,
                "The JWT signature is invalid - the wallet does not match the user.",
            )

        # 5. Send back the decoded payload
        return success_response(payload)
