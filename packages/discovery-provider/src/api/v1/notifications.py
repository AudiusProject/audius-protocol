import logging
from datetime import datetime

from flask_restx import Namespace, Resource, fields

from src.api.v1.helpers import (
    decode_with_abort,
    make_full_response,
    notifications_parser,
    success_response,
)
from src.api.v1.models.notifications import notifications, playlist_updates
from src.api.v1.utils.extend_notification import extend_notification
from src.queries.get_notifications import (
    get_notifications,
    get_unread_notification_count,
)
from src.queries.get_user_playlist_update import (
    PlaylistUpdate,
    get_user_playlist_update,
)
from src.utils.db_session import get_db_read_replica
from src.utils.helpers import encode_int_id

logger = logging.getLogger(__name__)


full_ns = Namespace("notifications", description="Notifications related operations")

notifications_response = make_full_response(
    "notifications_response", full_ns, fields.Nested(notifications)
)

playlist_updates_response = make_full_response(
    "playlist_updates_response", full_ns, fields.Nested(playlist_updates)
)


@full_ns.route("/<string:user_id>", doc=False)
class GetNotifications(Resource):
    @full_ns.doc(
        id="""Get notifications for user ID""",
        description="""Get notifications for user ID""",
    )
    @full_ns.expect(notifications_parser)
    @full_ns.marshal_with(notifications_response)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        parsed_args = notifications_parser.parse_args()
        args = {
            "user_id": decoded_id,
            "timestamp": (
                datetime.fromtimestamp(parsed_args.get("timestamp"))
                if parsed_args.get("timestamp")
                else None
            ),
            "group_id": parsed_args.get("group_id"),
            "limit": parsed_args.get("limit"),
            "valid_types": parsed_args.get("valid_types") or [],
        }
        unread_args = {
            "user_id": decoded_id,
            "valid_types": parsed_args.get("valid_types") or [],
        }
        db = get_db_read_replica()
        with db.scoped_session() as session:
            notifications = get_notifications(session, args)
            formatted_notifications = list(map(extend_notification, notifications))
            unread_count = get_unread_notification_count(session, unread_args)
            return success_response(
                {"notifications": formatted_notifications, "unread_count": unread_count}
            )


def extend_playlist_update(playlist_seen: PlaylistUpdate):
    playlist_id = encode_int_id(playlist_seen["playlist_id"])
    updated_at = datetime.timestamp(playlist_seen["updated_at"])
    last_seen_at = (
        datetime.timestamp(playlist_seen["last_seen_at"])
        if playlist_seen["last_seen_at"]
        else playlist_seen["last_seen_at"]
    )

    return {
        "playlist_id": playlist_id,
        "updated_at": updated_at,
        "last_seen_at": last_seen_at,
    }


@full_ns.route("/<string:user_id>/playlist_updates", doc=False)
class GetPlaylistUpdates(Resource):
    @full_ns.doc(
        id="""Get playlists the user has saved that have been updated for user ID""",
        description="""Get playlists the user has saved that have been updated for user ID""",
    )
    @full_ns.marshal_with(playlist_updates_response)
    def get(self, user_id):
        decoded_id = decode_with_abort(user_id, full_ns)
        playlist_updates = get_user_playlist_update(decoded_id)
        formatted_playlist_updates = list(map(extend_playlist_update, playlist_updates))
        return success_response({"playlist_updates": formatted_playlist_updates})
