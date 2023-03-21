from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import get_unread_notification_count
from src.utils.db_session import get_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)


def test_get_unread_notification_count(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(5)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "playlists": [{"playlist_id": 1, "playlist_owner_id": 1}],
            "notification_seens": [
                {"user_id": 1, "seen_at": t3},
            ],
        }

        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "follows": [
                {"follower_user_id": 2, "followee_user_id": 1, "created_at": t1}
            ],
            "reposts": [
                {
                    "user_id": 3,
                    "repost_item_id": 1,
                    "repost_type": "track",
                    "created_at": t2,
                },
                {
                    "user_id": 3,
                    "repost_item_id": 1,
                    "repost_type": "playlist",
                    "created_at": t3,
                },
            ],
            "saves": [
                {
                    "user_id": 4,
                    "save_item_id": 1,
                    "save_type": "track",
                    "created_at": t4,
                }
            ],
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1}
            unread_count = get_unread_notification_count(session, args)
            assert unread_count == 2

            args = {"user_id": 3}
            unread_count = get_unread_notification_count(session, args)
            assert unread_count == 0
