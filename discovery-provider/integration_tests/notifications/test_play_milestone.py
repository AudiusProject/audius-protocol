import logging
from typing import List

from integration_tests.utils import populate_mock_db
from sqlalchemy import desc
from src.models.notifications.notification import Notification
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)


# ========================================== Start Tests ==========================================
def test_play_milsetone_notification(app):
    with app.app_context():
        db = get_db()

    # Insert plays and check that a notificaiton is created for the milestone thresholds
    entities = {
        "users": [{"user_id": 1}, {"user_id": 2}],
        "tracks": [{"track_id": 100, "owner_id": 2}],
    }
    populate_mock_db(db, entities)
    entities = {
        "plays": [{"user_id": 1, "item_id": 100, "id": i + 1} for i in range(50)],
    }
    populate_mock_db(db, entities)
    with db.scoped_session() as session:

        notifications: List[Notification] = (
            session.query(Notification).order_by(desc(Notification.slot)).all()
        )
        assert len(notifications) == 3
        assert (
            notifications[0].specifier == "milestone:LISTEN_COUNT:id:100:threshold:50"
        )
        assert notifications[0].notification_group_id == None
        assert notifications[0].type == "milestone"
        assert notifications[0].slot == 50
        assert notifications[0].blocknumber == None
        assert notifications[0].data == {
            "type": "LISTEN_COUNT",
            "track_id": 100,
            "threshold": 50,
        }
        assert notifications[0].user_ids == [2]

        assert (
            notifications[1].specifier == "milestone:LISTEN_COUNT:id:100:threshold:25"
        )
        assert (
            notifications[2].specifier == "milestone:LISTEN_COUNT:id:100:threshold:10"
        )
