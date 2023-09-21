from flask_restx import fields

from .common import ns


class Any(fields.Raw):
    def format(self, value):
        return value


notification_action = ns.model(
    "notification_action",
    {
        "specifier": fields.String(required=True),
        "timestamp": fields.Integer(required=True),
        "data": Any,
    },
)

notification = ns.model(
    "notification",
    {
        "type": fields.String(required=True),
        "group_id": fields.String(required=True),
        "is_seen": fields.Boolean(required=True),
        "seen_at": fields.Integer(required=False),
        "actions": fields.List(fields.Nested(notification_action)),
    },
)

notifications = ns.model(
    "notifications",
    {
        "notifications": fields.List(fields.Nested(notification)),
        "unread_count": fields.Integer(required=True),
    },
)

playlist_update = ns.model(
    "playlist_update",
    {
        "playlist_id": fields.String(required=True),
        "updated_at": fields.Integer(required=True),
        "last_seen_at": fields.Integer(required=False),
    },
)

playlist_updates = ns.model(
    "playlist_updates",
    {"playlist_updates": fields.List(fields.Nested(playlist_update))},
)
