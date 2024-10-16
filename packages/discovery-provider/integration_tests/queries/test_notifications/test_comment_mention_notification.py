from integration_tests.utils import populate_mock_db
from src.queries.get_notifications import NotificationType, get_notifications
from src.utils.db_session import get_db

test_entities = {
    "users": [{"user_id": 1}, {"user_id": 2}, {"user_id": 3, "handle": "user3"}],
    "tracks": [{"track_id": 1, "owner_id": 1}],
    "comments": [
        {"comment_id": 1, "user_id": 2, "entity_id": 1, "text": "Hey"},
    ],
}


def test_comment_mention_notification(app):
    "When a user mentions another user in a comment, the mentioned user receives a notification"
    with app.app_context():
        db_mock = get_db()
        populate_mock_db(db_mock, test_entities, 0)

        test_actions = {
            "comment_mentions": [{"comment_id": 1, "user_id": 3}],
        }
        populate_mock_db(db_mock, test_actions, 1)

        with db_mock.scoped_session() as session:
            args = {"user_id": 3, "valid_types": [NotificationType.COMMENT_MENTION]}
            u3_notifications = get_notifications(session, args)
            assert len(u3_notifications) == 1

            notification = u3_notifications[0]
            assert notification["type"] == "comment_mention"
            assert notification["group_id"] == "comment_mention:1:type:Track"

            assert u3_notifications[0]["actions"][0]["data"] == {
                "entity_id": 1,
                "type": "Track",
                "entity_user_id": 1,
                "comment_user_id": 2,
            }


def test_track_owner_comment_mention_notification(app):
    "When a user mentions the track owner in a comment, they receive a comment_mention notification and not a comment notification"
    with app.app_context():
        db_mock = get_db()
        populate_mock_db(
            db_mock,
            {"comment_mentions": [{"comment_id": 1, "user_id": 1}], **test_entities},
            0,
        )

        with db_mock.scoped_session() as session:
            args = {
                "user_id": 1,
                "valid_types": [
                    NotificationType.COMMENT_MENTION,
                    NotificationType.COMMENT,
                ],
            }
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 1

            notification = u1_notifications[0]
            assert notification["type"] == "comment_mention"
            assert notification["group_id"] == "comment_mention:1:type:Track"

            assert u1_notifications[0]["actions"][0]["data"] == {
                "entity_id": 1,
                "type": "Track",
                "entity_user_id": 1,
                "comment_user_id": 2,
            }
