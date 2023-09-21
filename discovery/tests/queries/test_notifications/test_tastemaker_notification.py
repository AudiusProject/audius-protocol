import logging

from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


def assert_notification(
    notification, group_id, is_seen, actions_length, user_ids_to_notify
):
    assert notification["group_id"] == group_id
    assert notification["is_seen"] == is_seen
    assert len(notification["actions"]) == actions_length
    for user_id in user_ids_to_notify:
        assert any(
            action["data"]["tastemaker_user_id"] == user_id
            for action in notification["actions"]
        )


def test_get_tastemaker_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(6)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "playlists": [{"playlist_id": 1, "playlist_owner_id": 1}],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "notification": [
                {
                    "user_ids": [2],
                    "type": "tastemaker",
                    "group_id": "fake-group-id",
                    "specifier": 1,
                    "data": {
                        "tastemaker_item_id": 1,
                        "tastemaker_item_owner_id": 1,
                        "action": "repost",
                        "tastemaker_item_type": "track",
                        "tastemaker_user_id": 2,
                    },
                },
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [],
            }
            user2_notifications = get_notifications(session, args)
            for notification in user2_notifications:
                assert notification["type"] != "tastemaker"

            args = {
                "limit": 10,
                "user_id": 2,
                "valid_types": [NotificationType.TASTEMAKER],
            }
            user2_notifications = get_notifications(session, args)
            assert len(user2_notifications) == 1
            assert_notification(
                notification=user2_notifications[0],
                group_id="fake-group-id",
                is_seen=False,
                actions_length=1,
                user_ids_to_notify=[2],
            )
