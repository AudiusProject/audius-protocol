from datetime import datetime, timedelta

from src.queries.get_notifications import get_notification_groups, get_notifications
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)
t4 = t1 - timedelta(hours=3)


def test_get_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(4)],
            "follows": [
                {"follower_user_id": i + 2, "followee_user_id": i + 1, "created_at": t2}
                for i in range(3)
            ],
            "notification_seens": [
                {"user_id": 1, "seen_at": t3},
                {"user_id": 1, "seen_at": t1},
                {"user_id": 3, "seen_at": t3},
            ],
        }

        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            args = {"limit": 10, "user_id": 1}
            u1_notification_groups = get_notification_groups(session, args)
            assert len(u1_notification_groups) == 1
            assert u1_notification_groups[0]["group_id"] == "follow:1"
            assert u1_notification_groups[0]["is_seen"] == True
            assert u1_notification_groups[0]["seen_at"] == t1
            assert u1_notification_groups[0]["prev_seen_at"] == t3
            assert u1_notification_groups[0]["count"] == 1

            # Test fetching a notification when a view is before and after
            u1_notifications = get_notifications(session, args)
            assert u1_notifications[0]["group_id"] == "follow:1"
            assert u1_notifications[0]["is_seen"] == True
            assert u1_notifications[0]["seen_at"] == t1
            assert u1_notifications[0]["actions"] == [
                {
                    "specifier": "2",
                    "type": "follow",
                    "group_id": "follow:1",
                    "timestamp": t2,
                    "data": {"follower_user_id": 2, "followee_user_id": 1},
                }
            ]

            # Test fetching a notification when there are no views
            u2_args = {"limit": 10, "user_id": 2}
            u2_notification_groups = get_notification_groups(session, u2_args)
            assert len(u2_notification_groups) == 1
            assert u2_notification_groups[0]["group_id"] == "follow:2"
            assert u2_notification_groups[0]["is_seen"] == False
            assert u2_notification_groups[0]["seen_at"] == None
            assert u2_notification_groups[0]["prev_seen_at"] == None
            assert u2_notification_groups[0]["count"] == 1

            # Test fetching a notification when there is only a view after
            u3_args = {"limit": 10, "user_id": 3}
            u3_notifiations = get_notifications(session, u3_args)
            assert u3_notifiations[0]["group_id"] == "follow:3"
            assert u3_notifiations[0]["is_seen"] == False
            assert u3_notifiations[0]["actions"] == [
                {
                    "specifier": "4",
                    "timestamp": t2,
                    "type": "follow",
                    "group_id": "follow:3",
                    "data": {"follower_user_id": 4, "followee_user_id": 3},
                }
            ]


def test_get_many_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(20)],
            "follows": [
                {"follower_user_id": i + 2, "followee_user_id": 1, "created_at": t1}
                for i in range(4)
            ]
            + [
                {"follower_user_id": i + 2, "followee_user_id": 1, "created_at": t3}
                for i in range(4, 8)
            ],
            "notification_seens": [{"user_id": 1, "seen_at": t2}],
        }

        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 2
            assert u1_notifications[0]["group_id"] == "follow:1"
            assert u1_notifications[0]["is_seen"] == False
            assert len(u1_notifications[0]["actions"]) == 4
            for user_id_follower in range(2, 6):
                assert any(
                    act["data"]["follower_user_id"] == user_id_follower
                    for act in u1_notifications[0]["actions"]
                )

            assert u1_notifications[1]["group_id"] == "follow:1"
            assert u1_notifications[1]["is_seen"] == True
            assert u1_notifications[1]["seen_at"] == t2
            assert len(u1_notifications[1]["actions"]) == 4
            for user_id_follower in range(6, 10):
                assert any(
                    act["data"]["follower_user_id"] == user_id_follower
                    for act in u1_notifications[1]["actions"]
                )
