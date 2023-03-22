import logging

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


def assert_notification(
    notification, group_id, is_seen, actions_length, reposter_user_ids
):
    assert notification["group_id"] == group_id
    assert notification["is_seen"] == is_seen
    assert len(notification["actions"]) == actions_length
    for reposter_user_id in reposter_user_ids:
        assert any(
            action["data"]["user_id"] == reposter_user_id
            for action in notification["actions"]
        )


def test_get_save_of_repost_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(6)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "playlists": [{"playlist_id": 1, "playlist_owner_id": 1}],
            "follows": [
                {"follower_user_id": 4, "followee_user_id": 1},
                {"follower_user_id": 2, "followee_user_id": 4},
                {"follower_user_id": 3, "followee_user_id": 4},
                {"follower_user_id": 3, "followee_user_id": 5},
                {"follower_user_id": 5, "followee_user_id": 3},
            ],
        }
        populate_mock_db(db_mock, test_entities)

        test_reposts = {
            "reposts": [
                {"user_id": 4, "repost_item_id": 1, "repost_type": "track"},
                {"user_id": 4, "repost_item_id": 1, "repost_type": "playlist"},
            ]
        }
        test_saves = {
            "saves": [
                {
                    "user_id": 2,
                    "save_item_id": 1,
                    "save_type": "track",
                    "is_save_of_repost": True,
                },
                {
                    "user_id": 3,
                    "save_item_id": 1,
                    "save_type": "track",
                    "is_save_of_repost": True,
                },
                {
                    "user_id": 3,
                    "save_item_id": 1,
                    "save_type": "playlist",
                    "is_save_of_repost": True,
                },
                {
                    "user_id": 5,
                    "save_item_id": 1,
                    "save_type": "playlist",
                    "is_save_of_repost": True,
                },
            ],
        }
        populate_mock_db(db_mock, test_reposts)
        populate_mock_db(db_mock, test_saves)

        with db_mock.scoped_session() as session:
            args = {
                "limit": 10,
                "user_id": 4,
                "valid_types": [NotificationType.SAVE_OF_REPOST],
            }
            user4_notifications = get_notifications(session, args)
            assert len(user4_notifications) == 3
            assert_notification(
                notification=user4_notifications[0],
                group_id="save_of_repost:1:type:playlist",
                is_seen=False,
                actions_length=1,
                reposter_user_ids=[3],
            )
            assert_notification(
                notification=user4_notifications[1],
                group_id="save_of_repost:1:type:track",
                is_seen=False,
                actions_length=2,
                reposter_user_ids=[2, 3],
            )
            assert "save_of_repost" not in user4_notifications[2]["group_id"]

            args = {
                "limit": 10,
                "user_id": 3,
                "valid_types": [NotificationType.SAVE_OF_REPOST],
            }
            user3_notifications = get_notifications(session, args)
            for notif in user3_notifications:
                assert "save_of_repost" not in notif["group_id"]

            args = {
                "limit": 10,
                "user_id": 1,
                "valid_types": [NotificationType.SAVE_OF_REPOST],
            }
            user1_notifications = get_notifications(session, args)
            for notif in user1_notifications:
                assert "save_of_repost" not in notif["group_id"]
