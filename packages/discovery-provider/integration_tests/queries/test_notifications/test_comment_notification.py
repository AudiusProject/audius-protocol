from datetime import datetime, timedelta

from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import get_notifications
from src.utils.db_session import get_db

t1 = datetime(2020, 10, 10, 10, 35, 0)
t2 = t1 - timedelta(hours=1)
t3 = t1 - timedelta(hours=2)

test_entities = {
    "users": [{"user_id": i + 1} for i in range(10)],
    "tracks": [{"track_id": 1, "owner_id": 1}],
}


def test_get_comment_notification(app):
    with app.app_context():
        db_mock = get_db()
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "comments": [{"user_id": 2, "entity_id": 1, "entity_type": "Track"}]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1, "valid_types": ["comment"]}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 1
            assert u1_notifications[0]["type"] == "comment"
            assert u1_notifications[0]["group_id"] == "comment:1:type:Track"
            assert u1_notifications[0]["is_seen"] == False
            assert len(u1_notifications[0]["actions"]) == 1
            assert u1_notifications[0]["actions"][0]["data"]["entity_id"] == 1


def test_get_grouped_notification(app):
    with app.app_context():
        db_mock = get_db()
        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "comments": [
                {"user_id": i + 2, "entity_id": 1, "entity_type": "Track"}
                for i in range(4)
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1, "valid_types": ["comment"]}
            u1_notifications = get_notifications(session, args)

            # Assert all four notifications are grouped
            assert len(u1_notifications) == 1
            assert len(u1_notifications[0]["actions"]) == 4


def test_get_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_seen_entities = {
            **test_entities,
            "notification_seens": [{"user_id": 1, "seen_at": t2}],
        }
        populate_mock_db(db_mock, test_seen_entities)

        test_actions = {
            "comments": [
                {
                    "user_id": 2,
                    "entity_id": 1,
                    "entity_type": "Track",
                    "created_at": t3,
                },
                {
                    "user_id": 3,
                    "entity_id": 1,
                    "entity_type": "Track",
                    "created_at": t1,
                },
            ]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1, "valid_types": ["comment"]}
            u1_notifications = get_notifications(session, args)

            assert len(u1_notifications) == 2

            assert u1_notifications[0]["is_seen"] == False
            assert u1_notifications[1]["is_seen"] == True


# If track owner comments on their own track, they do not receive a notification
def test_get_owner_comment_notifications(app):
    with app.app_context():
        db_mock = get_db()

        populate_mock_db(db_mock, test_entities)

        test_actions = {
            "comments": [{"user_id": 1, "entity_id": 1, "entity_type": "Track"}]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1, "valid_types": ["comment"]}
            u1_notifications = get_notifications(session, args)

            assert len(u1_notifications) == 0


def test_muted_track_notification(app):
    with app.app_context():
        db_mock = get_db()
        populate_mock_db(
            db_mock,
            {
                **test_entities,
                "comment_notification_settings": [
                    {
                        "user_id": 1,
                        "entity_id": 1,
                        "entity_type": "Track",
                        "is_muted": True,
                    }
                ],
            },
        )

        test_actions = {
            "comments": [{"user_id": 2, "entity_id": 1, "entity_type": "Track"}]
        }
        populate_mock_db(db_mock, test_actions)

        with db_mock.scoped_session() as session:
            args = {"user_id": 1, "valid_types": ["comment"]}
            u1_notifications = get_notifications(session, args)

            assert len(u1_notifications) == 0
