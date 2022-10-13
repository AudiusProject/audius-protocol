import logging
from typing import List

from integration_tests.utils import populate_mock_db
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_track_remix_notification(app):
    with app.app_context():
        db = get_db()

    # Insert a track with remix_of and check that a notificaiton is created for the track remix owner
    entities = {
        "users": [{"user_id": 1}, {"user_id": 2}],
        "tracks": [
            {"track_id": 20, "owner_id": 1},
            {
                "track_id": 100,
                "owner_id": 2,
                "remix_of": {
                    "tracks": [{"parent_track_id": 20}],
                },
            },
        ],
    }
    populate_mock_db(db, entities)

    with db.scoped_session() as session:

        notifications: List[Notification] = session.query(Notification).all()
        assert len(notifications) == 1
        notification = notifications[0]
        assert notification.specifier == "2"
        assert notification.group_id == "remix:track:100:parent_track:20:blocknumber:1"
        assert notification.notification_group_id == None
        assert notification.type == "remix"
        assert notification.slot == None
        assert notification.blocknumber == 1
        assert notification.data == {
            "parent_track_id": 20,
            "track_id": 100,
        }
        assert notification.user_ids == [1]
