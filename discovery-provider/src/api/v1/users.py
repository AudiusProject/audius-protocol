import logging
from src.utils.helpers import encode_int_id
from src.challenges.challenge_event_bus import setup_challenge_bus
from src.api.v1.playlists import get_tracks_for_playlist
from src.queries.get_repost_feed_for_user import get_repost_feed_for_user
from flask_restx import Resource, Namespace, fields, reqparse
from src.api.v1.models.common import favorite
from src.api.v1.models.users import (
    user_model,
    user_model_full,
    associated_wallets,
    encoded_user_id,
    user_replica_set,
    challenge_response,
)

from src.queries.get_saves import get_saves
from src.queries.get_users import get_users
from src.queries.search_queries import SearchKind, search
from src.queries.get_tracks import get_tracks
from src.queries.get_save_tracks import get_save_tracks
from src.queries.get_followees_for_user import get_followees_for_user
from src.queries.get_followers_for_user import get_followers_for_user
from src.queries.get_top_user_track_tags import get_top_user_track_tags
from src.queries.get_associated_user_wallet import get_associated_user_wallet
from src.queries.get_associated_user_id import get_associated_user_id
from src.queries.get_users_cnode import get_users_cnode, ReplicaType

from src.api.v1.helpers import (
    abort_not_found,
    decode_with_abort,
    extend_activity,
    extend_favorite,
    extend_track,
    extend_user,
    format_limit,
    format_offset,
    get_current_user_id,
    make_full_response,
    make_response,
    search_parser,
    success_response,
    abort_bad_request_param,
    get_default_max,
    extend_challenge_response,
)
from .models.tracks import track, track_full
from .models.activities import activity_model, activity_model_full
from src.utils.redis_cache import cache
from src.utils.redis_metrics import record_metrics
from src.queries.get_top_genre_users import get_top_genre_users
from src.queries.get_challenges import get_challenges
from src.utils.db_session import get_db_read_replica

logger = logging.getLogger(__name__)

ns = Namespace("users", description="User related operations")
full_ns = Namespace("users", description="Full user operations")

user_response = make_response("user_response", ns, fields.Nested(user_model))
full_user_response = make_full_response(
    "full_user_response", full_ns, fields.List(fields.Nested(user_model_full))
)


def get_single_user(user_id, current_user_id):
    args = {"id": [user_id], "current_user_id": current_user_id}
    users = get_users(args)
    if not users:
        abort_not_found(user_id, ns)
    user = extend_user(users[0], current_user_id)
    return success_response(user)


USER_ROUTE = "/<string:user_id>"


