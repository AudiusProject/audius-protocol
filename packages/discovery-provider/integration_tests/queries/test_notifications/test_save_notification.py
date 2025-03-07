from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import get_notifications
from src.utils.db_session import get_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)


def test_get_save_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(10)],
            "tracks": [{"track_id": 1, "owner_id": 1}],
            "playlists": [{"playlist_id": 1, "playlist_owner_id": 1}],
        }
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "saves": [
                {"user_id": i + 2, "save_item_id": 1, "save_type": "track"}
                for i in range(4)
            ]
            + [
                {"user_id": i + 2, "save_item_id": 1, "save_type": "playlist"}
                for i in range(12)
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 3

            assert u1_notifications[0]["group_id"] == "save:1:type:playlist"
            assert u1_notifications[0]["is_seen"] == False
            assert len(u1_notifications[0]["actions"]) == 12
            for saver_user_id in range(2, 14):
                assert any(
                    act["data"]["user_id"] == saver_user_id
                    for act in u1_notifications[0]["actions"]
                )

            assert (
                u1_notifications[1]["group_id"]
                == "milestone:PLAYLIST_SAVE_COUNT:id:1:threshold:10"
            )
            assert u1_notifications[1]["is_seen"] == False
            assert u1_notifications[1]["actions"][0]["type"] == "milestone"
            assert (
                u1_notifications[1]["actions"][0]["data"]["type"]
                == "PLAYLIST_SAVE_COUNT"
            )
            assert u1_notifications[1]["actions"][0]["data"]["playlist_id"] == 1
            assert u1_notifications[1]["actions"][0]["data"]["threshold"] == 10

            assert u1_notifications[2]["group_id"] == "save:1:type:track"
            assert u1_notifications[2]["is_seen"] == False
            assert len(u1_notifications[2]["actions"]) == 4
            for saver_user_id in range(2, 6):
                assert any(
                    act["data"]["user_id"] == saver_user_id
                    for act in u1_notifications[2]["actions"]
                )
