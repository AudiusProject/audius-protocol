import logging

from src.queries.get_notifications import (
    get_notifications,
    get_unread_notification_count,
)
from src.utils.db_session import get_db
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


def test_get_announcement_notifications(app):
    with app.app_context():
        db_mock = get_db()

        test_entities = {
            "users": [{"user_id": i + 1} for i in range(20)],
            "notification": [
                {
                    "type": "track_added_to_playlist",
                    "group_id": "track_added_to_playlist:playlist_id:1230335492:track_id:1553038297:blocknumber:41260831",
                    "specifier": "1",
                    "data": {"track_id": 23, "playlist_id": 32, "playlist_owner_id": 3},
                    "user_ids": [1],
                },
            ],
        }
        populate_mock_db(db_mock, test_entities)

        with db_mock.scoped_session() as session:
            unread_count = get_unread_notification_count(session, {"user_id": 1})
            assert unread_count == 1
            args = {"limit": 10, "user_id": 1}
            u1_notifications = get_notifications(session, args)
            assert len(u1_notifications) == 1
            assert u1_notifications[0]["type"] == "track_added_to_playlist"
            assert (
                u1_notifications[0]["group_id"]
                == "track_added_to_playlist:playlist_id:1230335492:track_id:1553038297:blocknumber:41260831"
            )
            assert len(u1_notifications[0]["actions"]) == 1
            assert u1_notifications[0]["actions"][0]["data"] == {
                "track_id": 23,
                "playlist_id": 32,
                "playlist_owner_id": 3,
            }