@ns.route(USER_ROUTE)
class User(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User""",
        params={"user_id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(user_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a single user."""
        user_id = decode_with_abort(user_id, ns)
        return get_single_user(user_id, None)


full_user_parser = reqparse.RequestParser()
full_user_parser.add_argument("user_id", required=False)


@full_ns.route(USER_ROUTE)
class FullUser(Resource):
    @record_metrics
    @full_ns.marshal_with(full_user_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        user_id = decode_with_abort(user_id, ns)
        args = full_user_parser.parse_args()
        current_user_id = get_current_user_id(args)

        return get_single_user(user_id, current_user_id)


full_user_handle_parser = reqparse.RequestParser()
full_user_handle_parser.add_argument("user_id", required=False)


@full_ns.route("/handle/<string:handle>")
class FullUserHandle(Resource):
    @record_metrics
    @full_ns.marshal_with(full_user_response)
    @cache(ttl_sec=5)
    def get(self, handle):
        args = full_user_handle_parser.parse_args()
        current_user_id = get_current_user_id(args)

        args = {"handle": handle, "current_user_id": current_user_id}
        users = get_users(args)
        if not users:
            abort_not_found(handle, ns)
        user = extend_user(users[0])
        return success_response(user)


USER_TRACKS_ROUTE = "/<string:user_id>/tracks"
user_tracks_route_parser = reqparse.RequestParser()
user_tracks_route_parser.add_argument("user_id", required=False)
user_tracks_route_parser.add_argument("limit", required=False, type=int)
user_tracks_route_parser.add_argument("offset", required=False, type=int)
user_tracks_route_parser.add_argument(
    "sort", required=False, type=str, default="date", choices=("date", "plays")
)

tracks_response = make_response(
    "tracks_response", ns, fields.List(fields.Nested(track))
)


@ns.route(USER_TRACKS_ROUTE)
class TrackList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Tracks""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
            "sort": "Sort mode",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(tracks_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset,
        }
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
        id="""Get User's Tracks""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
            "sort": "Sort mode",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(full_tracks_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch a list of tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset,
        }
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


@full_ns.route("/handle/<string:handle>/tracks")
class HandleFullTrackList(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get User's Tracks""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
            "sort": "Sort mode",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(full_tracks_response)
    @cache(ttl_sec=5)
    def get(self, handle):
        """Fetch a list of tracks for a user."""
        args = user_tracks_route_parser.parse_args()

        current_user_id = get_current_user_id(args)

        sort = args.get("sort", None)
        offset = format_offset(args)
        limit = format_limit(args)

        args = {
            "handle": handle,
            "current_user_id": current_user_id,
            "with_users": True,
            "filter_deleted": True,
            "sort": sort,
            "limit": limit,
            "offset": offset,
        }
        tracks = get_tracks(args)
        tracks = list(map(extend_track, tracks))
        return success_response(tracks)


USER_REPOSTS_ROUTE = "/<string:user_id>/reposts"

user_reposts_route_parser = reqparse.RequestParser()
user_reposts_route_parser.add_argument("user_id", required=False)
user_reposts_route_parser.add_argument("limit", required=False, type=int)
user_reposts_route_parser.add_argument("offset", required=False, type=int)

reposts_response = make_response(
    "reposts", ns, fields.List(fields.Nested(activity_model))
)


@ns.route(USER_REPOSTS_ROUTE)
class RepostList(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Reposts""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(reposts_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, ns)
        args = user_reposts_route_parser.parse_args()

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


full_reposts_response = make_full_response(
    "full_reposts", full_ns, fields.List(fields.Nested(activity_model_full))
)


@full_ns.route(USER_REPOSTS_ROUTE)
class FullRepostList(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get User's Reposts""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(full_reposts_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, ns)
        args = user_reposts_route_parser.parse_args()

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


@full_ns.route("/handle/<string:handle>/reposts")
class HandleFullRepostList(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get User's Reposts""",
        params={
            "user_id": "A User ID",
            "limit": "Limit",
            "offset": "Offset",
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(full_reposts_response)
    @cache(ttl_sec=5)
    def get(self, handle):
        args = user_reposts_route_parser.parse_args()

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


favorites_response = make_response(
    "favorites_response", ns, fields.List(fields.Nested(favorite))
)


@ns.route("/<string:user_id>/favorites")
class FavoritedTracks(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Favorite Tracks""",
        params={"user_id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(favorites_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch favorited tracks for a user."""
        decoded_id = decode_with_abort(user_id, ns)
        favorites = get_saves("tracks", decoded_id)
        favorites = list(map(extend_favorite, favorites))
        return success_response(favorites)


tags_route_parser = reqparse.RequestParser()
tags_route_parser.add_argument("user_id", required=False, type=str)
tags_route_parser.add_argument("limit", required=False, type=int)
tags_response = make_response("tags_response", ns, fields.List(fields.String))


@ns.route("/<string:user_id>/tags")
class MostUsedTags(Resource):
    @record_metrics
    @ns.doc(
        id="""Get User's Most Used Track Tags""",
        params={"user_id": "A User ID", "limit": "Limit on the number of tags"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(tags_route_parser)
    @ns.marshal_with(tags_response)
    @cache(ttl_sec=60 * 5)
    def get(self, user_id):
        """Fetch most used tags in a user's tracks."""
        decoded_id = decode_with_abort(user_id, ns)
        args = tags_route_parser.parse_args()
        limit = format_limit(args)
        tags = get_top_user_track_tags({"user_id": decoded_id, "limit": limit})
        return success_response(tags)


favorite_route_parser = reqparse.RequestParser()
favorite_route_parser.add_argument("user_id", required=False, type=str)
favorite_route_parser.add_argument("limit", required=False, type=int)
favorite_route_parser.add_argument("offset", required=False, type=int)
favorites_response = make_full_response(
    "favorites_response_full", full_ns, fields.List(fields.Nested(activity_model_full))
)


@full_ns.route("/<string:user_id>/favorites/tracks")
class FavoritedTracksFull(Resource):
    @record_metrics
    @full_ns.doc(
        id="""Get User's Favorite Tracks""",
        params={"user_id": "A User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.expect(favorite_route_parser)
    @full_ns.marshal_with(favorites_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        """Fetch favorited tracks for a user."""
        args = favorite_route_parser.parse_args()
        decoded_id = decode_with_abort(user_id, ns)
        current_user_id = get_current_user_id(args)

        offset = format_offset(args)
        limit = format_limit(args)
        get_tracks_args = {
            "filter_deleted": False,
            "user_id": decoded_id,
            "current_user_id": current_user_id,
            "limit": limit,
            "offset": offset,
            "with_users": True,
        }
        track_saves = get_save_tracks(get_tracks_args)
        tracks = list(map(extend_activity, track_saves))
        return success_response(tracks)


user_search_result = make_response(
    "user_search", ns, fields.List(fields.Nested(user_model))
)


@ns.route("/search")
class UserSearchResult(Resource):
    @record_metrics
    @ns.doc(
        id="""Search Users""",
        params={"query": "Search query"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(user_search_result)
    @ns.expect(search_parser)
    def get(self):
        """Seach for a user."""
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
        }
        response = search(search_args)
        users = response["users"]
        users = list(map(extend_user, users))
        return success_response(users)


followers_route_parser = reqparse.RequestParser()
followers_route_parser.add_argument("user_id", required=False)
followers_route_parser.add_argument("limit", required=False, type=int)
followers_route_parser.add_argument("offset", required=False, type=int)

followers_response = make_full_response(
    "followers_response", full_ns, fields.List(fields.Nested(user_model_full))
)


@full_ns.route("/<string:user_id>/followers")
class FollowerUsers(Resource):
    @record_metrics
    @ns.expect(followers_route_parser)
    @ns.doc(
        id="""All users that follow the provided user""",
        params={"user_id": "A User ID", "limit": "Limit", "offset": "Offset"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(followers_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        args = followers_route_parser.parse_args()
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


following_route_parser = reqparse.RequestParser()
following_route_parser.add_argument("user_id", required=False)
following_route_parser.add_argument("limit", required=False, type=int)
following_route_parser.add_argument("offset", required=False, type=int)
following_response = make_full_response(
    "following_response", full_ns, fields.List(fields.Nested(user_model_full))
)


@full_ns.route("/<string:user_id>/following")
class FollowingUsers(Resource):
    @record_metrics
    @full_ns.expect(following_route_parser)
    @full_ns.doc(
        id="""All users that the provided user follows""",
        params={"user_id": "A User ID", "limit": "Limit", "offset": "Offset"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(following_response)
    @cache(ttl_sec=5)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        args = following_route_parser.parse_args()
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


top_genre_users_route_parser = reqparse.RequestParser()
top_genre_users_route_parser.add_argument("genre", required=False, action="append")
top_genre_users_route_parser.add_argument("limit", required=False, type=int)
top_genre_users_route_parser.add_argument("offset", required=False, type=int)
top_genre_users_response = make_full_response(
    "top_genre_users_response", full_ns, fields.List(fields.Nested(user_model_full))
)


@full_ns.route("/genre/top")
class FullTopGenreUsers(Resource):
    @full_ns.expect(top_genre_users_route_parser)
    @full_ns.doc(
        id="""Get the Top Users for a Given Genre""",
        params={"genre": "List of Genres", "limit": "Limit", "offset": "Offset"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @full_ns.marshal_with(top_genre_users_response)
    @cache(ttl_sec=60 * 60 * 24)
    def get(self):
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


associated_wallet_route_parser = reqparse.RequestParser()
associated_wallet_route_parser.add_argument("id", required=True)
associated_wallet_response = make_response(
    "associated_wallets_response", ns, fields.Nested(associated_wallets)
)


@ns.route("/associated_wallets")
class UserIdByAssociatedWallet(Resource):
    @ns.expect(associated_wallet_route_parser)
    @ns.doc(
        id="""Get the User's id by associated wallet""",
        params={"id": "Encoded User ID"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(associated_wallet_response)
    @cache(ttl_sec=10)
    def get(self):
        args = associated_wallet_route_parser.parse_args()
        user_id = decode_with_abort(args.get("id"), ns)
        wallets = get_associated_user_wallet({"user_id": user_id})
        return success_response(
            {"wallets": wallets["eth"], "sol_wallets": wallets["sol"]}
        )


user_associated_wallet_route_parser = reqparse.RequestParser()
user_associated_wallet_route_parser.add_argument("associated_wallet", required=True)
user_associated_wallet_response = make_response(
    "user_associated_wallet_response", ns, fields.Nested(encoded_user_id)
)


@ns.route("/id")
class AssociatedWalletByUserId(Resource):
    @ns.expect(user_associated_wallet_route_parser)
    @ns.doc(
        id="""Get the User's associated wallets""",
        params={"associated_wallet": "Wallet address"},
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(user_associated_wallet_response)
    @cache(ttl_sec=10)
    def get(self):
        args = user_associated_wallet_route_parser.parse_args()
        user_id = get_associated_user_id({"wallet": args.get("associated_wallet")})
        return success_response(
            {"user_id": encode_int_id(user_id) if user_id else None}
        )


users_by_content_node_route_parser = reqparse.RequestParser()
users_by_content_node_route_parser.add_argument(
    "creator_node_endpoint", required=True, type=str
)
users_by_content_node_response = make_full_response(
    "users_by_content_node", full_ns, fields.List(fields.Nested(user_replica_set))
)


@full_ns.route("/content_node/<string:replica_type>")
class UsersByContentNode(Resource):
    @full_ns.marshal_with(users_by_content_node_response)
    # @cache(ttl_sec=30)
    def get(self, replica_type):
        """New route to call get_users_cnode with replica_type param (only consumed by content node)
        - Leaving `/users/creator_node` above untouched for backwards-compatibility

        Response = array of objects of schema { user_id, wallet, primary, secondary1, secondary2, primarySpId, secondary1SpID, secondary2SpID }
        """
        args = users_by_content_node_route_parser.parse_args()

        cnode_url = args.get("creator_node_endpoint")

        if replica_type == "primary":
            users = get_users_cnode(cnode_url, ReplicaType.PRIMARY)
        elif replica_type == "secondary":
            users = get_users_cnode(cnode_url, ReplicaType.SECONDARY)
        else:
            users = get_users_cnode(cnode_url, ReplicaType.ALL)

        return success_response(users)


get_challenges_route_parser = reqparse.RequestParser()
get_challenges_route_parser.add_argument(
    "show_historical", required=False, type=bool, default=False
)
get_challenges_response = make_response(
    "get_challenges", ns, fields.List(fields.Nested(challenge_response))
)


@ns.route("/<string:user_id>/challenges")
class GetChallenges(Resource):
    @ns.doc(
        id="""The users's ID""",
        params={
            "show_historical": "Whether to show challenges that are inactive but completed"
        },
        responses={200: "Success", 400: "Bad request", 500: "Server error"},
    )
    @ns.marshal_with(get_challenges_response)
    @cache(ttl_sec=5)
    def get(self, user_id: str):
        args = get_challenges_route_parser.parse_args()
        show_historical = args.get("show_historical")
        decoded_id = decode_with_abort(user_id, ns)
        db = get_db_read_replica()

        with db.scoped_session() as session:
            bus = setup_challenge_bus()
            challenges = get_challenges(decoded_id, show_historical, session, bus)
            challenges = list(map(extend_challenge_response, challenges))

            return success_response(challenges)
