from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db
from tests.utils import populate_mock_db


def test_get_trending_playlist_notifications(app):
    with app.app_context():
        db_mock = get_db()

    entities = {
        "users": [{"user_id": i + 1} for i in range(6)],
        "playlists": [
            {"playlist_id": 1, "playlist_owner_id": 1},
            {"playlist_id": 2, "playlist_owner_id": 2},
        ],
        "notification": [
            {
                "user_ids": [1],
                "type": "trending_playlist",
                "group_id": "group-id-1",
                "specifier": 1,
                "data": {
                    "time_range": "week",
                    "genre": "all",
                    "rank": "1",
                    "playlist_id": 1,
                },
            },
            {
                "user_ids": [2],
                "type": "trending_playlist",
                "group_id": "group-id-2",
                "specifier": 1,
                "data": {
                    "time_range": "week",
                    "genre": "all",
                    "rank": "2",
                    "playlist_id": 2,
                },
            },
        ],
    }
    populate_mock_db(db_mock, entities)

    # When valid_types is [] we don't select any trending_playlist notifications
    with db_mock.scoped_session() as session:
        args = {
            "limit": 10,
            "user_id": 1,
            "valid_types": [],
        }
        user1_notifications = get_notifications(session, args)
        assert len(user1_notifications) == 0

    # When valid_types is ["trending_playlist"] and user_id is 1,
    # select notifs for user1
    with db_mock.scoped_session() as session:
        args = {
            "limit": 10,
            "user_id": 1,
            "valid_types": [NotificationType.TRENDING_PLAYLIST],
        }

        user1_notifications = get_notifications(session, args)
        assert len(user1_notifications) == 1

        user1_notification = user1_notifications[0]
        assert user1_notification["type"] == "trending_playlist"

        notification_action = user1_notification["actions"][0]
        assert notification_action["data"]["rank"] == "1"
        assert notification_action["data"]["playlist_id"] == 1

    # When valid_types is ["trending_playlist"] and user_id is 2,
    # select notifs for user2
    with db_mock.scoped_session() as session:
        args = {
            "limit": 10,
            "user_id": 2,
            "valid_types": [NotificationType.TRENDING_PLAYLIST],
        }

        user2_notifications = get_notifications(session, args)
        assert len(user2_notifications) == 1

        user2_notification = user2_notifications[0]
        assert user2_notification["type"] == "trending_playlist"

        notification_action = user2_notification["actions"][0]
        assert notification_action["data"]["rank"] == "2"
        assert notification_action["data"]["playlist_id"] == 2
